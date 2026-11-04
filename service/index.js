const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const uuid = require('uuid');
const fs = require('node:fs/promises');
const path = require('node:path');

const app = express();
const authCookieName = 'token';
const users = [];
const userStorePath = path.join(__dirname, 'data', 'users.json');
const scoreStorePath = path.join(__dirname, 'data', 'scores.json');
let userWriteQueue = Promise.resolve();
let scores = [];
let scoreStoreDate = getMountainDateKey();
const reverseGeocodeCache = new Map();
let nominatimRequestQueue = Promise.resolve();
let lastNominatimRequestAt = 0;
const archives = [
  {
    date: '2026-11-01',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    city: 'Scarborough',
    country: 'Canada',
    latitude: 43.7764,
    longitude: -79.2318,
    albumCover: 'https://cdn-images.dzcdn.net/images/cover/fd00ebd6d30d7253f813dba3bb1c66a9/250x250-000000-80-0-0.jpg',
  },
  {
    date: '2026-11-02',
    title: "Hips Don't Lie",
    artist: 'Shakira',
    city: 'Barranquilla',
    country: 'Colombia',
    latitude: 10.9639,
    longitude: -74.7964,
    albumCover: 'https://cdn-images.dzcdn.net/images/cover/b570890728621ec68d5c5558164c3945/250x250-000000-80-0-0.jpg',
  },
  {
    date: '2026-11-03',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    city: 'Halifax',
    country: 'United Kingdom',
    latitude: 53.721,
    longitude: -1.858,
    albumCover: 'https://cdn-images.dzcdn.net/images/cover/107c2b43f10c249077c1f7618563bb63/250x250-000000-80-0-0.jpg',
  },
  {
    date: '2026-11-04',
    title: 'Suzanna',
    artist: 'Sauti Sol',
    city: 'Nairobi',
    country: 'Kenya',
    latitude: -1.286389,
    longitude: 36.817223,
    albumCover: 'https://cdn-images.dzcdn.net/images/cover/c4f0888eeaf101a016ab3d43a612a404/250x250-000000-80-0-0.jpg',
  },
];

app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

app.post('/api/auth/create', async (req, res) => {
  const { email, password } = req.body;
  if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
    return res.status(400).send({ msg: 'Email and password are required' });
  }
  if (await findUser('email', email)) {
    return res.status(409).send({ msg: 'Existing user' });
  }

  try {
    const user = await createUser(email, password);
    setAuthCookie(res, user.token);
    res.send({ email: user.email });
  } catch (error) {
    console.error('Unable to save the new user account:', error);
    res.status(500).send({ msg: 'Could not save your account. Please try again.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await findUser('email', email);
  if (!user || typeof password !== 'string' || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).send({ msg: 'Unauthorized' });
  }

  user.token = uuid.v4();
  setAuthCookie(res, user.token);
  res.send({ email: user.email });
});

app.delete('/api/auth/logout', async (req, res) => {
  const user = await findUser('token', req.cookies[authCookieName]);
  if (user) {
    delete user.token;
  }
  res.clearCookie(authCookieName);
  res.status(204).end();
});

app.get('/api/user/me', verifyAuth, (req, res) => {
  res.send({ email: req.authenticatedUser.email });
});

app.get('/api/archives', verifyAuth, (req, res) => {
  const { start, end } = req.query;
  if (!isDateKey(start) || !isDateKey(end) || start > end) {
    return res.status(400).send({ msg: 'Valid start and end dates are required' });
  }

  res.send(archives.filter((archive) => archive.date >= start && archive.date <= end));
});

app.get('/api/location/reverse', verifyAuth, async (req, res, next) => {
  const latitude = Number(req.query.latitude);
  const longitude = Number(req.query.longitude);
  if (
    !Number.isFinite(latitude)
    || latitude < -90
    || latitude > 90
    || !Number.isFinite(longitude)
    || longitude < -180
    || longitude > 180
  ) {
    return res.status(400).send({ msg: 'Valid latitude and longitude are required' });
  }

  const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
  if (reverseGeocodeCache.has(cacheKey)) {
    return res.send(reverseGeocodeCache.get(cacheKey));
  }

  try {
    const nominatimUrl = new URL('https://nominatim.openstreetmap.org/reverse');
    nominatimUrl.searchParams.set('format', 'jsonv2');
    nominatimUrl.searchParams.set('addressdetails', '1');
    nominatimUrl.searchParams.set('zoom', '10');
    nominatimUrl.searchParams.set('lat', latitude.toString());
    nominatimUrl.searchParams.set('lon', longitude.toString());
    const response = await scheduleNominatimRequest(nominatimUrl);
    if (!response.ok) {
      return res.status(502).send({ msg: 'Could not look up this place right now' });
    }

    const data = await response.json();
    const address = data.address || {};
    const place = {
      city: address.city
        || address.town
        || address.village
        || address.municipality
        || address.hamlet
        || address.county
        || '',
      country: address.country || '',
    };
    if (reverseGeocodeCache.size >= 500) {
      reverseGeocodeCache.delete(reverseGeocodeCache.keys().next().value);
    }
    reverseGeocodeCache.set(cacheKey, place);
    res.send(place);
  } catch (error) {
    next(error);
  }
});

app.get('/api/music/deezer/search', async (req, res, next) => {
  const query = req.query.q;
  if (typeof query !== 'string' || !query.trim()) {
    return res.status(400).send({ msg: 'A Deezer search query is required' });
  }

  try {
    const deezerUrl = new URL('https://api.deezer.com/search');
    deezerUrl.searchParams.set('q', query);
    deezerUrl.searchParams.set('limit', '10');
    const response = await fetch(deezerUrl);
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).send({ msg: 'Deezer search failed' });
    }
    res.send(data);
  } catch (error) {
    next(error);
  }
});

app.get('/api/scores', (_req, res) => {
  res.send(getPublicScores());
});

app.post('/api/score', verifyAuth, async (req, res) => {
  const { score } = req.body;
  if (!Number.isFinite(score) || score < 0) {
    return res.status(400).send({ msg: 'A non-negative score is required' });
  }

  const date = getMountainDateKey();
  const previousScores = scores;
  const previousDate = scoreStoreDate;
  if (date !== scoreStoreDate) {
    scores = [];
    scoreStoreDate = date;
  }
  const user = req.authenticatedUser;
  scores = updateScores({ name: getPublicName(user.email), score });
  try {
    await persistScores();
    res.send(getPublicScores());
  } catch (error) {
    scores = previousScores;
    scoreStoreDate = previousDate;
    console.error('Unable to save the daily leaderboard:', error);
    res.status(500).send({ msg: 'Could not save your score. Please try again.' });
  }
});

app.get('/api/health', (req, res) => {
  res.send({ status: 'ok' });
});

async function createUser(email, password) {
  const user = {
    email,
    password: await bcrypt.hash(password, 10),
    token: uuid.v4(),
  };
  users.push(user);
  try {
    await persistUsers();
  } catch (error) {
    users.splice(users.indexOf(user), 1);
    throw error;
  }
  return user;
}

async function loadUsers() {
  let contents;
  try {
    contents = await fs.readFile(userStorePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return;
    }
    throw error;
  }

  const savedUsers = JSON.parse(contents);
  if (!Array.isArray(savedUsers) || savedUsers.some((user) => (
    !user
    || typeof user.email !== 'string'
    || typeof user.password !== 'string'
  ))) {
    throw new Error('The saved user account file has an invalid format.');
  }

  users.push(...savedUsers.map(({ email, password }) => ({ email, password })));
}

async function loadScores() {
  let contents;
  try {
    contents = await fs.readFile(scoreStorePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return;
    }
    throw error;
  }

  const savedScores = JSON.parse(contents);
  if (
    !savedScores
    || !isDateKey(savedScores.date)
    || !Array.isArray(savedScores.scores)
    || savedScores.scores.some((entry) => (
      !entry
      || typeof entry.name !== 'string'
      || !Number.isFinite(entry.score)
      || entry.score < 0
    ))
  ) {
    throw new Error('The saved leaderboard file has an invalid format.');
  }

  if (savedScores.date === getMountainDateKey()) {
    scoreStoreDate = savedScores.date;
    scores = savedScores.scores.slice(0, 10);
  }
}

function persistScores() {
  const writeScores = async () => {
    await fs.mkdir(path.dirname(scoreStorePath), { recursive: true });
    const temporaryPath = `${scoreStorePath}.${process.pid}.tmp`;
    const savedScores = JSON.stringify({ date: scoreStoreDate, scores }, null, 2);
    await fs.writeFile(temporaryPath, savedScores, 'utf8');
    await fs.rename(temporaryPath, scoreStorePath);
  };
  userWriteQueue = userWriteQueue.then(writeScores, writeScores);
  return userWriteQueue;
}

function persistUsers() {
  const writeUsers = async () => {
    await fs.mkdir(path.dirname(userStorePath), { recursive: true });
    const temporaryPath = `${userStorePath}.${process.pid}.tmp`;
    const savedUsers = users.map(({ email, password }) => ({ email, password }));
    await fs.writeFile(temporaryPath, JSON.stringify(savedUsers, null, 2), 'utf8');
    await fs.rename(temporaryPath, userStorePath);
  };
  userWriteQueue = userWriteQueue.then(writeUsers, writeUsers);
  return userWriteQueue;
}

async function findUser(field, value) {
  if (!value) {
    return null;
  }
  return users.find((user) => user[field] === value) ?? null;
}

async function verifyAuth(req, res, next) {
  const user = await findUser('token', req.cookies[authCookieName]);
  if (!user) {
    return res.status(401).send({ msg: 'Unauthorized' });
  }
  req.authenticatedUser = user;
  next();
}

function setAuthCookie(res, token) {
  res.cookie(authCookieName, token, {
    maxAge: 1000 * 60 * 60 * 24 * 365,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
  });
}

function updateScores(newScore) {
  return [...scores, newScore]
    .sort((first, second) => second.score - first.score)
    .slice(0, 10);
}

function getPublicName(email) {
  const localPart = email.split('@')[0];
  return localPart.split('.')[0] || 'Player';
}

function getPublicScores() {
  return scores.map(({ name, score }) => ({
    name: getPublicName(name),
    score,
  }));
}

function isDateKey(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsedDate = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsedDate.getTime())
    && parsedDate.toISOString().slice(0, 10) === value;
}

function getMountainDateKey() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Denver',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const dateParts = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
}

function scheduleNominatimRequest(url) {
  const request = nominatimRequestQueue.then(async () => {
    const wait = Math.max(0, 1000 - (Date.now() - lastNominatimRequestAt));
    if (wait > 0) {
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    lastNominatimRequestAt = Date.now();
    return fetch(url, {
      headers: { 'User-Agent': 'TuneCatcher/1.0 (reverse geocoding)' },
    });
  });
  nominatimRequestQueue = request.then(() => undefined, () => undefined);
  return request;
}

const port = process.argv.length > 2 ? process.argv[2] : 4000;
Promise.all([loadUsers(), loadScores()]).then(() => {
  app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
}).catch((error) => {
  console.error('Could not load saved user accounts:', error);
  process.exitCode = 1;
});

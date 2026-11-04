const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const uuid = require('uuid');

const app = express();
const authCookieName = 'token';
const users = [];
let scores = [];
const archives = [
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

  const user = await createUser(email, password);
  setAuthCookie(res, user.token);
  res.send({ email: user.email });
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

app.get('/api/archives', verifyAuth, async (req, res, next) => {
  if (!archivesCollection) {
    return res.status(503).send({ msg: 'Archive storage is not configured' });
  }

  const { start, end } = req.query;
  if (!isDateKey(start) || !isDateKey(end) || start > end) {
    return res.status(400).send({ msg: 'Valid start and end dates are required' });
  }

  try {
    const archives = await archivesCollection.find(
      { date: { $gte: start, $lte: end } },
      { projection: { _id: 0 } },
    ).sort({ date: 1 }).toArray();
    res.send(archives);
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

app.get('/api/scores', verifyAuth, (_req, res) => {
  res.send(getPublicScores());
});

app.post('/api/score', verifyAuth, (req, res) => {
  const { score } = req.body;
  if (!Number.isFinite(score) || score < 0) {
    return res.status(400).send({ msg: 'A non-negative score is required' });
  }

  const user = req.authenticatedUser;
  scores = updateScores({ name: getPublicName(user.email), score });
  res.send(getPublicScores());
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
  return user;
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

const port = process.argv.length > 2 ? process.argv[2] : 4000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const uuid = require('uuid');

const app = express();
const authCookieName = 'token';
const users = [];
let scores = [];

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

app.get('/api/scores', verifyAuth, (_req, res) => {
  res.send(scores);
});

app.post('/api/score', verifyAuth, (req, res) => {
  const { score } = req.body;
  if (!Number.isFinite(score) || score < 0) {
    return res.status(400).send({ msg: 'A non-negative score is required' });
  }

  const user = req.authenticatedUser;
  scores = updateScores({ name: user.email, score });
  res.send(scores);
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

const port = process.argv.length > 2 ? process.argv[2] : 4000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

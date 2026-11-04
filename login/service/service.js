const express = require('express');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const app = express();

const users = [];
const sessions = new Map();
const cookieOptions = { httpOnly: true, sameSite: 'lax' };

async function createUser(email, password) {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = {
    email: email,
    password: passwordHash,
  };

  users.push(user);
  return user;
}

function getUser(field, value) {
  if (value) {
    return users.find((user) => user[field] === value);
  }
  return null;
}

app.use(express.json());
app.use(cookieParser());

// registration
app.post('/api/auth', async (req, res) => {
  if (await getUser('email', req.body.email)) {
    res.status(409).send({ msg: 'Existing user' });
  } else {
    const user = await createUser(req.body.email, req.body.password);
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, user.email);
    res.cookie('auth', token, cookieOptions);
    res.send({ email: user.email });
  }
});

// login
app.put('/api/auth', async (req, res) => {
  const user = await getUser('email', req.body.email);
  if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
    return res.status(401).send({ msg: 'Unauthorized' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, user.email);
  res.cookie('auth', token, cookieOptions);
  res.send({ email: user.email });
});

// logout
app.delete('/api/auth', async (req, res) => {
  const token = req.cookies.auth;
  if (token) {
    sessions.delete(token);
  }
  res.clearCookie('auth', cookieOptions);
  res.send({});
});

// getMe
app.get('/api/user', async (req, res) => {
  const email = sessions.get(req.cookies.auth);
  const user = await getUser('email', email);
  if (!user) {
    return res.status(401).send({ msg: 'Unauthorized' });
  }
  res.send({ email: user.email });
});

const port = 3000;
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
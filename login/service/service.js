const express = require('express');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const uuid = require('uuid');
const app = express();

const users = [];
const cookieOptions = {
  secure: true,
  httpOnly: true,
  sameSite: 'strict',
};

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

function setAuthCookie(res, user) {
  user.token = uuid.v4();
  res.cookie('token', user.token, cookieOptions);
}

app.use(express.json());
app.use(cookieParser());

// registration
app.post('/api/auth', async (req, res) => {
  if (await getUser('email', req.body.email)) {
    res.status(409).send({ msg: 'Existing user' });
  } else {
    const user = await createUser(req.body.email, req.body.password);
    setAuthCookie(res, user);
    res.send({ email: user.email });
  }
});

// login
app.put('/api/auth', async (req, res) => {
  const user = await getUser('email', req.body.email);
  if (user && (await bcrypt.compare(req.body.password, user.password))) {
    setAuthCookie(res, user);
    res.send({ email: user.email });
  } else {
    res.status(401).send({ msg: 'Unauthorized' });
  }
});

// logout
app.delete('/api/auth', async (req, res) => {
  const user = getUser('token', req.cookies.token);
  if (user) {
    delete user.token;
  }
  res.clearCookie('token', cookieOptions);
  res.send({});
});

// getMe
app.get('/api/user', async (req, res) => {
  const user = getUser('token', req.cookies.token);
  if (!user) {
    return res.status(401).send({ msg: 'Unauthorized' });
  }
  res.send({ email: user.email });
});

const port = 3000;
app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
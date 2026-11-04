import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import './main.css';

function App() {
  return (
    <BrowserRouter>
      <main>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  async function createAuth(method) {
    try {
      const res = await fetch('/api/auth', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      await res.json();
      if (res.ok) {
        navigate('/profile');
      } else {
        alert('Authentication failed');
      }
    } catch {
      alert('Unable to reach the authentication service');
    }
  }

  return (
    <div>
      <h1>Login</h1>
      <div>
        <label htmlFor="email">Email:</label>
        <input
          id="email"
          type="text"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="password">Password:</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>
      <button
        type="button"
        disabled={!(email && password)}
        onClick={() => createAuth('PUT')}
      >
        Login
      </button>
      <button
        type="button"
        disabled={!(email && password)}
        onClick={() => createAuth('POST')}
      >
        Register
      </button>
    </div>
  );
}

function Profile() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = React.useState(null);

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/user/me');
        if (res.status === 401) {
          navigate('/');
          return;
        }
        const data = await res.json();
        if (!res.ok) {
          throw new Error('Unable to load user profile');
        }
        if (active) {
          setUserInfo(data);
        }
      } catch {
        if (active) {
          alert('Unable to load user profile');
          navigate('/');
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [navigate]);

  async function handleLogout() {
    try {
      const res = await fetch('/api/auth', { method: 'DELETE' });
      if (!res.ok) {
        throw new Error('Unable to log out');
      }
      navigate('/');
    } catch {
      alert('Unable to log out');
    }
  }

  return (
    <div>
      <h1>Profile</h1>
      <div>Logged in as: {userInfo?.email ?? ''}</div>
      <button type="button" onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

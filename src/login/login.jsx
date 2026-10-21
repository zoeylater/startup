import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login({ user, initialUsername, onLogin, onLogout }) {
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setUsername(initialUsername);
  }, [initialUsername]);

  function handleSubmit(event) {
    event.preventDefault();
    const cleanedUsername = username.trim();

    if (!cleanedUsername) {
      return;
    }
    if (!password.trim()) {
      return;
    }

    onLogin(cleanedUsername);
    setPassword('');
    navigate('/');
  }

  return (
    <main className="container py-4">
      <section className="card auth-card shadow-sm border-0 rounded-4">
        <div className="auth-card-inner p-3 p-md-4">
          <h2 className="mb-3">Sign In</h2>
          {user
            ? <p className="mb-0">You are signed in as <strong>{user}</strong>.</p>
            : <p className="mb-0">Enter your player name to continue to today’s music challenge.</p>}
        </div>
      </section>

      <section className="card auth-form-card shadow-sm border-0 rounded-4 mt-4">
        <div className="auth-form-card-inner p-3 p-md-4">
          {user ? (
            <button
              type="button"
              className="btn btn-primary px-4"
              onClick={onLogout}
            >
              Sign Out
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="row g-3">
              <div className="col-12">
                <label htmlFor="username" className="form-label">Username</label>
                <input
                  id="username"
                  type="text"
                  name="username"
                  className="form-control"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  maxLength={24}
                  required
                />
              </div>
              <div className="col-12">
                <label htmlFor="password" className="form-label">Password</label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  className="form-control"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
              <div className="col-12">
                <button type="submit" className="btn btn-primary px-4">
                  Continue
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

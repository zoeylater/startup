import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Login({ user, onLogin }) {
  const [username, setUsername] = useState(user || '');
  const navigate = useNavigate();

  function handleSubmit(event) {
    event.preventDefault();
    const cleanedUsername = username.trim();

    if (!cleanedUsername) {
      return;
    }

    onLogin(cleanedUsername);
    navigate('/guess');
  }

  return (
    <main className="container py-4">
      <section className="card auth-card shadow-sm border-0 rounded-4">
        <div className="auth-card-inner p-3 p-md-4">
          <h2 className="mb-3">Demo Sign In</h2>
          <p className="mb-0">
            Enter a player name to personalize this session. No account or
            password is created or stored.
          </p>
        </div>
      </section>

      <section className="card auth-form-card shadow-sm border-0 rounded-4 mt-4">
        <div className="auth-form-card-inner p-3 p-md-4">
          {user ? (
            <div>
              <p className="mb-3">You are playing as <strong>{user}</strong>.</p>
              <Link className="btn btn-primary px-4" to="/guess">
                Continue to today’s challenge
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="row g-3">
              <div className="col-12">
                <label htmlFor="username" className="form-label">Player name</label>
                <input
                  id="username"
                  type="text"
                  name="username"
                  className="form-control"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="nickname"
                  maxLength={24}
                  required
                />
              </div>
              <div className="col-12">
                <button type="submit" className="btn btn-primary px-4">
                  Start playing
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

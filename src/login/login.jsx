import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login({ user, onLogin, onLogout }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event, endpoint) {
    event.preventDefault();
    const form = event.currentTarget instanceof HTMLFormElement
      ? event.currentTarget
      : event.currentTarget.form;
    if (form && !form.reportValidity()) {
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onLogin(email.trim(), password, endpoint);
      setPassword('');
      navigate('/');
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container py-4">
      <section className="card auth-card shadow-sm border-0 rounded-4">
        <div className="auth-card-inner p-3 p-md-4">
          <h2 className="mb-3">Sign In</h2>
          {user
            ? <p className="mb-0">You are signed in as <strong>{user}</strong>.</p>
            : <p className="mb-0">Sign in or create an account to continue to today’s music challenge.</p>}
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
            <form onSubmit={(event) => handleSubmit(event, '/api/auth/login')} className="row g-3">
              <div className="col-12">
                <label htmlFor="email" className="form-label">Email</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  className="form-control"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
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
              {error && <div className="col-12 text-danger" role="alert">{error}</div>}
              <div className="col-12 auth-actions">
                <button type="submit" className="btn btn-primary px-4" disabled={submitting}>
                  Sign In
                </button>
                <button
                  type="button"
                  className="btn auth-register-button px-4"
                  disabled={submitting}
                  onClick={(event) => handleSubmit(event, '/api/auth/create')}
                >
                  Register
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

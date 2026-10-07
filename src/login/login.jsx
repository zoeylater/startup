
import React from 'react';

export default function Login() {
  return (
  <main className="container py-4">
    <section className="card auth-card shadow-sm border-0 rounded-4">
      <div className="auth-card-inner p-3 p-md-4">
        <h2 className="mb-3">Authentication</h2>
        <p className="mb-0">Sign in to continue your daily music challenge.</p>
      </div>
    </section>

    <section className="card auth-form-card shadow-sm border-0 rounded-4 mt-4">
      <div className="auth-form-card-inner p-3 p-md-4">
        <form action="/" method="post" className="row g-3">
          <div className="col-12">
            <label htmlFor="username" className="form-label">Username</label>
            <input id="username" type="text" name="username" className="form-control" />
          </div>

          <div className="col-12">
            <label htmlFor="email" className="form-label">Email</label>
            <input id="email" type="email" name="email" className="form-control" />
          </div>

          <div className="col-12">
            <label htmlFor="password" className="form-label">Password</label>
            <input id="password" type="password" name="password" className="form-control" />
          </div>

          <div className="col-12">
            <input type="submit" value="Create Account" className="btn btn-primary px-4" />
          </div>
        </form>
        <p className="mb-0 mt-3">Logged in as: Maya</p>
      </div>
    </section>
  </main>
  );
}

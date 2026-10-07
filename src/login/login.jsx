
  <main class="container py-4">
    <section class="card auth-card shadow-sm border-0 rounded-4">
      <div class="auth-card-inner p-3 p-md-4">
        <h2 class="mb-3">Authentication</h2>
        <p class="mb-0">Sign in to continue your daily music challenge.</p>
      </div>
    </section>

    <section class="card auth-form-card shadow-sm border-0 rounded-4 mt-4">
      <div class="auth-form-card-inner p-3 p-md-4">
        <form action="index.html" method="post" class="row g-3">
          <div class="col-12">
            <label for="username" class="form-label">Username</label>
            <input id="username" type="text" name="username" class="form-control" />
          </div>

          <div class="col-12">
            <label for="email" class="form-label">Email</label>
            <input id="email" type="email" name="email" class="form-control" />
          </div>

          <div class="col-12">
            <label for="password" class="form-label">Password</label>
            <input id="password" type="password" name="password" class="form-control" />
          </div>

          <div class="col-12">
            <input type="submit" value="Create Account" class="btn btn-primary px-4" />
          </div>
        </form>
        <p class="mb-0 mt-3">Logged in as: Maya</p>
      </div>
    </section>
  </main>

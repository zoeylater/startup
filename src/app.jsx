import React from 'react';
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';
import About from './about/about';
import Guess from './guess/guess';
import Home from './home/home';
import Login from './login/login';
import Result from './result/result';


function NotFound() {
  return (
    <main className="container py-4">
      <h2>Page not found</h2>
      <p>The page you requested does not exist.</p>
      <Link to="/">Return home</Link>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="body bg-dark text-light">
        <header className="site-header">
          <div className="brand-wrap">
            <span className="brand-icon" aria-hidden="true">♫</span>
            <h1 className="brand">TuneCatcher</h1>
            <span className="brand-icon brand-icon-plane" aria-hidden="true">✈</span>
          </div>
          <nav aria-label="Main navigation">
            <Link to="/">Home</Link>
            <Link to="/login">Login</Link>
            <Link to="/about">About</Link>
            <Link to="/guess">Guess</Link>
            <Link to="/result">Result</Link>
          </nav>
        </header>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/about" element={<About />} />
          <Route path="/guess" element={<Guess />} />
          <Route path="/result" element={<Result />} />
          <Route path="*" element={<NotFound />} />
        </Routes>

        <footer>
          <div className="footer-content">
            <p className="m-0">TuneCatcher Demo</p>
            <p className="footer-signature m-0">Created by Zoey</p>
            <a
              className="footer-github"
              href="https://github.com/zoeylater/startup"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}


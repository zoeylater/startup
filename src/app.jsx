import React, { useState } from 'react';
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
  const [user, setUser] = useState('');
  const [guess, setGuess] = useState(null);
  const [scores, setScores] = useState([
    { name: 'Jules', score: 980 },
    { name: 'Aria', score: 950 },
    { name: 'Maya', score: 920 },
  ]);
  const [activity, setActivity] = useState([
    'Daily challenge is ready to play.',
  ]);

  const challenge = {
    title: 'Daily track snippet',
    country: 'Kenya',
    city: 'Nairobi',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  };

  function handleLogin(username) {
    setUser(username);
    setActivity((current) => [`${username} started a demo session.`, ...current].slice(0, 8));
  }

  function handleLogout() {
    setActivity((current) => [`${user} signed out.`, ...current].slice(0, 8));
    setUser('');
  }

  function handleGuessSubmission(submittedGuess) {
    const countryMatches = submittedGuess.country.trim().toLowerCase()
      === challenge.country.toLowerCase();
    const cityMatches = submittedGuess.city.trim().toLowerCase()
      === challenge.city.toLowerCase();
    const score = countryMatches && cityMatches
      ? 1000
      : countryMatches
        ? 500
        : cityMatches
          ? 250
          : 0;
    const result = {
      ...submittedGuess,
      name: user || 'Guest',
      score,
      actualCountry: challenge.country,
      actualCity: challenge.city,
    };

    setGuess(result);
    setScores((currentScores) => {
      const previousBest = currentScores.find((entry) => entry.name === result.name)?.score ?? 0;
      const bestScores = currentScores.filter((entry) => entry.name !== result.name);
      bestScores.push({ name: result.name, score: Math.max(previousBest, score) });
      return bestScores.sort((first, second) => second.score - first.score).slice(0, 5);
    });
    setActivity((current) => [
      `${result.name} submitted a guess and scored ${score} points.`,
      ...current,
    ].slice(0, 8));
  }

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
            {user ? (
              <button type="button" className="nav-session-button" onClick={handleLogout}>
                Sign out ({user})
              </button>
            ) : null}
          </nav>
        </header>

        <Routes>
          <Route path="/" element={<Home user={user} hasPlayed={Boolean(guess)} />} />
          <Route
            path="/login"
            element={<Login user={user} onLogin={handleLogin} />}
          />
          <Route
            path="/about"
            element={(
              <About
                user={user}
                guess={guess}
                scores={scores}
                activity={activity}
                challenge={challenge}
                dailyStatus={guess ? 'Round complete' : 'Round is live'}
              />
            )}
          />
          <Route
            path="/guess"
            element={(
              <Guess
                user={user}
                challenge={challenge}
                guess={guess}
                onSubmitGuess={handleGuessSubmission}
              />
            )}
          />
          <Route
            path="/result"
            element={<Result result={guess} scores={scores} />}
          />
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

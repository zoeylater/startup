import React, { useEffect, useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';
import About from './about/about';
import Guess from './guess/guess';
import Home from './home/home';
import Login from './login/login';
import Result from './result/result';
import { INITIAL_SCORES } from './config/leaderboard';

const STORAGE_KEY = 'tunecatcher-state-v1';
function getLocalDateKey() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
}
const CHALLENGE = {
  musicMetadata: {
    source: 'MusicBrainz metadata mock',
    recordingId: 'mock-recording-001',
    title: 'Daily Track Preview',
    artist: 'TuneCatcher Sample Artist',
    release: 'TuneCatcher Daily Collection',
  },
  country: 'Kenya',
  city: 'Nairobi',
  latitude: -1.286389,
  longitude: 36.817223,
  preview: {
    provider: 'Deezer',
    trackId: null,
    durationSeconds: 30,
    isPlaceholder: true,
    source: 'Deezer preview placeholder — sample audio, API not connected',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
};
const LIVE_PLAYERS = ['Jules', 'Aria', 'Maya'];

function isSavedState(value) {
  const validGuess = value?.guess === null || (
    value?.guess
    && typeof value.guess === 'object'
    && Number.isFinite(value.guess.latitude)
    && Number.isFinite(value.guess.longitude)
    && Number.isFinite(value.guess.score)
    && Number.isFinite(value.guess.distanceKm)
  );

  return value
    && typeof value === 'object'
    && (typeof value.user === 'string' || value.user === null)
    && validGuess
    && Array.isArray(value.scores)
    && value.scores.every((entry) => (
      entry
      && typeof entry.name === 'string'
      && Number.isFinite(entry.score)
    ))
    && Array.isArray(value.activity)
    && value.activity.every((entry) => typeof entry === 'string')
    && (value.date === undefined || /^\d{4}-\d{2}-\d{2}$/.test(value.date));
}

function NotFound() {
  return (
    <main className="container py-4">
      <h2>Page not found</h2>
      <p>The page you requested does not exist.</p>
      <Link to="/">Return home</Link>
    </main>
  );
}

function RequireUser({ user, children }) {
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [user, setUser] = useState('');
  const [rememberedUser, setRememberedUser] = useState('');
  const [guess, setGuess] = useState(null);
  const [scores, setScores] = useState(INITIAL_SCORES);
  const [activity, setActivity] = useState([
    'Daily challenge is ready to play.',
  ]);
  const [dailyDate, setDailyDate] = useState(getLocalDateKey);
  const [storageReady, setStorageReady] = useState(false);
  const [storageError, setStorageError] = useState('');

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(STORAGE_KEY);
      if (storedValue) {
        const savedState = JSON.parse(storedValue);
        const today = getLocalDateKey();
        if (!isSavedState(savedState)) {
          throw new Error('Saved TuneCatcher data has an invalid format.');
        }
        setRememberedUser(savedState.user || '');
        setDailyDate(today);
        if (savedState.date && savedState.date !== today) {
          setGuess(null);
          setScores(INITIAL_SCORES);
          setActivity(['Daily challenge is ready to play.']);
        } else {
          setGuess(savedState.guess);
          setScores(savedState.scores);
          setActivity(savedState.activity);
        }
      }
    } catch (error) {
      setStorageError(
        error instanceof Error
          ? `Could not load saved progress: ${error.message}`
          : 'Could not load saved progress.',
      );
    } finally {
      setStorageReady(true);
    }
  }, []);

  useEffect(() => {
    if (!storageReady) {
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        user: rememberedUser,
        guess,
        scores,
        activity,
        date: dailyDate,
      }));
      setStorageError((current) => (
        current.startsWith('Could not save progress:') ? '' : current
      ));
    } catch (error) {
      setStorageError(
        error instanceof Error
          ? `Could not save progress: ${error.message}`
          : 'Could not save progress.',
      );
    }
  }, [storageReady, rememberedUser, guess, scores, activity, dailyDate]);

  useEffect(() => {
    if (!storageReady) {
      return undefined;
    }

    function resetForNewDay() {
      const today = getLocalDateKey();
      if (today !== dailyDate) {
        setDailyDate(today);
        setGuess(null);
        setScores(INITIAL_SCORES);
        setActivity(['Daily challenge is ready to play.']);
      }
    }

    const intervalId = window.setInterval(resetForNewDay, 60000);
    document.addEventListener('visibilitychange', resetForNewDay);
    window.addEventListener('focus', resetForNewDay);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', resetForNewDay);
      window.removeEventListener('focus', resetForNewDay);
    };
  }, [storageReady, dailyDate]);

  useEffect(() => {
    let updateIndex = 0;
    const intervalId = window.setInterval(() => {
      const playerIndex = updateIndex % LIVE_PLAYERS.length;
      const player = LIVE_PLAYERS[playerIndex];
      const score = INITIAL_SCORES[playerIndex].score
        + (Math.floor(updateIndex / LIVE_PLAYERS.length) + 1) * 5;
      setScores((currentScores) => currentScores
        .map((entry) => (
          entry.name === player
            ? { ...entry, score: Math.max(entry.score, score) }
            : entry
        ))
        .sort((first, second) => second.score - first.score)
        .slice(0, 5));
      setActivity((current) => [
        `${player} earned ${score} points. The leaderboard was updated.`,
        ...current,
      ].slice(0, 8));
      updateIndex += 1;
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, []);

  function handleLogin(username) {
    setUser(username);
    setRememberedUser(username);
    setActivity((current) => [`${username} joined the challenge.`, ...current].slice(0, 8));
  }

  function handleLogout() {
    setActivity((current) => [`${user} signed out.`, ...current].slice(0, 8));
    setUser('');
    setGuess(null);
  }

  function handleGuessSubmission(submittedGuess) {
    const radians = (degrees) => (degrees * Math.PI) / 180;
    const latitudeDifference = radians(CHALLENGE.latitude - submittedGuess.latitude);
    const longitudeDifference = radians(CHALLENGE.longitude - submittedGuess.longitude);
    const rawHaversine = Math.sin(latitudeDifference / 2) ** 2
      + Math.cos(radians(submittedGuess.latitude))
      * Math.cos(radians(CHALLENGE.latitude))
      * Math.sin(longitudeDifference / 2) ** 2;
    const haversine = Math.min(1, Math.max(0, rawHaversine));
    const distanceKm = 6371 * 2 * Math.atan2(
      Math.sqrt(haversine),
      Math.sqrt(1 - haversine),
    );
    const score = Math.max(0, Math.round(1000 * (1 - distanceKm / 20000)));
    const result = {
      ...submittedGuess,
      name: user || 'Guest',
      score,
      distanceKm: Math.round(distanceKm),
      actualCountry: CHALLENGE.country,
      actualCity: CHALLENGE.city,
      actualLatitude: CHALLENGE.latitude,
      actualLongitude: CHALLENGE.longitude,
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
        {storageError && (
          <p className="storage-alert" role="status">
            {storageError} Your progress may not remain available after you leave.
          </p>
        )}
        <header className="site-header">
          <div className="brand-wrap">
            <span className="brand-icon" aria-hidden="true">♫</span>
            <h1 className="brand">TuneCatcher</h1>
            <span className="brand-icon brand-icon-plane" aria-hidden="true">✈</span>
          </div>
          <nav aria-label="Main navigation">
            {user ? (
              <>
                <Link to="/">Home</Link>
                <Link to="/login">Login</Link>
                <Link to="/about">About</Link>
                <Link to="/guess">Guess</Link>
                <Link to="/result">Result</Link>
                <button type="button" className="nav-session-button" onClick={handleLogout}>
                  Sign out ({user})
                </button>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/about">About</Link>
              </>
            )}
          </nav>
        </header>

        <Routes>
          <Route
            path="/"
            element={(
              <RequireUser user={user}>
                <Home user={user} hasPlayed={Boolean(guess)} />
              </RequireUser>
            )}
          />
          <Route
            path="/login"
            element={(
              <Login
                user={user}
                initialUsername={user || rememberedUser}
                onLogin={handleLogin}
                onLogout={handleLogout}
              />
            )}
          />
          <Route
            path="/about"
            element={(
              <About
                user={user}
                guess={guess}
                scores={scores}
                activity={activity}
                dailyStatus={guess ? 'Round complete' : 'Round is live'}
              />
            )}
          />
          <Route
            path="/guess"
            element={user ? (
              <Guess
                user={user}
                challenge={CHALLENGE}
                guess={guess}
                onSubmitGuess={handleGuessSubmission}
              />
            ) : <Navigate to="/login" replace />}
          />
          <Route
            path="/result"
            element={user
              ? <Result result={guess} scores={scores} />
              : <Navigate to="/login" replace />}
          />
          <Route
            path="*"
            element={user ? <NotFound /> : <Navigate to="/login" replace />}
          />
        </Routes>

        <footer>
          <div className="footer-content">
            <p className="m-0">TuneCatcher</p>
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

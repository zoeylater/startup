import React, { useEffect, useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './app.css';
import About from './about/about';
import Guess from './guess/guess';
import Home from './home/home';
import Login from './login/login';
import Result from './result/result';
import Archive from './archive/archive';
import { fetchArchiveTrack, fetchDailyTrack } from './music/dailyTrack';
import { getDisplayName } from './utils/displayName';

const STORAGE_KEY = 'tunecatcher-state-v1';
function getMountainDateKey() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Denver',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const dateParts = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
}
const DAILY_LOCATION = {
  country: 'Kenya',
  city: 'Nairobi',
  latitude: -1.286389,
  longitude: 36.817223,
};
function calculateGuessResult(submittedGuess, location, details) {
  const radians = (degrees) => (degrees * Math.PI) / 180;
  const latitudeDifference = radians(location.latitude - submittedGuess.latitude);
  const longitudeDifference = radians(location.longitude - submittedGuess.longitude);
  const rawHaversine = Math.sin(latitudeDifference / 2) ** 2
    + Math.cos(radians(submittedGuess.latitude))
    * Math.cos(radians(location.latitude))
    * Math.sin(longitudeDifference / 2) ** 2;
  const haversine = Math.min(1, Math.max(0, rawHaversine));
  const distanceKm = 6371 * 2 * Math.atan2(
    Math.sqrt(haversine),
    Math.sqrt(1 - haversine),
  );
  return {
    ...submittedGuess,
    score: Math.max(0, Math.round(1000 * (1 - distanceKm / 20000))),
    distanceKm: Math.round(distanceKm),
    actualCountry: details.country,
    actualCity: details.city,
    actualLatitude: location.latitude,
    actualLongitude: location.longitude,
  };
}

function isSavedState(value) {
  const isValidGuess = (guess) => (
    guess
    && typeof guess === 'object'
    && Number.isFinite(guess.latitude)
    && Number.isFinite(guess.longitude)
    && Number.isFinite(guess.score)
    && Number.isFinite(guess.distanceKm)
  );
  const validGuesses = value?.guesses === undefined || (
    value.guesses
    && typeof value.guesses === 'object'
    && Object.values(value.guesses).every(isValidGuess)
  );
  const validLegacyGuess = value?.guess === undefined
    || value.guess === null
    || isValidGuess(value.guess);
  const validArchiveGuesses = value?.archiveGuesses === undefined || (
    value.archiveGuesses
    && typeof value.archiveGuesses === 'object'
    && Object.values(value.archiveGuesses).every((userGuesses) => (
      userGuesses
      && typeof userGuesses === 'object'
      && Object.values(userGuesses).every(isValidGuess)
    ))
  );

  return value
    && typeof value === 'object'
    && (
      value.user === undefined
      || typeof value.user === 'string'
      || value.user === null
    )
    && validGuesses
    && validLegacyGuess
    && validArchiveGuesses
    && (value.scores === undefined || (
      Array.isArray(value.scores)
      && value.scores.every((entry) => (
        entry
        && typeof entry.name === 'string'
        && Number.isFinite(entry.score)
      ))
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
  const [dailyTrack, setDailyTrack] = useState({
    musicMetadata: null,
    preview: null,
    previewError: '',
  });
  const [archiveChallenge, setArchiveChallenge] = useState(null);
  const [archiveTrack, setArchiveTrack] = useState(null);
  const [archiveGuessesByUser, setArchiveGuessesByUser] = useState({});
  const [guessesByUser, setGuessesByUser] = useState({});
  const [scores, setScores] = useState([]);
  const [activity, setActivity] = useState([
    'Daily challenge is ready to play.',
  ]);
  const [dailyDate, setDailyDate] = useState(getMountainDateKey);
  const [storageReady, setStorageReady] = useState(false);
  const [storageError, setStorageError] = useState('');
  const [serviceError, setServiceError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetchDailyTrack(controller.signal)
      .then(setDailyTrack)
      .catch((error) => {
        if (!controller.signal.aborted) {
          setDailyTrack({
            musicMetadata: null,
            preview: null,
            previewError: error instanceof Error
              ? `Could not load daily track metadata: ${error.message}`
              : 'Could not load daily track metadata.',
          });
        }
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!archiveChallenge) {
      setArchiveTrack(null);
      return undefined;
    }

    const controller = new AbortController();
    setArchiveTrack({
      musicMetadata: {
        source: 'Archive',
        title: archiveChallenge.title,
        artist: archiveChallenge.artist,
        release: '',
      },
      preview: null,
      previewError: 'Loading archive song preview…',
    });
    fetchArchiveTrack(archiveChallenge, controller.signal)
      .then(setArchiveTrack)
      .catch((error) => {
        if (!controller.signal.aborted) {
          setArchiveTrack({
            musicMetadata: {
              source: 'Archive',
              title: archiveChallenge.title,
              artist: archiveChallenge.artist,
              release: '',
            },
            preview: null,
            previewError: error instanceof Error
              ? error.message
              : 'Could not load archive song preview.',
          });
        }
      });

    return () => controller.abort();
  }, [archiveChallenge]);

  async function refreshScores() {
    const response = await fetch('/api/scores');
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.msg || 'Could not load scores.');
    }
    if (!Array.isArray(data)) {
      throw new Error('The service returned invalid scores.');
    }
    setScores(data);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await refreshScores();
      } catch (error) {
        if (active) {
          setServiceError(error instanceof Error ? error.message : 'Could not load scores.');
        }
      }

      try {
        const response = await fetch('/api/user/me');
        if (response.status === 401) {
          return;
        }
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.msg || 'Could not restore your session.');
        }
        if (active) {
          setUser(data.email);
          const scoresResponse = await fetch('/api/scores');
          const scoresData = await scoresResponse.json();
          if (!scoresResponse.ok || !Array.isArray(scoresData)) {
            throw new Error(scoresData.msg || 'Could not load scores.');
          }
          if (active) {
            setScores(scoresData);
          }
        }
      } catch (error) {
        if (active) {
          setServiceError(error instanceof Error ? error.message : 'Could not connect to the service.');
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(STORAGE_KEY);
      if (storedValue) {
        const savedState = JSON.parse(storedValue);
        const today = getMountainDateKey();
        if (!isSavedState(savedState)) {
          throw new Error('Saved TuneCatcher data has an invalid format.');
        }
        setDailyDate(today);
        setArchiveGuessesByUser(savedState.archiveGuesses || {});
        if (savedState.date && savedState.date !== today) {
          setGuessesByUser({});
          setActivity(['Daily challenge is ready to play.']);
        } else {
          const savedGuesses = savedState.guesses
            || (savedState.user && savedState.guess
              ? { [savedState.user]: savedState.guess }
              : {});
          setGuessesByUser(savedGuesses);
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
        guesses: guessesByUser,
        archiveGuesses: archiveGuessesByUser,
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
  }, [storageReady, guessesByUser, archiveGuessesByUser, activity, dailyDate]);

  useEffect(() => {
    if (!storageReady) {
      return undefined;
    }

    function resetForNewDay() {
      const today = getMountainDateKey();
      if (today !== dailyDate) {
        setDailyDate(today);
        setGuessesByUser({});
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

  async function handleLogin(email, password, endpoint) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.msg || 'Authentication failed.');
    }
    setUser(data.email);
    setServiceError('');
    setActivity((current) => [`${getDisplayName(data.email)} joined the challenge.`, ...current].slice(0, 8));
    try {
      await refreshScores();
    } catch (error) {
      setServiceError(error instanceof Error ? error.message : 'Could not load scores.');
    }
  }

  async function handleLogout() {
    try {
      const response = await fetch('/api/auth/logout', { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.msg || 'Could not sign out.');
      }
    } catch (error) {
      setServiceError(error instanceof Error ? error.message : 'Could not sign out.');
      return;
    }
    setActivity((current) => [`${getDisplayName(user)} signed out.`, ...current].slice(0, 8));
    setUser('');
    setServiceError('');
  }

  async function handleGuessSubmission(submittedGuess) {
    if (archiveChallenge) {
      if (!user || archiveGuessesByUser[user]?.[archiveChallenge.date]) {
        return false;
      }

      const target = {
        latitude: archiveChallenge.latitude,
        longitude: archiveChallenge.longitude,
      };
      if (!Number.isFinite(target.latitude) || !Number.isFinite(target.longitude)) {
        setServiceError('This archive challenge does not have a target location yet.');
        return false;
      }

      const result = calculateGuessResult(submittedGuess, target, {
        country: archiveChallenge.country,
        city: archiveChallenge.city,
      });
      setArchiveGuessesByUser((current) => ({
        ...current,
        [user]: {
          ...current[user],
          [archiveChallenge.date]: {
            ...result,
            musicMetadata: archiveTrack?.musicMetadata || {
              source: 'Archive',
              title: archiveChallenge.title,
              artist: archiveChallenge.artist,
              release: '',
            },
            previewTrackUrl: archiveTrack?.preview?.trackUrl,
            albumCover: archiveTrack?.preview?.albumCover || archiveChallenge.albumCover,
          },
        },
      }));
      return true;
    }

    if (!user || guessesByUser[user]) {
      return false;
    }

    const result = {
      ...calculateGuessResult(submittedGuess, DAILY_LOCATION, DAILY_LOCATION),
      name: user || 'Guest',
      musicMetadata: dailyTrack.musicMetadata,
      previewTrackUrl: dailyTrack.preview?.trackUrl,
      albumCover: dailyTrack.preview?.albumCover,
    };

    try {
      const response = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: result.score }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.msg || 'Could not submit your score.');
      }
      if (!Array.isArray(data)) {
        throw new Error('The service returned invalid scores.');
      }
      setScores(data);
      setServiceError('');
    } catch (error) {
      setServiceError(error instanceof Error ? error.message : 'Could not submit your score.');
      return false;
    }

    setGuessesByUser((current) => ({
      ...current,
      [user]: result,
    }));
    setActivity((current) => [
      `${result.name} submitted a guess and scored ${result.score} points.`,
      ...current,
    ].slice(0, 8));
    return true;
  }

  const guess = user ? guessesByUser[user] || null : null;
  const archiveGuesses = user ? archiveGuessesByUser[user] || {} : {};
  const challenge = archiveChallenge
    ? archiveTrack || {
      musicMetadata: {
        source: 'Archive',
        title: archiveChallenge.title,
        artist: archiveChallenge.artist,
        release: '',
      },
      preview: null,
      previewError: 'Loading archive song preview…',
    }
    : dailyTrack;

  return (
    <BrowserRouter>
      <div className="body bg-dark text-light">
        {storageError && (
          <p className="storage-alert" role="status">
            {storageError} Your progress may not remain available after you leave.
          </p>
        )}
        {serviceError && (
          <p className="storage-alert" role="alert">
            {serviceError}
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
                <Link to="/guess">Guess</Link>
                <Link to="/result">Result</Link>
                <Link to="/about">About</Link>
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
                challenge={challenge}
                challengeDate={archiveChallenge?.date}
                trackError={challenge.previewError}
                guess={archiveChallenge ? null : guess}
                isArchiveChallenge={Boolean(archiveChallenge)}
                onSubmitGuess={handleGuessSubmission}
              />
            ) : <Navigate to="/login" replace />}
          />
          <Route
            path="/result"
            element={user
              ? <Result result={guess} scores={scores} dailyTrack={dailyTrack} />
              : <Navigate to="/login" replace />}
          />
          <Route
            path="/archive-result"
            element={user && archiveChallenge ? (
              <Result
                result={archiveGuesses[archiveChallenge.date] || null}
                isArchiveResult
                challengeDate={archiveChallenge.date}
                scores={[]}
              />
            ) : <Navigate to="/archives" replace />}
          />
          <Route
            path="/archives"
            element={user
              ? <Archive
                playedChallenges={archiveGuesses}
                onPlayArchive={(archive) => {
                  setArchiveChallenge(archive);
                  setServiceError('');
                }}
                onViewArchiveResult={(archive) => {
                  setArchiveChallenge(archive);
                  setServiceError('');
                }}
              />
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

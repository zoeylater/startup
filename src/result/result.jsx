import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Result({ result, scores }) {
  const [showLeaderboard, setShowLeaderboard] = useState(true);

  return (
    <main className="result-page container py-4">
      <section className="result-card shadow-sm border-0 rounded-4">
        <div className="result-inner-panel p-3 p-md-4">
          {result ? (
            <>
              <p className="result-badge">{result.score >= 500 ? 'Nice!' : 'Thanks for playing!'}</p>
              <p className="result-subtitle">Here are your results:</p>

              <div className="result-stats row g-3">
                <div className="result-metric col-12 col-md-4">
                  <span className="result-metric-label">Your guess</span>
                  <span className="result-metric-value guess-value">
                    {result.country}, {result.city}
                  </span>
                </div>
                <div className="result-metric col-12 col-md-4">
                  <span className="result-metric-label">Actual location</span>
                  <span className="result-metric-value actual-value">
                    {result.actualCountry}, {result.actualCity}
                  </span>
                </div>
                <div className="result-metric result-score-box col-12 col-md-4">
                  <span className="result-metric-label">Score</span>
                  <span className="result-metric-value score-value">{result.score} points</span>
                </div>
              </div>
              <p className="result-demo-note">
                Demo scoring: 1,000 points for both matches, 500 for the country,
                250 for the city, and 0 for neither.
              </p>
              <Link className="btn btn-primary mt-3" to="/guess">Play again</Link>
            </>
          ) : (
            <>
              <h2 className="mb-3">No results yet</h2>
              <p>Submit a guess for today’s song to see your score.</p>
              <Link className="btn btn-primary" to="/guess">Make a guess</Link>
            </>
          )}
        </div>
      </section>

      <aside className="result-board-card shadow-sm border-0 rounded-4 mt-4">
        <h3>Top scores</h3>
        <button
          type="button"
          className="leaderboard-toggle"
          aria-expanded={showLeaderboard}
          onClick={() => setShowLeaderboard((showing) => !showing)}
        >
          {showLeaderboard ? 'Hide leaderboard' : 'Show leaderboard'}
        </button>
        {showLeaderboard && (
          <ol className="score-list">
            {scores.length > 0 ? scores.map((entry, index) => (
              <li key={`${entry.name}-${index}`}>
                <span>{entry.name}</span><strong>{entry.score}</strong>
              </li>
            )) : <li>No scores yet</li>}
          </ol>
        )}
        <p className="result-demo-note mb-0">
          Scores are shared only within this demo session.
        </p>
      </aside>
    </main>
  );
}

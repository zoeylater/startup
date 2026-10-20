
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Home({ user, hasPlayed }) {
  const [showInstructions, setShowInstructions] = useState(true);

  return (
    <main className="container py-4">
      <section className="hero-copy">
        <div className="hero-copy-inner">
          <h2 className="mb-3">Daily Music Challenge</h2>

          <p className="hero-pitch mb-0">
            {user ? `Welcome back, ${user}! ` : ''}
            Think you can recognize a song and place it on the map? Listen to a
            song, guess where it comes from, and compete for a spot on the
            session leaderboard.
          </p>
          {hasPlayed ? (
            <Link className="btn btn-primary play-now-btn" to="/result">
              View Your Results
            </Link>
          ) : (
            <Link className="btn btn-primary play-now-btn" to="/guess">Play Now</Link>
          )}
          <button
            type="button"
            className="instructions-toggle"
            aria-expanded={showInstructions}
            aria-controls="how-to-play"
            onClick={() => setShowInstructions((showing) => !showing)}
          >
            {showInstructions ? 'Hide' : 'Show'} how to play
          </button>
      </div>
      </section>

      {showInstructions && (
        <section className="how-it-works" id="how-to-play">
          <h2 className="text-center">How to Play</h2>

          <div className="row g-3 text-center">
            <div className="col-md-4">
              <div className="step-card">
                <div className="step-number">1</div>
                <h3>Listen</h3>
                <p>Hear the daily song clip.</p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="step-card">
                <div className="step-number">2</div>
                <h3>Guess</h3>
                <p>Enter the country and city you think the song is from.</p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="step-card">
                <div className="step-number">3</div>
                <h3>Score</h3>
                <p>Earn points based on your answer.</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
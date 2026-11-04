import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GuessMap from './GuessMap';

export default function Guess({ user, challenge, guess, onSubmitGuess, trackError }) {
  const [location, setLocation] = useState(null);
  const [validationMessage, setValidationMessage] = useState('');
  const navigate = useNavigate();
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.25;
    }
  }, [challenge.preview?.url]);

  const handleLocationSelect = useCallback((selectedLocation) => {
    setLocation(selectedLocation);
    setValidationMessage('');
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
    if (!location) {
      setValidationMessage('Choose a location on the map before submitting.');
      return;
    }
    onSubmitGuess({
      latitude: location.latitude,
      longitude: location.longitude,
    });
    navigate('/result');
  }

  return (
    <main className="container py-4">
      <section className="guess-card shadow-sm border-0 rounded-4">
        <div className="result-inner-panel p-3 p-md-4">
          <h2 className="mb-3">Guess the Location</h2>
          <p className="mb-3">
            {user ? `Playing as ${user}. ` : ''}
            Listen to the song and place a pin where you think it comes from.
          </p>
          {challenge.preview ? (
            <audio
              ref={audioRef}
              controls
              className="daily-track-player"
              onTimeUpdate={(event) => {
                if (event.currentTarget.currentTime >= challenge.preview.durationSeconds) {
                  event.currentTarget.currentTime = challenge.preview.durationSeconds;
                  event.currentTarget.pause();
                }
              }}
              onPlay={(event) => {
                if (event.currentTarget.currentTime >= challenge.preview.durationSeconds) {
                  event.currentTarget.currentTime = 0;
                }
              }}
            >
              <source src={challenge.preview.url} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          ) : (
            <p className="form-validation-message" role="status">
              {trackError || 'Loading today’s song preview…'}
            </p>
          )}
          {guess ? (
            <div className="guess-complete-message">
              <p>You’ve already submitted today’s guess.</p>
              <Link className="btn btn-primary" to="/result">View Today’s Results</Link>
            </div>
          ) : (
            <>
              <p className="mb-3">Click the map to place your guess.</p>

              <form onSubmit={handleSubmit} className="guess-form row g-3">
                <div className="col-12">
                  <div className="map-picker-wrap">
                    <GuessMap
                      location={location}
                      onLocationSelect={handleLocationSelect}
                    />
                    <p className="map-location" aria-live="polite">
                      {location
                        ? `Selected: ${location.latitude.toFixed(2)}°, ${location.longitude.toFixed(2)}°`
                        : 'No location selected'}
                    </p>
                  </div>
                </div>

                <div className="col-12">
                  {validationMessage && (
                    <p className="form-validation-message" role="alert">
                      {validationMessage}
                    </p>
                  )}
                  <button type="submit" className="btn btn-primary px-4">
                    Submit Guess
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

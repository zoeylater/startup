import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import mapImage from '../assets/map.jpg';

export default function Guess({ user, challenge, guess, onSubmitGuess }) {
  const [location, setLocation] = useState(null);
  const [validationMessage, setValidationMessage] = useState('');
  const navigate = useNavigate();

  function handleMapClick(event) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.detail === 0
      ? 0.5
      : Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
    const y = event.detail === 0
      ? 0.5
      : Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height));

    setLocation({
      latitude: Number((90 - y * 180).toFixed(4)),
      longitude: Number((x * 360 - 180).toFixed(4)),
      xPercent: x * 100,
      yPercent: y * 100,
    });
    setValidationMessage('');
  }

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
          <audio
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
          <p className="mb-3">Click the map to place your guess.</p>

          <form onSubmit={handleSubmit} className="guess-form row g-3">
            <div className="col-12">
              <div className="map-picker-wrap">
                <button
                  type="button"
                  className="map-picker"
                  aria-label="Choose your guess location on the world map"
                  onClick={handleMapClick}
                >
                  <img
                    src={mapImage}
                    alt="World map. Click to choose a location."
                    className="guess-map-image"
                  />
                  {location && (
                    <span
                      className="map-pin"
                      aria-hidden="true"
                      style={{ left: `${location.xPercent}%`, top: `${location.yPercent}%` }}
                    />
                  )}
                </button>
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
                {guess ? 'Submit New Guess' : 'Submit Guess'}
              </button>
            </div>
          </form>

          {guess && (
            <p className="mb-0" aria-live="polite">
              Your last guess scored {guess.score} points.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

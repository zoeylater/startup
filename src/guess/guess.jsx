import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import mapImage from '../assets/map.jpg';

export default function Guess({ user, challenge, guess, onSubmitGuess }) {
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const navigate = useNavigate();

  function handleSubmit(event) {
    event.preventDefault();
    onSubmitGuess({ country: country.trim(), city: city.trim() });
    navigate('/result');
  }

  return (
    <main className="container py-4">
      <section className="guess-card shadow-sm border-0 rounded-4">
        <div className="result-inner-panel p-3 p-md-4">
          <h2 className="mb-3">Guess the Location</h2>
          <p className="mb-3">
            {user ? `Playing as ${user}. ` : ''}
            Listen to the daily track and tell us where it is from.
          </p>
          <audio controls className="daily-track-player">
            <source src={challenge.audioUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
          <p className="mb-3">Where in the world do you think this song is from?</p>

          <form onSubmit={handleSubmit} className="guess-form row g-3">
            <div className="col-12 col-md-6">
              <label htmlFor="country" className="form-label">Country:</label>
              <input
                id="country"
                type="text"
                name="country"
                className="form-control"
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                autoComplete="country-name"
                required
              />
            </div>

            <div className="col-12 col-md-6">
              <label htmlFor="city" className="form-label">City:</label>
              <input
                id="city"
                type="text"
                name="city"
                className="form-control"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                autoComplete="address-level2"
                required
              />
            </div>

            <div className="col-12">
              <button type="submit" className="btn btn-primary px-4">
                {guess ? 'Submit New Guess' : 'Submit Guess'}
              </button>
            </div>
          </form>

          {guess && (
            <p className="mb-0" aria-live="polite">
              Your last guess: {guess.country}, {guess.city} ({guess.score} points)
              {' '}<Link to="/result">View results</Link>
            </p>
          )}

          <img
            src={mapImage}
            alt="World map"
            className="guess-map-image img-fluid mt-4 mx-auto d-block"
          />
        </div>
      </section>
    </main>
  );
}

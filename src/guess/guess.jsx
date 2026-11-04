import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GuessMap from './GuessMap';

export default function Guess({
  user,
  challenge,
  challengeDate,
  guess,
  isArchiveChallenge = false,
  onSubmitGuess,
  onArchiveComplete,
  trackError,
}) {
  const [location, setLocation] = useState(null);
  const [placeLookup, setPlaceLookup] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const audioRef = useRef(null);
  const lookupControllerRef = useRef(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.25;
    }
  }, [challenge.preview?.url]);

  const handleLocationSelect = useCallback(async (selectedLocation) => {
    lookupControllerRef.current?.abort();
    const controller = new AbortController();
    lookupControllerRef.current = controller;
    setLocation(selectedLocation);
    setPlaceLookup('Looking up place…');
    setValidationMessage('');

    try {
      const query = new URLSearchParams({
        latitude: String(selectedLocation.latitude),
        longitude: String(selectedLocation.longitude),
      });
      const response = await fetch(`/api/location/reverse?${query}`, {
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.msg || 'Could not look up this place.');
      }

      const placeName = [data.city, data.country].filter(Boolean).join(', ');
      setPlaceLookup(placeName || 'Place name unavailable');
    } catch {
      if (!controller.signal.aborted) {
        setPlaceLookup(
          `Place name unavailable · ${selectedLocation.latitude.toFixed(2)}°, ${selectedLocation.longitude.toFixed(2)}°`,
        );
      }
    }
  }, []);

  useEffect(() => () => lookupControllerRef.current?.abort(), []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!location) {
      setValidationMessage('Choose a location on the map before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const submitted = await onSubmitGuess({
        latitude: location.latitude,
        longitude: location.longitude,
      });
      if (submitted !== false) {
        if (isArchiveChallenge) {
          navigate('/archive-result', {
            state: { archiveDate: challengeDate },
          });
        } else {
          navigate('/result');
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="container py-4">
      <section className="guess-card shadow-sm border-0 rounded-4">
        <div className="result-inner-panel p-3 p-md-4">
          <h2 className="mb-3">Where Is This Song From?</h2>
          <p className="mb-3">{user ? `Playing as ${user}` : ''}</p>
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
          {guess && !isArchiveChallenge ? (
            <div className="guess-complete-message">
              <p>You’ve already submitted today’s guess.</p>
              <Link className="btn btn-primary" to="/result">View Today’s Results</Link>
            </div>
          ) : (
            <>
              <p className="mb-3">
                Listen to the clip, then click anywhere on the map to place your pin.
              </p>

              <form onSubmit={handleSubmit} className="guess-form row g-3">
                <div className="col-12">
                  <div className="map-picker-wrap">
                    <GuessMap
                      location={location}
                      onLocationSelect={handleLocationSelect}
                    />
                    <p className="map-location" aria-live="polite">
                      {location
                        ? `Selected: ${placeLookup || `${location.latitude.toFixed(2)}°, ${location.longitude.toFixed(2)}°`}`
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
                  <button type="submit" className="btn btn-primary px-4" disabled={submitting}>
                    {submitting ? 'Submitting…' : 'Submit Guess'}
                  </button>
                </div>
              </form>
            </>
          )}
          {isArchiveChallenge && (
            <Link className="btn btn-secondary mt-3" to="/archives">
              Back to Archives
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}

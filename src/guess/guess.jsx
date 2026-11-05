import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import GuessMap from './GuessMap';

export default function Guess({
  user,
  challenge,
  dailyChallenge,
  challengeDate,
  guess,
  isArchiveChallenge = false,
  onSubmitGuess,
  onArchiveComplete,
  trackError,
}) {
  const [location, setLocation] = useState(null);
  const [placeLookup, setPlaceLookup] = useState('');
  const [placeLookupLoading, setPlaceLookupLoading] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const routeLocation = useLocation();
  const navigate = useNavigate();
  const audioRef = useRef(null);
  const lookupControllerRef = useRef(null);
  const activeArchiveChallenge = isArchiveChallenge
    && routeLocation.state?.archiveDate === challengeDate;
  const activeChallenge = activeArchiveChallenge ? challenge : dailyChallenge;

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.25;
    }
  }, [activeChallenge.preview?.url]);

  const handleLocationSelect = useCallback(async (selectedLocation) => {
    lookupControllerRef.current?.abort();
    const controller = new AbortController();
    lookupControllerRef.current = controller;
    setLocation(selectedLocation);
    setPlaceLookup('Looking up place…');
    setPlaceLookupLoading(true);
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
      setPlaceLookupLoading(false);
    } catch {
      if (!controller.signal.aborted) {
        setPlaceLookup(
          `Place name unavailable · ${selectedLocation.latitude.toFixed(2)}°, ${selectedLocation.longitude.toFixed(2)}°`,
        );
        setPlaceLookupLoading(false);
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
      const submitted = await onSubmitGuess(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          locationName: placeLookup || `${location.latitude.toFixed(2)}°, ${location.longitude.toFixed(2)}°`,
        },
        activeArchiveChallenge ? challengeDate : null,
      );
      if (submitted !== false) {
        if (activeArchiveChallenge) {
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
          {activeChallenge.preview ? (
            <audio
              ref={audioRef}
              controls
              className="daily-track-player"
              onTimeUpdate={(event) => {
                if (event.currentTarget.currentTime >= activeChallenge.preview.durationSeconds) {
                  event.currentTarget.currentTime = activeChallenge.preview.durationSeconds;
                  event.currentTarget.pause();
                }
              }}
              onPlay={(event) => {
                if (event.currentTarget.currentTime >= activeChallenge.preview.durationSeconds) {
                  event.currentTarget.currentTime = 0;
                }
              }}
            >
              <source src={activeChallenge.preview.url} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          ) : (
            <p className="form-validation-message" role="status">
              {activeChallenge.previewError || trackError || 'Loading today’s song preview…'}
            </p>
          )}
          {guess && !activeArchiveChallenge ? (
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
                  <button
                    type="submit"
                    className="btn btn-primary px-4"
                    disabled={submitting || placeLookupLoading}
                  >
                    {submitting
                      ? 'Submitting…'
                      : placeLookupLoading
                        ? 'Looking up place…'
                        : 'Submit Guess'}
                  </button>
                </div>
              </form>
            </>
          )}
          {activeArchiveChallenge && (
            <Link className="btn btn-secondary mt-3" to="/archives">
              Back to archive
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}

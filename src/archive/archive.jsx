import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { formatDistanceMiles } from '../utils/formatDistance';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PLACEHOLDER_ARCHIVES = [
  {
    date: '2026-11-01',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    city: 'Scarborough',
    country: 'Canada',
    latitude: 43.7764,
    longitude: -79.2318,
    albumCover: 'https://cdn-images.dzcdn.net/images/cover/fd00ebd6d30d7253f813dba3bb1c66a9/250x250-000000-80-0-0.jpg',
  },
  {
    date: '2026-11-02',
    title: "Hips Don't Lie",
    artist: 'Shakira',
    city: 'Barranquilla',
    country: 'Colombia',
    latitude: 10.9639,
    longitude: -74.7964,
    albumCover: 'https://cdn-images.dzcdn.net/images/cover/b570890728621ec68d5c5558164c3945/250x250-000000-80-0-0.jpg',
  },
  {
    date: '2026-11-03',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    city: 'Halifax',
    country: 'United Kingdom',
    latitude: 53.721,
    longitude: -1.858,
    albumCover: 'https://cdn-images.dzcdn.net/images/cover/107c2b43f10c249077c1f7618563bb63/250x250-000000-80-0-0.jpg',
  },
  {
    date: '2026-11-04',
    title: 'Suzanna',
    artist: 'Sauti Sol',
    city: 'Nairobi',
    country: 'Kenya',
    latitude: -1.286389,
    longitude: 36.817223,
    albumCover: 'https://cdn-images.dzcdn.net/images/cover/c4f0888eeaf101a016ab3d43a612a404/250x250-000000-80-0-0.jpg',
  },
];

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatChallengeDate(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function Archive({
  onPlayArchive,
  onViewArchiveResult,
  playedChallenges,
  todayDate,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [selectedArchive, setSelectedArchive] = useState(null);
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usingPlaceholders, setUsingPlaceholders] = useState(false);
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const monthLabel = visibleMonth.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const archivesByDate = new Map(archives.map((archive) => [archive.date, archive]));
  const calendarCells = [
    ...Array.from({ length: firstWeekday }, (_, index) => ({ key: `blank-${index}` })),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const date = toDateKey(new Date(year, month, day));
      return {
        key: date,
        day,
        archive: date < todayDate ? archivesByDate.get(date) : undefined,
      };
    }),
  ];

  useEffect(() => {
    let active = true;
    const start = toDateKey(new Date(year, month, 1));
    const end = toDateKey(new Date(year, month + 1, 0));

    setLoading(true);
    setError('');
    setUsingPlaceholders(false);
    fetch(`/api/archives?${new URLSearchParams({ start, end })}`)
      .then(async (response) => {
        if (!response.headers.get('content-type')?.includes('application/json')) {
          if (active) {
            setArchives(PLACEHOLDER_ARCHIVES.filter(
              (archive) => archive.date >= start && archive.date <= end,
            ));
            setUsingPlaceholders(true);
          }
          return;
        }
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.msg || 'Could not load archived challenges.');
        }
        if (!Array.isArray(data)) {
          throw new Error('The service returned invalid archive data.');
        }
        if (active) {
          setArchives(data);
          setUsingPlaceholders(false);
        }
      })
      .catch((fetchError) => {
        if (active) {
          if (fetchError instanceof TypeError) {
            setArchives(PLACEHOLDER_ARCHIVES.filter(
              (archive) => archive.date >= start && archive.date <= end,
            ));
            setUsingPlaceholders(true);
          } else {
            setError(fetchError instanceof Error
              ? fetchError.message
              : 'Could not load archived challenges.');
            setArchives([]);
          }
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [year, month]);

  useEffect(() => {
    const archiveDate = location.state?.archiveDate;
    if (archiveDate && archiveDate < todayDate) {
      const archive = archives.find((entry) => entry.date === archiveDate);
      if (archive) {
        setSelectedArchive(archive);
      }
    }
  }, [archives, location.state, todayDate]);

  function changeMonth(offset) {
    setSelectedArchive(null);
    setVisibleMonth((current) => (
      new Date(current.getFullYear(), current.getMonth() + offset, 1)
    ));
  }

  function playSelectedArchive() {
    if (selectedArchive && selectedArchive.date < todayDate) {
      onPlayArchive(selectedArchive);
      navigate('/guess', { state: { archiveDate: selectedArchive.date } });
    }
  }

  function viewSelectedResult() {
    if (selectedArchive && selectedArchive.date < todayDate) {
      onViewArchiveResult(selectedArchive);
      navigate('/archive-result', {
        state: { archiveDate: selectedArchive.date },
      });
    }
  }

  const selectedResult = selectedArchive
    ? playedChallenges[selectedArchive.date]
    : null;

  return (
    <main className="container py-4">
      <section className="card archive-card shadow-sm border-0 rounded-4">
        <div className="archive-card-inner p-3 p-md-4">
          <h2 className="archive-title mb-3">From the Archives</h2>
          <p className="archive-database-note">
            The current archives are placeholders and will be fully developed with the database deliverable.
          </p>
          <p>Choose a date to revisit a past daily challenge.</p>
          <div
            className="archive-calendar"
            role="group"
            aria-label={`${monthLabel} challenge calendar`}
          >
            <div className="archive-calendar-header">
              <button
                type="button"
                className="archive-month-button"
                aria-label="Previous month"
                onClick={() => changeMonth(-1)}
              >
                ‹
              </button>
              <h3 aria-live="polite">{monthLabel}</h3>
              <button
                type="button"
                className="archive-month-button"
                aria-label="Next month"
                onClick={() => changeMonth(1)}
              >
                ›
              </button>
            </div>

            <div className="archive-calendar-grid">
              {WEEKDAYS.map((weekday) => (
                <span className="archive-weekday" key={weekday}>
                  {weekday}
                </span>
              ))}
              {calendarCells.map((cell) => (
                cell.day ? (
                  <button
                    type="button"
                    className={`archive-day${cell.archive ? ' has-archive' : ''}`}
                    key={cell.key}
                    disabled={!cell.archive}
                    aria-label={cell.archive
                      ? `${monthLabel} ${cell.day}: archived challenge`
                      : `${monthLabel} ${cell.day}: no archived challenge`}
                    onClick={() => setSelectedArchive(cell.archive)}
                  >
                    {cell.day}
                  </button>
                ) : (
                  <span className="archive-day archive-day-empty" key={cell.key} aria-hidden="true" />
                )
              ))}
            </div>
          </div>

          {selectedArchive ? (
            <section className="archive-selection" aria-live="polite">
              {selectedResult ? (
                <>
                  <p className="archive-result-score">
                    Your score: <strong>{selectedResult.score} points</strong>
                  </p>
                  <p>You were approximately {formatDistanceMiles(selectedResult.distanceKm)} away.</p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={viewSelectedResult}
                  >
                    View more details
                  </button>
                </>
              ) : (
                <>
                  <h3>{formatChallengeDate(selectedArchive.date)}</h3>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={playSelectedArchive}
                  >
                    Start challenge
                  </button>
                </>
              )}
            </section>
          ) : loading ? (
            <p className="archive-empty-state" role="status">Loading archived challenges…</p>
          ) : error ? (
            <p className="archive-empty-state" role="alert">{error}</p>
          ) : usingPlaceholders ? (
            <p className="archive-empty-state" role="status">
              Showing sample archive challenges for now. Permanent archives are coming in a future project stage.
            </p>
          ) : archives.length === 0 ? (
            <p className="archive-empty-state" role="status">
              No archived challenges yet.
            </p>
          ) : (
            <p className="archive-empty-state">
              Choose a date to play its challenge or review your result.
            </p>
          )}

          <Link className="btn btn-primary archive-back-link mt-3" to="/result">
            Back to results
          </Link>
        </div>
      </section>
    </main>
  );
}

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function Archive() {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [selectedArchive, setSelectedArchive] = useState(null);
  const [archives, setArchives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
      return { key: date, day, archive: archivesByDate.get(date) };
    }),
  ];

  useEffect(() => {
    let active = true;
    const start = toDateKey(new Date(year, month, 1));
    const end = toDateKey(new Date(year, month + 1, 0));

    setLoading(true);
    setError('');
    fetch(`/api/archives?${new URLSearchParams({ start, end })}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.msg || 'Could not load archived challenges.');
        }
        if (!Array.isArray(data)) {
          throw new Error('The service returned invalid archive data.');
        }
        if (active) {
          setArchives(data);
        }
      })
      .catch((fetchError) => {
        if (active) {
          setError(fetchError instanceof Error
            ? fetchError.message
            : 'Could not load archived challenges.');
          setArchives([]);
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

  function changeMonth(offset) {
    setSelectedArchive(null);
    setVisibleMonth((current) => (
      new Date(current.getFullYear(), current.getMonth() + offset, 1)
    ));
  }

  return (
    <main className="container py-4">
      <section className="card archive-card shadow-sm border-0 rounded-4">
        <div className="archive-card-inner p-3 p-md-4">
          <h2 className="archive-title mb-3">From the Archives</h2>
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
                      ? `${monthLabel} ${cell.day}: ${cell.archive.title}`
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
              {selectedArchive.albumCover && (
                <img
                  className="daily-track-cover"
                  src={selectedArchive.albumCover}
                  alt={`${selectedArchive.title} album cover`}
                />
              )}
              <h3>{selectedArchive.title}</h3>
              <p>{selectedArchive.artist} · {selectedArchive.date}</p>
              <p>Location: {selectedArchive.city}, {selectedArchive.country}</p>
            </section>
          ) : loading ? (
            <p className="archive-empty-state" role="status">Loading archived challenges…</p>
          ) : error ? (
            <p className="archive-empty-state" role="alert">{error}</p>
          ) : archives.length === 0 ? (
            <p className="archive-empty-state" role="status">
              No archived challenges yet.
            </p>
          ) : (
            <p className="archive-empty-state">
              Select a highlighted date to view its song and location.
            </p>
          )}

          <Link className="btn btn-primary archive-back-link mt-3" to="/result">
            Back to Results
          </Link>
        </div>
      </section>
    </main>
  );
}

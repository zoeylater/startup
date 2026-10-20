import React, { useEffect, useState } from 'react';

const panels = [
  { id: 'layout', title: 'Why the Layout Works' },
  { id: 'application', title: 'Application Data' },
  { id: 'database', title: 'Leaderboard Data' },
  { id: 'activity', title: 'Recent Activity' },
];

export default function About({
  user,
  guess,
  scores,
  activity,
  challenge,
  dailyStatus,
}) {
  const [openPanel, setOpenPanel] = useState('layout');

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'About TuneCatcher';

    return () => {
      document.title = previousTitle;
    };
  }, []);

  function togglePanel(panelId) {
    setOpenPanel((currentPanel) => currentPanel === panelId ? '' : panelId);
  }

  return (
    <main className="container py-4">
      <section className="card about-card shadow-sm border-0 rounded-4">
        <div className="about-card-inner p-3 p-md-4">
          <h2 className="mb-3">About This App</h2>
          <p className="mb-2">
            TuneCatcher combines music trivia and geography. Players listen to
            a short song clip and guess where in the world it comes from.
          </p>
          <p className="mb-0">
            Keep track of your daily guess, follow the leaderboard, and discover
            music from around the world.
          </p>
        </div>
      </section>

      <div className="accordion-wrap mt-4">
        {panels.map((panel) => {
          const expanded = openPanel === panel.id;

          return (
            <section className={`card accordion-item${expanded ? ' is-open' : ''}`} key={panel.id}>
              <h3 className="accordion-heading">
                <button
                  type="button"
                  className="accordion-toggle"
                  aria-expanded={expanded}
                  aria-controls={`${panel.id}-content`}
                  onClick={() => togglePanel(panel.id)}
                >
                  {panel.title}
                  <span aria-hidden="true">{expanded ? '−' : '+'}</span>
                </button>
              </h3>
              {expanded && (
                <div className="accordion-content" id={`${panel.id}-content`}>
                  {panel.id === 'layout' && (
                    <>
                      <p>
                        The app uses a flexible page structure: the header and
                        footer frame the main content, which adapts to smaller
                        screens.
                      </p>
                      <ul>
                        <li><strong>Header</strong> keeps the brand and navigation together.</li>
                        <li><strong>Main</strong> holds the page content.</li>
                        <li><strong>Footer</strong> contains extra site information.</li>
                      </ul>
                    </>
                  )}

                  {panel.id === 'application' && (
                    <dl className="about-data-list">
                      <div><dt>Player</dt><dd>{user || 'Guest'}</dd></div>
                      <div>
                        <dt>Current song</dt>
                        <dd>{challenge.musicMetadata.title}</dd>
                      </div>
                      <div>
                        <dt>Map guess</dt>
                        <dd>
                          {guess
                            ? `${guess.latitude.toFixed(2)}°, ${guess.longitude.toFixed(2)}°`
                            : 'Not yet submitted'}
                        </dd>
                      </div>
                      <div><dt>Daily status</dt><dd>{dailyStatus}</dd></div>
                      <div><dt>Quote</dt><dd>“Music and geography are a perfect match.”</dd></div>
                    </dl>
                  )}

                  {panel.id === 'database' && (
                    <>
                      <p className="about-note">
                        Scores are ranked by points. Your leaderboard updates as
                        players submit their guesses.
                      </p>
                      <div className="table-responsive">
                        <table>
                          <thead>
                            <tr><th scope="col">Player</th><th scope="col">Daily Score</th></tr>
                          </thead>
                          <tbody>
                            {scores.length > 0 ? scores.map((entry, index) => (
                              <tr key={`${entry.name}-${index}`}>
                                <td>{entry.name}</td>
                                <td>{entry.score}</td>
                              </tr>
                            )) : (
                              <tr><td colSpan="2">No scores yet. Play today’s challenge!</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {panel.id === 'activity' && (
                    <>
                      <p className="about-note">
                        New leaderboard updates appear while you play.
                      </p>
                      {activity.length > 0 ? (
                        <ul aria-live="polite">
                          {activity.map((message, index) => (
                            <li key={`${message}-${index}`}>{message}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>No activity yet.</p>
                      )}
                    </>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}

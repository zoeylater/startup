
import React from 'react';

export default function Result() {
  return (
  <main className="result-page container py-4">
    <section className="result-card shadow-sm border-0 rounded-4">
      <div className="result-inner-panel p-3 p-md-4">
        <p className="result-badge">Nice!</p>
        <p className="result-subtitle">Here are your results:</p>

        <div className="result-stats row g-3">
          <div className="result-metric col-12 col-md-4">
            <span className="result-metric-label">Your guess</span>
            <span className="result-metric-value guess-value">Kenya, Nairobi</span>
          </div>
          <div className="result-metric col-12 col-md-4">
            <span className="result-metric-label">Actual location</span>
            <span className="result-metric-value actual-value">Kenya, Nairobi</span>
          </div>
          <div className="result-metric result-score-box col-12 col-md-4">
            <span className="result-metric-label">Score</span>
            <span className="result-metric-value score-value">980 points</span>
          </div>
        </div>
      </div>
    </section>

    <aside className="result-board-card shadow-sm border-0 rounded-4 mt-4">
      <h3>Top scores</h3>
  <ol className="score-list">
    <li><span>Jules</span><strong>980</strong></li>
    <li><span>Aria</span><strong>950</strong></li>
    <li><span>Maya</span><strong>920</strong></li>
    </ol>
    </aside>
  </main>
  );
}
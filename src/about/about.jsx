 <main class="container py-4">
    <section class="card about-card shadow-sm border-0 rounded-4">
      <div class="about-card-inner p-3 p-md-4">
        <h2 class="mb-3">About This App</h2>
        <p class="mb-2">TuneCatcher combines music trivia and geography. Players listen to a short song clip and guess where in the world it comes from.</p>
        <p class="mb-0">It will eventually include account creation, score tracking, and live leaderboard updates.</p>
      </div>
    </section>

    <details class="card accordion-item shadow-sm border-0 rounded-4 mt-4">
      <summary>Why the Layout Works</summary>
      <div class="accordion-content">
        <p>
          I used <strong>flexbox</strong> for this layout because it makes the page easier to organize without having to manually position everything.
          The whole app is basically set up as a stack: header, main content, and footer. That way, the page stays clean and structured even when the screen size changes.
        </p>

        <p>
          The main thing is that the body is a flex container, and the children are arranged in a column. Then the header and footer get a fixed amount of space, while the main section gets whatever is left over.
          That makes the design feel more balanced and keeps the app from looking like a bunch of random boxes floating around.
        </p>

        <ul>
          <li><strong>header</strong> - keeps the brand and navigation at the top.</li>
          <li><strong>footer</strong> - stays at the bottom and holds the extra site info.</li>
          <li><strong>main</strong> - fills the remaining space and holds the actual content.</li>
        </ul>

        <p>
          I also made the main section into its own flex container so the content inside can sit side by side on larger screens, but stack nicely when the screen gets narrower.
          That is why it still looks organized on mobile instead of being cramped or squished together.
        </p>

        <p>
          The media queries are the part that helps it respond to smaller screens. When the width gets too small, the layout changes from a row to a column so the content is easier to read.
          It is a pretty simple setup, but it works really well for a project like this because it keeps the page flexible without making the code too complicated.
        </p>
      </div>
    </details>


    <div class="accordion-wrap mt-4">
      <details class="card accordion-item shadow-sm border-0 rounded-4">
        <summary>Application Data</summary>
        <div class="accordion-content">
          <p>User: Maya</p>
          <p>Current Song: Daily track snippet</p>
          <p>Country Guess: Not yet submitted</p>
          <p>Daily Status: Round is live</p>
          <p>Quote: "Music and geography are a perfect match."</p>
        </div>
      </details>

      <details class="card accordion-item">
        <summary>Database Data</summary>
        <div class="accordion-content">
          <table>
            <thead>
              <tr>
                <th>Player</th>
                <th>Daily Score</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Jules</td>
                <td>980</td>
              </tr>
              <tr>
                <td>Aria</td>
                <td>950</td>
              </tr>
              <tr>
                <td>Maya</td>
                <td>920</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>

      <details class="card accordion-item">
        <summary>WebSocket Data</summary>
        <div class="accordion-content">
          <ul id="websocket-data">
            <li>New daily high score set by Jules</li>
            <li>Player Maya submitted a guess</li>
            <li>Leaderboard refreshed 5 seconds ago</li>
          </ul>
        </div>
      </details>
    </div>
  </main>
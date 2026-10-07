 <main class="container py-4">
    <section class="guess-card shadow-sm border-0 rounded-4">
      <div class="result-inner-panel p-3 p-md-4">
        <h2 class="mb-3">Guess the Location</h2>
        <audio controls class="d-block w-100 mb-3">
          <source src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
        <p class="mb-3">Where in the world do you think this song is from?</p>

        <form action="result.html" method="get" class="guess-form row g-3">
          <div class="col-12 col-md-6">
            <label for="country" class="form-label">Country:</label>
            <input id="country" type="text" name="country" class="form-control" />
          </div>

          <div class="col-12 col-md-6">
            <label for="city" class="form-label">City:</label>
            <input id="city" type="text" name="city" class="form-control" />
          </div>

          <div class="col-12">
            <input type="submit" value="Submit Guess" class="btn btn-primary px-4" />
          </div>
        </form>

        <img
          src="map.jpg"
          alt="World map"
          class="guess-map-image img-fluid mt-4 mx-auto d-block"
        />
      </div>
    </section>
  </main>
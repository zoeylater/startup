import React from 'react';

export default function Guess() {
  return (
 <main className="container py-4">
    <section className="guess-card shadow-sm border-0 rounded-4">
      <div className="result-inner-panel p-3 p-md-4">
        <h2 className="mb-3">Guess the Location</h2>
        <audio controls className="d-block w-100 mb-3">
          <source src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
        <p className="mb-3">Where in the world do you think this song is from?</p>

        <form action="/result" method="get" className="guess-form row g-3">
          <div className="col-12 col-md-6">
            <label htmlFor="country" className="form-label">Country:</label>
            <input id="country" type="text" name="country" className="form-control" />
          </div>

          <div className="col-12 col-md-6">
            <label htmlFor="city" className="form-label">City:</label>
            <input id="city" type="text" name="city" className="form-control" />
          </div>

          <div className="col-12">
            <input type="submit" value="Submit Guess" className="btn btn-primary px-4" />
          </div>
        </form>

        <img
          src="map.jpg"
          alt="World map"
          className="guess-map-image img-fluid mt-4 mx-auto d-block"
        />
      </div>
    </section>
  </main>
  );
}
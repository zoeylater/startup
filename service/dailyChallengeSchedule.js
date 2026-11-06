const scheduleStart = '2026-11-05';
const scheduleEnd = '2026-11-30';

function getScheduledChallenge(schedule, date) {
  return schedule.find((challenge) => challenge.date === date) || null;
}

async function getScheduledDailyChallenge(schedule, date, fetchTrack = fetch) {
  const scheduled = getScheduledChallenge(schedule, date);
  if (!scheduled) {
    return null;
  }

  const challenge = {
    date: scheduled.date,
    artistId: scheduled.artistId,
    title: scheduled.title,
    artist: scheduled.artist,
    city: scheduled.city,
    country: scheduled.country,
    latitude: scheduled.latitude,
    longitude: scheduled.longitude,
    musicMetadata: {
      source: 'Prebuilt daily schedule',
      title: scheduled.title,
      artist: scheduled.artist,
      release: '',
    },
    preview: null,
    previewError: 'Audio is temporarily unavailable for today’s scheduled song.',
  };
  const trackUrl = `https://api.deezer.com/track/${scheduled.deezerTrackId}`;

  try {
    const response = await fetchTrack(trackUrl, { signal: AbortSignal.timeout(10_000) });
    console.info(`[daily-challenge] Deezer preview refresh status=${response.status}.`);
    if (!response.ok) {
      throw new Error(`Deezer track request failed (${response.status}).`);
    }

    const track = await response.json();
    if (track.error) {
      throw new Error(`Deezer track request failed: ${track.error.message || 'unknown error'}.`);
    }
    if (String(track.id) !== String(scheduled.deezerTrackId)) {
      throw new Error(`Deezer returned unexpected track ID ${track.id}.`);
    }
    if (typeof track.preview !== 'string' || !track.preview) {
      throw new Error('Deezer did not return a current preview URL for the scheduled track.');
    }

    challenge.preview = {
      provider: 'Deezer',
      trackId: scheduled.deezerTrackId,
      durationSeconds: 30,
      url: track.preview,
      trackUrl: `https://www.deezer.com/track/${scheduled.deezerTrackId}`,
      albumCover: track.album?.cover_medium || track.album?.cover || '',
    };
    challenge.musicMetadata.release = track.album?.title || '';
    challenge.previewError = '';
  } catch (error) {
    console.warn(
      `[daily-challenge] Audio unavailable for scheduled track ${scheduled.deezerTrackId}; keeping the challenge unchanged:`,
      error,
    );
  }

  return challenge;
}

function validateDailyChallengeSchedule(schedule) {
  if (!Array.isArray(schedule)) {
    throw new Error('The prebuilt daily challenge schedule must be an array.');
  }

  const expectedDates = [];
  for (
    let timestamp = Date.parse(`${scheduleStart}T00:00:00.000Z`);
    timestamp <= Date.parse(`${scheduleEnd}T00:00:00.000Z`);
    timestamp += 24 * 60 * 60 * 1000
  ) {
    expectedDates.push(new Date(timestamp).toISOString().slice(0, 10));
  }

  if (schedule.length !== expectedDates.length) {
    throw new Error(
      `The prebuilt schedule must contain exactly ${expectedDates.length} daily challenges.`,
    );
  }

  const trackIds = new Set();
  const songs = new Set();
  for (const [index, challenge] of schedule.entries()) {
    if (
      !challenge
      || challenge.date !== expectedDates[index]
      || typeof challenge.deezerTrackId !== 'number'
      || !Number.isInteger(challenge.deezerTrackId)
      || typeof challenge.artistId !== 'string'
      || !challenge.artistId
      || typeof challenge.title !== 'string'
      || !challenge.title
      || typeof challenge.artist !== 'string'
      || !challenge.artist
      || typeof challenge.city !== 'string'
      || !challenge.city
      || typeof challenge.country !== 'string'
      || !challenge.country
      || !Number.isFinite(challenge.latitude)
      || challenge.latitude < -90
      || challenge.latitude > 90
      || !Number.isFinite(challenge.longitude)
      || challenge.longitude < -180
      || challenge.longitude > 180
    ) {
      throw new Error(`The prebuilt daily challenge for ${expectedDates[index]} is invalid.`);
    }

    if (trackIds.has(challenge.deezerTrackId)) {
      throw new Error(`Deezer track ${challenge.deezerTrackId} is scheduled more than once.`);
    }
    const song = `${challenge.artist.trim().toLocaleLowerCase()}\u0000${challenge.title.trim().toLocaleLowerCase()}`;
    if (songs.has(song)) {
      throw new Error(`The song "${challenge.title}" by ${challenge.artist} is scheduled more than once.`);
    }
    trackIds.add(challenge.deezerTrackId);
    songs.add(song);
  }
}

module.exports = {
  getScheduledChallenge,
  getScheduledDailyChallenge,
  validateDailyChallengeSchedule,
};

function normalizeMusicText(value) {
  return String(value || '').toLocaleLowerCase().replace(/[^a-z0-9]/g, '');
}

function createUsedChallengeIdentifiers(challenges) {
  const identifiers = {
    trackIds: new Set(),
    recordingIds: new Set(),
    deezerArtistIds: new Set(),
    musicBrainzArtistIds: new Set(),
    artists: new Set(),
  };

  for (const challenge of challenges) {
    const trackId = challenge.preview?.trackId;
    const recordingId = challenge.musicMetadata?.recordingId;

    if (trackId !== undefined && trackId !== null) {
      identifiers.trackIds.add(String(trackId));
    }
    if (recordingId) {
      identifiers.recordingIds.add(String(recordingId).toLowerCase());
    }
    if (challenge.artistId !== undefined && challenge.artistId !== null) {
      identifiers.deezerArtistIds.add(String(challenge.artistId));
    }
    const musicBrainzArtistId = challenge.musicMetadata?.artistId;
    if (musicBrainzArtistId !== undefined && musicBrainzArtistId !== null) {
      identifiers.musicBrainzArtistIds.add(String(musicBrainzArtistId));
    }
    for (const artist of [challenge.artist, challenge.musicMetadata?.artist]) {
      const normalizedArtist = normalizeMusicText(artist);
      if (normalizedArtist) {
        identifiers.artists.add(normalizedArtist);
      }
    }
  }

  return identifiers;
}

function isUnusedDeezerCandidate(track, identifiers) {
  return !identifiers.trackIds.has(String(track.id))
    && !identifiers.deezerArtistIds.has(String(track.artist.id))
    && !identifiers.artists.has(normalizeMusicText(track.artist.name));
}

function isUnusedMusicBrainzArtist(artist, identifiers) {
  return !identifiers.musicBrainzArtistIds.has(String(artist.id))
    && !identifiers.artists.has(normalizeMusicText(artist.name));
}

function isUnusedRecording(recording, identifiers) {
  return !recording?.id
    || !identifiers.recordingIds.has(String(recording.id).toLowerCase());
}

function isUnusedChallenge(challenge, identifiers) {
  const trackId = challenge.preview?.trackId;
  const recordingId = challenge.musicMetadata?.recordingId;
  const deezerArtistId = challenge.artistId;
  const musicBrainzArtistId = challenge.musicMetadata?.artistId;
  const artist = normalizeMusicText(challenge.artist);

  return !identifiers.trackIds.has(String(trackId))
    && !identifiers.recordingIds.has(String(recordingId || '').toLowerCase())
    && !identifiers.deezerArtistIds.has(String(deezerArtistId))
    && !identifiers.musicBrainzArtistIds.has(String(musicBrainzArtistId))
    && !identifiers.artists.has(artist);
}

module.exports = {
  createUsedChallengeIdentifiers,
  isUnusedDeezerCandidate,
  isUnusedMusicBrainzArtist,
  isUnusedRecording,
  isUnusedChallenge,
};

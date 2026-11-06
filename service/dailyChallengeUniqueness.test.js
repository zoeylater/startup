const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createUsedChallengeIdentifiers,
  isUnusedDeezerCandidate,
  isUnusedMusicBrainzArtist,
  isUnusedRecording,
  isUnusedChallenge,
} = require('./dailyChallengeUniqueness');

test('a later date cannot reuse a saved track, recording, or artist', () => {
  const yesterday = {
    date: '2026-11-04',
    artistId: 'artist-1',
    artist: 'Used Artist',
    preview: { trackId: 100 },
    musicMetadata: {
      artistId: 'mb-artist-1',
      artist: 'Used Artist',
      recordingId: 'recording-1',
    },
  };
  const identifiers = createUsedChallengeIdentifiers([yesterday]);

  assert.equal(isUnusedDeezerCandidate({
    id: 100,
    artist: { id: 'artist-2', name: 'Another Artist' },
  }, identifiers), false);
  assert.equal(isUnusedDeezerCandidate({
    id: 101,
    artist: { id: 'artist-2', name: 'Another Artist' },
  }, identifiers), true);
  assert.equal(isUnusedDeezerCandidate({
    id: 102,
    artist: { id: 'artist-1', name: 'Another Artist' },
  }, identifiers), false);
  assert.equal(isUnusedDeezerCandidate({
    id: 103,
    artist: { id: 'artist-3', name: 'used artist' },
  }, identifiers), false);
  assert.equal(isUnusedMusicBrainzArtist({
    id: 'mb-artist-1',
    name: 'Different Display Name',
  }, identifiers), false);
  assert.equal(isUnusedRecording({ id: 'recording-1' }, identifiers), false);
  assert.equal(isUnusedRecording({ id: 'recording-2' }, identifiers), true);
  assert.equal(isUnusedChallenge({
    date: '2026-11-05',
    artistId: 'artist-2',
    artist: 'Different Artist',
    preview: { trackId: 100 },
    musicMetadata: {
      artistId: 'mb-artist-2',
      artist: 'Different Artist',
      recordingId: 'recording-2',
    },
  }, identifiers), false);
  assert.equal(isUnusedChallenge({
    date: '2026-11-05',
    artistId: 'artist-2',
    artist: 'Different Artist',
    preview: { trackId: 104 },
    musicMetadata: {
      artistId: 'mb-artist-2',
      artist: 'Different Artist',
      recordingId: 'recording-2',
    },
  }, identifiers), true);
});

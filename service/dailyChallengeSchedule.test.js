const test = require('node:test');
const assert = require('node:assert/strict');
const schedule = require('./daily-challenge-schedule.json');
const {
  getScheduledChallenge,
  getScheduledDailyChallenge,
  validateDailyChallengeSchedule,
} = require('./dailyChallengeSchedule');

test('prebuilt schedule has a unique complete challenge for every date in range', () => {
  assert.doesNotThrow(() => validateDailyChallengeSchedule(schedule));
  const archivedSongs = new Set([
    'blinding lights|the weeknd',
    "hips don't lie|shakira",
    'shape of you|ed sheeran',
    'suzanna|sauti sol',
    'distant lover|marvin gaye',
  ]);
  for (const challenge of schedule) {
    assert.equal(
      archivedSongs.has(`${challenge.title.toLocaleLowerCase()}|${challenge.artist.toLocaleLowerCase()}`),
      false,
    );
  }
});

test('November 5 and November 6 return different songs', () => {
  const november5 = getScheduledChallenge(schedule, '2026-11-05');
  const november6 = getScheduledChallenge(schedule, '2026-11-06');

  assert.ok(november5);
  assert.ok(november6);
  assert.notEqual(november5.deezerTrackId, november6.deezerTrackId);
  assert.notDeepEqual(
    [november5.title, november5.artist],
    [november6.title, november6.artist],
  );
});

test('dates outside the prebuilt range have no scheduled challenge', () => {
  assert.equal(getScheduledChallenge(schedule, '2026-11-04'), null);
  assert.equal(getScheduledChallenge(schedule, '2026-12-01'), null);
});

test('scheduled challenge refreshes only the preview for its fixed Deezer track', async () => {
  const requests = [];
  const challenge = await getScheduledDailyChallenge(
    schedule,
    '2026-11-05',
    async (url) => {
      requests.push(url);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          id: 3818963601,
          title: 'Ignored response title',
          artist: { name: 'Ignored response artist' },
          preview: 'https://preview.example/current.mp3',
          album: {
            title: 'Dracula (with JENNIE)',
            cover_medium: 'https://images.example/dracula-cover.jpg',
          },
        }),
      };
    },
  );

  assert.deepEqual(requests, ['https://api.deezer.com/track/3818963601']);
  assert.equal(challenge.title, 'Dracula (with JENNIE)');
  assert.equal(challenge.artist, 'Tame Impala');
  assert.equal(challenge.preview.url, 'https://preview.example/current.mp3');
  assert.equal(challenge.preview.durationSeconds, 30);
  assert.equal(challenge.preview.albumCover, 'https://images.example/dracula-cover.jpg');
  assert.equal(challenge.musicMetadata.release, 'Dracula (with JENNIE)');
});

test('a failed Deezer refresh keeps the scheduled song and returns no stale preview', async () => {
  const challenge = await getScheduledDailyChallenge(
    schedule,
    '2026-11-05',
    async () => {
      throw new Error('Deezer unavailable');
    },
  );

  assert.equal(challenge.title, 'Dracula (with JENNIE)');
  assert.equal(challenge.preview, null);
  assert.match(challenge.previewError, /temporarily unavailable/i);
});

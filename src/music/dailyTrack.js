const DEEZER_SEARCH_URL = '/api/music/deezer/search';

function normalize(value) {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]/g, '');
}

export function getDailyChallengeId(challenge) {
  if (!challenge) {
    return '';
  }
  const recordingId = challenge.musicMetadata?.recordingId || '';
  const trackId = challenge.preview?.trackId ?? '';
  if (recordingId || trackId) {
    return `recording:${recordingId}|deezer:${trackId}`;
  }
  const title = normalize(challenge.musicMetadata?.title || challenge.title || '');
  const artist = normalize(challenge.musicMetadata?.artist || challenge.artist || '');
  return title && artist ? `track:${artist}:${title}` : '';
}

export function guessMatchesDailyChallenge(guess, challenge) {
  if (!guess || !challenge) {
    return false;
  }

  const challengeId = getDailyChallengeId(challenge);
  if (guess.challengeId) {
    return guess.challengeId === challengeId;
  }

  const guessTitle = normalize(guess.musicMetadata?.title || '');
  const guessArtist = normalize(guess.musicMetadata?.artist || '');
  const challengeTitle = normalize(
    challenge.musicMetadata?.title || challenge.title || '',
  );
  const challengeArtist = normalize(
    challenge.musicMetadata?.artist || challenge.artist || '',
  );
  return Boolean(
    guessTitle
    && guessArtist
    && guessTitle === challengeTitle
    && guessArtist === challengeArtist,
  );
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : 'Unknown request error';
}

export async function fetchArchiveTrack(archive, signal) {
  const musicMetadata = {
    source: 'Archive',
    title: archive.title,
    artist: archive.artist,
    release: '',
  };
  const query = new URLSearchParams({
    q: `${archive.title} ${archive.artist}`,
    limit: '10',
  });

  try {
    const response = await fetch(`${DEEZER_SEARCH_URL}?${query}`, {
      signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Deezer request failed (${response.status}).`);
    }

    const data = await response.json();
    const normalizedTitle = normalize(archive.title);
    const normalizedArtist = normalize(archive.artist);
    const track = data.data?.find((candidate) => (
      normalize(candidate.title) === normalizedTitle
      && normalize(candidate.artist?.name || '').includes(normalizedArtist)
      && candidate.preview
    ));

    if (!track) {
      return {
        musicMetadata,
        preview: null,
        previewError: 'Deezer did not provide a matching archive preview.',
      };
    }

    return {
      musicMetadata: {
        ...musicMetadata,
        release: track.album?.title || '',
      },
      preview: {
        provider: 'Deezer',
        trackId: track.id,
        durationSeconds: 30,
        url: track.preview,
        trackUrl: track.link,
        albumCover: track.album?.cover_medium || archive.albumCover || '',
      },
      previewError: '',
    };
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }
    return {
      musicMetadata,
      preview: null,
      previewError: `Could not load the archive preview: ${getErrorMessage(error)}`,
    };
  }
}

export async function fetchDailyTrack(signal) {
  const response = await fetch('/api/daily-challenge', {
    signal,
    headers: { Accept: 'application/json' },
  });
  const responseBody = await response.text();
  let data;
  try {
    data = JSON.parse(responseBody);
  } catch {
    if (responseBody.trimStart().startsWith('<')) {
      throw new Error(
        'The daily challenge service returned an HTML page. Restart the backend so it loads the latest API routes.',
      );
    }
    throw new Error('The daily challenge service returned invalid JSON.');
  }
  if (!response.ok) {
    throw new Error(data.msg || `Could not load daily challenge (${response.status}).`);
  }
  if (
    !data.musicMetadata
    || !Number.isFinite(data.latitude)
    || !Number.isFinite(data.longitude)
  ) {
    throw new Error('The service returned an incomplete daily challenge.');
  }
  return {
    ...data,
    previewError: data.preview
      ? ''
      : data.previewError
        || 'The song preview is temporarily unavailable. You can still make a location guess.',
  };
}

const MUSICBRAINZ_URL = 'https://musicbrainz.org/ws/2/recording/';
const DEEZER_SEARCH_URL = '/api/music/deezer/search';

function normalize(value) {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]/g, '');
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
  const musicBrainzQuery = new URLSearchParams({
    query: 'artist:"Sauti Sol" AND recording:"Suzanna"',
    fmt: 'json',
    limit: '1',
  });
  const musicBrainzUrl = `${MUSICBRAINZ_URL}?${musicBrainzQuery}`;
  let musicBrainzResponse = await fetch(
    musicBrainzUrl,
    { signal, headers: { Accept: 'application/json' } },
  );
  if (musicBrainzResponse.status === 503 && !signal.aborted) {
    await new Promise((resolve) => setTimeout(resolve, 1100));
    musicBrainzResponse = await fetch(
      musicBrainzUrl,
      { signal, headers: { Accept: 'application/json' } },
    );
  }
  if (!musicBrainzResponse.ok) {
    throw new Error(`MusicBrainz request failed (${musicBrainzResponse.status}).`);
  }

  const musicBrainzData = await musicBrainzResponse.json();
  const recording = musicBrainzData.recordings?.[0];
  if (!recording) {
    throw new Error('MusicBrainz did not find the daily recording.');
  }

  const artist = recording['artist-credit']
    ?.map((credit) => `${credit.name}${credit.joinphrase || ''}`)
    .join('') || 'Unknown artist';
  const musicMetadata = {
    source: 'MusicBrainz',
    recordingId: recording.id,
    title: recording.title,
    artist,
    release: recording.releases?.[0]?.title || '',
    url: `https://musicbrainz.org/recording/${recording.id}`,
  };

  const deezerQuery = new URLSearchParams({
    q: `${recording.title} ${artist}`,
    limit: '10',
  });

  try {
    const deezerResponse = await fetch(
      `${DEEZER_SEARCH_URL}?${deezerQuery}`,
      { signal, headers: { Accept: 'application/json' } },
    );
    if (!deezerResponse.ok) {
      throw new Error(`Deezer request failed (${deezerResponse.status}).`);
    }

    const deezerData = await deezerResponse.json();
    const normalizedTitle = normalize(recording.title);
    const normalizedArtist = normalize(artist);
    const track = deezerData.data?.find((candidate) => (
      normalize(candidate.title) === normalizedTitle
      && normalize(candidate.artist?.name || '').includes(normalizedArtist)
      && candidate.preview
    ));

    if (!track) {
      return {
        musicMetadata,
        preview: null,
        previewError: 'Deezer did not provide a matching audio preview.',
      };
    }

    return {
      musicMetadata,
      preview: {
        provider: 'Deezer',
        trackId: track.id,
        durationSeconds: 30,
        url: track.preview,
        trackUrl: track.link,
        albumCover: track.album?.cover_medium || track.album?.cover || '',
      },
      previewError: '',
    };
  } catch (error) {
    if (signal.aborted) {
      throw error;
    }
    return {
      musicMetadata,
      preview: null,
      previewError: `Could not load the Deezer preview: ${getErrorMessage(error)}`,
    };
  }
}

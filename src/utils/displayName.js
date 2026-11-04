export function getDisplayName(value) {
  if (typeof value !== 'string') {
    return 'Player';
  }

  const firstPart = value.trim().split('@')[0].split(/[.\s]/)[0];
  return firstPart || 'Player';
}

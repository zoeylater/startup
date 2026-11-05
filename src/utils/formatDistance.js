const KILOMETERS_PER_MILE = 1.609344;

export function formatDistanceMiles(distanceKm) {
  const miles = distanceKm / KILOMETERS_PER_MILE;
  return `${miles.toLocaleString(undefined, { maximumFractionDigits: 1 })} miles`;
}

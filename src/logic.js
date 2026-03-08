export function clamp(value, min, max) {
  if (min > max) {
    return value;
  }
  return Math.max(min, Math.min(max, value));
}

export function computeBrickRows(level, baseRows, maxExtra) {
  const extraRows = Math.max(level - 1, 0);
  const capped = Math.min(baseRows + extraRows, baseRows + maxExtra);
  return capped;
}

export function progressPercentage(totalBricks, aliveBricks) {
  if (!totalBricks) {
    return 0;
  }
  const destroyed = totalBricks - aliveBricks;
  const progress = (destroyed / totalBricks) * 100;
  return Math.min(Math.max(progress, 0), 100);
}

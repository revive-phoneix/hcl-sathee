export function getPercentColor(val) {
  const num = parseInt(val);
  if (num >= 90) return "text-emerald-600";
  if (num >= 85) return "text-blue-600";
  if (num >= 80) return "text-amber-600";
  return "text-red-500";
}

export function getBarWidth(val) {
  return `${parseInt(val)}%`;
}

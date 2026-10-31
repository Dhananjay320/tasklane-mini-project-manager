// A stable accent dot per project, picked from its id (all pass 3:1 against white).
const COLORS = ["#4338CA", "#C2410C", "#0F766E", "#7C3AED", "#B45309", "#0369A1", "#BE185D", "#15803D"];

export function projectColor(id: string): string {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORS[hash % COLORS.length];
}

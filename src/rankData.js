// rankData.js
// Rocket League rank tiers, Bronze I through Supersonic Legend, mapped to
// a flat numeric scale so we can average them for seeding purposes.

export const RANK_TIERS = [
  { name: "Bronze", color: "#8a5a3c" },
  { name: "Silver", color: "#a7b0b8" },
  { name: "Gold", color: "#d7a43a" },
  { name: "Platinum", color: "#3fc7c1" },
  { name: "Diamond", color: "#4f8ff0" },
  { name: "Champion", color: "#9b5de5" },
  { name: "Grand Champion", color: "#ef4b5f" },
];

const DIVISIONS = ["I", "II", "III"];

// Build the flat list: Bronze I (1) ... Grand Champion III (21), SSL (22)
export const RANKS = (() => {
  const list = [];
  let value = 1;
  RANK_TIERS.forEach((tier) => {
    DIVISIONS.forEach((division) => {
      list.push({
        value: value++,
        label: `${tier.name} ${division}`,
        tier: tier.name,
        color: tier.color,
      });
    });
  });
  list.push({
    value: value++,
    label: "Supersonic Legend",
    tier: "SSL",
    color: "#ff5fa2",
  });
  return list;
})();

export const DEFAULT_RANK_VALUE = RANKS[0].value;

export function getRankByValue(value) {
  const rounded = Math.round(value);
  return (
    RANKS.find((r) => r.value === rounded) || RANKS[RANKS.length - 1]
  );
}

export function getRankOptions() {
  return RANKS.map((r) => ({ value: r.value, label: r.label }));
}

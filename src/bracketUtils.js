// bracketUtils.js
// Pure functions for seeding teams and building/updating the bracket tree.
// Kept separate from App.js so the seeding math can be unit-tested on its own.

import { getRankByValue } from "./rankData";

const BYE = { id: "bye", name: "BYE", isBye: true };

/** Next power of two >= n (minimum 2). */
function nextPowerOfTwo(n) {
  let size = 2;
  while (size < n) size *= 2;
  return size;
}

/**
 * Standard tournament "snake" seeding order.
 * For 8 slots this returns [1, 8, 4, 5, 2, 7, 3, 6], which pairs up as
 * (1 v 8), (4 v 5), (2 v 7), (3 v 6) - i.e. seed sums are constant per
 * round so the top seeds are kept apart for as long as possible.
 */
function snakeSeedOrder(size) {
  let order = [1, 2];
  while (order.length < size) {
    const mirror = order.length * 2 + 1;
    const next = [];
    order.forEach((seed) => {
      next.push(seed);
      next.push(mirror - seed);
    });
    order = next;
  }
  return order;
}

/**
 * Averages each team's three player ranks, sorts descending, and returns
 * the teams annotated with their seed number (1 = strongest).
 */
export function computeSeeding(teams) {
  return teams
    .map((team) => {
      const avg = (team.r1 + team.r2 + team.r3) / 3;
      return { ...team, avgRank: avg, rankInfo: getRankByValue(avg) };
    })
    .sort((a, b) => b.avgRank - a.avgRank)
    .map((team, index) => ({ ...team, seed: index + 1 }));
}

/**
 * Builds the full bracket tree (array of rounds, each an array of matches)
 * from a list of teams. Handles non-power-of-two team counts by inserting
 * BYEs, which are auto-advanced immediately.
 */
export function generateBracket(teams) {
  const seeded = computeSeeding(teams);
  const size = nextPowerOfTwo(seeded.length);
  const order = snakeSeedOrder(size);

  // slot i (0-indexed) holds whichever seed number order[i] specifies
  const slots = order.map((seedNum) => seeded[seedNum - 1] || BYE);

  const numRounds = Math.log2(size);
  const rounds = [];

  // Round 1: pair up consecutive slots
  const round1 = [];
  for (let i = 0; i < size; i += 2) {
    const teamA = slots[i];
    const teamB = slots[i + 1];
    let winner = null;
    if (teamA.isBye && !teamB.isBye) winner = teamB;
    if (teamB.isBye && !teamA.isBye) winner = teamA;
    round1.push({
      id: `r0-m${i / 2}`,
      teamA,
      teamB,
      winner,
    });
  }
  rounds.push(round1);

  // Empty shells for subsequent rounds
  for (let r = 1; r < numRounds; r++) {
    const matchCount = size / Math.pow(2, r + 1);
    const round = [];
    for (let i = 0; i < matchCount; i++) {
      round.push({ id: `r${r}-m${i}`, teamA: null, teamB: null, winner: null });
    }
    rounds.push(round);
  }

  // Propagate any immediate BYE winners forward until the tree settles
  propagateAll(rounds);
  return rounds;
}

function propagateAll(rounds) {
  let changed = true;
  while (changed) {
    changed = false;
    for (let r = 0; r < rounds.length - 1; r++) {
      rounds[r].forEach((match, matchIdx) => {
        if (!match.winner) return;
        const nextMatch = rounds[r + 1][Math.floor(matchIdx / 2)];
        const slot = matchIdx % 2 === 0 ? "teamA" : "teamB";
        if (!nextMatch[slot] || nextMatch[slot].id !== match.winner.id) {
          nextMatch[slot] = match.winner;
          changed = true;
        }
        // A lone BYE meeting a real team in the next round auto-advances too
        if (
          nextMatch.teamA &&
          nextMatch.teamB &&
          !nextMatch.winner
        ) {
          if (nextMatch.teamA.isBye && !nextMatch.teamB.isBye) {
            nextMatch.winner = nextMatch.teamB;
            changed = true;
          } else if (nextMatch.teamB.isBye && !nextMatch.teamA.isBye) {
            nextMatch.winner = nextMatch.teamA;
            changed = true;
          }
        }
      });
    }
  }
}

/**
 * Clears every downstream slot/winner that was populated because of a
 * match's previous winner. Called before writing a new winner so that
 * changing an earlier-round result doesn't leave a stale team floating
 * in a later round.
 */
function clearDownstream(rounds, roundIdx, matchIdx) {
  const match = rounds[roundIdx]?.[matchIdx];
  if (!match) return;
  match.winner = null;
  const nextRoundIdx = roundIdx + 1;
  if (nextRoundIdx >= rounds.length) return;
  const nextMatchIdx = Math.floor(matchIdx / 2);
  const slot = matchIdx % 2 === 0 ? "teamA" : "teamB";
  const nextMatch = rounds[nextRoundIdx][nextMatchIdx];
  if (nextMatch[slot]) {
    nextMatch[slot] = null;
    clearDownstream(rounds, nextRoundIdx, nextMatchIdx);
  }
}

/**
 * Sets the winner for a given match, then advances that team into the
 * correct slot of the next round, cascading a reset through anything
 * that depended on the previous winner. Returns a brand-new rounds array
 * (does not mutate the input) so it's safe to use directly in setState.
 */
export function advanceWinner(rounds, roundIdx, matchIdx, winner) {
  const clone = rounds.map((round) => round.map((m) => ({ ...m })));
  const match = clone[roundIdx][matchIdx];
  match.winner = winner;

  const nextRoundIdx = roundIdx + 1;
  if (nextRoundIdx >= clone.length) return clone; // grand final, nothing downstream

  const nextMatchIdx = Math.floor(matchIdx / 2);
  const slot = matchIdx % 2 === 0 ? "teamA" : "teamB";
  const nextMatch = clone[nextRoundIdx][nextMatchIdx];

  if (nextMatch[slot] && nextMatch[slot].id !== winner.id) {
    clearDownstream(clone, nextRoundIdx, nextMatchIdx);
  }
  nextMatch[slot] = winner;

  return clone;
}

export { BYE };

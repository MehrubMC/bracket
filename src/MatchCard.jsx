// MatchCard.js
// This is passed to react-brackets as `renderSeedComponent`. It replaces
// the library's default seed markup entirely so the bracket can look like
// a real broadcast-style tournament tree.
import React from "react";
import { Seed, SeedItem } from "react-brackets";

export default function MatchCard({ seed, roundIndex, seedIndex, onSelectWinner }) {
  const [teamA, teamB] = seed.teams;
  const winnerId = seed.winnerId;

  const canClick = (team) =>
    team && !team.isBye && teamA && teamB && !teamA.isBye && !teamB.isBye;

  return (
    <Seed className="rl-seed" mobileBreakpoint={seed.mobileBreakpoint}>
      <SeedItem className="rl-seed-item">
        <div className="match-card">
          <TeamRow
            team={teamA}
            isWinner={teamA && winnerId === teamA.id}
            isDecided={!!winnerId}
            clickable={canClick(teamA)}
            onClick={() => canClick(teamA) && onSelectWinner(roundIndex, seedIndex, teamA)}
          />
          <div className="match-divider" />
          <TeamRow
            team={teamB}
            isWinner={teamB && winnerId === teamB.id}
            isDecided={!!winnerId}
            clickable={canClick(teamB)}
            onClick={() => canClick(teamB) && onSelectWinner(roundIndex, seedIndex, teamB)}
          />
        </div>
      </SeedItem>
    </Seed>
  );
}

function TeamRow({ team, isWinner, isDecided, clickable, onClick }) {
  if (!team) {
    return (
      <div className="team-row-slot empty">
        <span className="team-row-placeholder">TBD</span>
      </div>
    );
  }

  const classes = [
    "team-row-slot",
    team.isBye ? "is-bye" : "",
    isWinner ? "is-winner" : "",
    isDecided && !isWinner && !team.isBye ? "is-loser" : "",
    clickable ? "is-clickable" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} onClick={onClick}>
      <span className="team-seed-badge">{team.isBye ? "" : team.seed}</span>
      <span className="team-row-name">{team.name}</span>
      {team.rankInfo && (
        <span className="team-rank-chip" style={{ color: team.rankInfo.color }}>
          {team.rankInfo.label}
        </span>
      )}
    </div>
  );
}

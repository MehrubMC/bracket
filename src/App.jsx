import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Bracket } from "react-brackets";
import TeamForm from "./TeamForm";
import MatchCard from "./MatchCard";
import { generateBracket, advanceWinner } from "./bracketUtils";
import { loadState, saveState, clearState } from "./persistence";
import "./App.css";

function roundTitle(index, totalRounds) {
  const remaining = totalRounds - index;
  if (remaining === 1) return "Grand Final";
  if (remaining === 2) return "Semifinals";
  if (remaining === 3) return "Quarterfinals";
  return `Round of ${Math.pow(2, remaining + 1)}`;
}

// Convert our internal rounds (array of {teamA, teamB, winner}) into the
// shape react-brackets expects: [{ title, seeds: [{ id, teams, winnerId }] }]
function toBracketFormat(rounds) {
  const totalRounds = rounds.length;
  return rounds.map((round, roundIdx) => ({
    title: roundTitle(roundIdx, totalRounds),
    seeds: round.map((match) => ({
      id: match.id,
      winnerId: match.winner ? match.winner.id : null,
      teams: [match.teamA, match.teamB],
    })),
  }));
}

// Load once, synchronously, before first render - avoids a flash of the
// empty setup screen when a saved bracket already exists.
const saved = loadState();

export default function App() {
  const [teams, setTeams] = useState(saved?.teams || []);
  const [rounds, setRounds] = useState(saved?.rounds || null);
  const [stage, setStage] = useState(saved?.stage || "setup");

  // Whenever any of these change, persist the whole state to localStorage.
  useEffect(() => {
    saveState({ teams, rounds, stage });
  }, [teams, rounds, stage]);

  const handleAddTeam = useCallback((team) => {
    setTeams((prev) => [...prev, team]);
  }, []);

  const handleRemoveTeam = useCallback((id) => {
    setTeams((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleGenerate = useCallback(() => {
    setRounds(generateBracket(teams));
    setStage("bracket");
  }, [teams]);

  const handleReset = useCallback(() => {
    setRounds(null);
    setStage("setup");
  }, []);

  // Full wipe: clears teams, bracket, and the saved localStorage entry.
  const handleStartOver = useCallback(() => {
    if (!window.confirm("Reset everything? This clears all teams and the current bracket.")) {
      return;
    }
    setTeams([]);
    setRounds(null);
    setStage("setup");
    clearState();
  }, []);

  // Click-to-advance: fires when a team is clicked inside a MatchCard.
  // This is the trigger that keeps react-brackets' data structure in sync -
  // it writes the winner into the current match AND seeds the next round.
  const handleSelectWinner = useCallback((roundIdx, matchIdx, winner) => {
    setRounds((prev) => advanceWinner(prev, roundIdx, matchIdx, winner));
  }, []);

  const bracketData = useMemo(
    () => (rounds ? toBracketFormat(rounds) : null),
    [rounds]
  );

  const champion = useMemo(() => {
    if (!rounds) return null;
    const finalMatch = rounds[rounds.length - 1][0];
    return finalMatch.winner || null;
  }, [rounds]);

  return (
    <div className="app-shell">
      <div className="bg-glow" aria-hidden="true" />

      {stage === "setup" && (
        <>
          <TeamForm
            teams={teams}
            onAddTeam={handleAddTeam}
            onRemoveTeam={handleRemoveTeam}
            onGenerate={handleGenerate}
          />
          {teams.length > 0 && (
            <div className="reset-row">
              <button className="btn-text-danger" onClick={handleStartOver}>
                Reset everything
              </button>
            </div>
          )}
        </>
      )}

      {stage === "bracket" && bracketData && (
        <div className="bracket-page">
          <div className="bracket-topbar">
            <div>
              <h1>Tournament Bracket</h1>
              <p className="setup-sub">
                Click a team in any match to advance them to the next round.
              </p>
            </div>
            <div className="bracket-topbar-actions">
              <button className="btn btn-secondary" onClick={handleReset}>
                ← Edit Teams
              </button>
              <button className="btn-text-danger" onClick={handleStartOver}>
                Reset everything
              </button>
            </div>
          </div>

          {champion && (
            <div className="champion-banner">
              <span className="champion-label">Champion</span>
              <span className="champion-name">{champion.name}</span>
            </div>
          )}

          <div className="bracket-scroll">
            <Bracket
              rounds={bracketData}
              renderSeedComponent={(props) => (
                <MatchCard {...props} onSelectWinner={handleSelectWinner} />
              )}
              roundTitleComponent={(title) => (
                <div className="round-title">{title}</div>
              )}
              roundClassName="rl-round"
              bracketClassName="rl-bracket-container"
              mobileBreakpoint={0}
            />
          </div>
        </div>
      )}
    </div>
  );
}
// App.js
import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Bracket } from "react-brackets";
import TeamForm from "./TeamForm";
import MatchCard from "./MatchCard";
import PodiumModal from "./PodiumModal";
import {
  generateBracket,
  advanceWinner,
  computeBronzeMatch,
  projectBySeed,
} from "./bracketUtils";
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
  const [bronzeWinnerId, setBronzeWinnerId] = useState(saved?.bronzeWinnerId || null);
  const [projected, setProjected] = useState(saved?.projected || false);
  const [showPodium, setShowPodium] = useState(false);

  // Whenever any of these change, persist the whole state to localStorage.
  useEffect(() => {
    saveState({ teams, rounds, stage, bronzeWinnerId, projected });
  }, [teams, rounds, stage, bronzeWinnerId, projected]);

  const handleAddTeam = useCallback((team) => {
    setTeams((prev) => [...prev, team]);
  }, []);

  const handleRemoveTeam = useCallback((id) => {
    setTeams((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleGenerate = useCallback(() => {
    setRounds(generateBracket(teams));
    setBronzeWinnerId(null);
    setProjected(false);
    setShowPodium(false);
    setStage("bracket");
  }, [teams]);

  const handleReset = useCallback(() => {
    setRounds(null);
    setShowPodium(false);
    setStage("setup");
  }, []);

  // Full wipe: clears teams, bracket, and the saved localStorage entry.
  const handleStartOver = useCallback(() => {
    if (!window.confirm("Reset everything? This clears all teams and the current bracket.")) {
      return;
    }
    setTeams([]);
    setRounds(null);
    setBronzeWinnerId(null);
    setProjected(false);
    setShowPodium(false);
    setStage("setup");
    clearState();
  }, []);

  // Click-to-advance: fires when a team is clicked inside a MatchCard.
  // This is the trigger that keeps react-brackets' data structure in sync -
  // it writes the winner into the current match AND seeds the next round.
  const handleSelectWinner = useCallback((roundIdx, matchIdx, winner) => {
    setRounds((prev) => advanceWinner(prev, roundIdx, matchIdx, winner));
  }, []);

  const handleSelectBronzeWinner = useCallback((_roundIdx, _matchIdx, team) => {
    setBronzeWinnerId(team.id);
  }, []);

  // The real (manually-clicked) bronze match, derived from the semifinal
  // losers. If the underlying semifinal results change, a previously
  // stored bronzeWinnerId that no longer matches either team is simply
  // ignored below rather than needing an explicit reset.
  const realBronzeMatch = useMemo(() => (rounds ? computeBronzeMatch(rounds) : null), [rounds]);

  const realBronzeWinner = useMemo(() => {
    if (!realBronzeMatch || !bronzeWinnerId) return null;
    if (realBronzeMatch.teamA?.id === bronzeWinnerId) return realBronzeMatch.teamA;
    if (realBronzeMatch.teamB?.id === bronzeWinnerId) return realBronzeMatch.teamB;
    return null;
  }, [realBronzeMatch, bronzeWinnerId]);

  // The fully seed-projected version of everything, used when "Projected"
  // is checked. Round 0's pairings are fixed at generation time, so this
  // is always safe to compute from the live rounds state.
  const projectedResult = useMemo(
    () => (rounds && projected ? projectBySeed(rounds) : null),
    [rounds, projected]
  );

  const displayRounds = projected && projectedResult ? projectedResult.rounds : rounds;
  const bronzeMatch = projected && projectedResult ? projectedResult.bronze : realBronzeMatch;

  const bronzeWinner = useMemo(() => {
    if (projected) return bronzeMatch?.winner || null;
    return realBronzeWinner;
  }, [projected, bronzeMatch, realBronzeWinner]);

  const bracketData = useMemo(
    () => (displayRounds ? toBracketFormat(displayRounds) : null),
    [displayRounds]
  );

  const champion = useMemo(() => {
    if (!displayRounds) return null;
    const finalMatch = displayRounds[displayRounds.length - 1][0];
    return finalMatch.winner || null;
  }, [displayRounds]);

  // --- Real (non-projected) completion state, drives the podium popup ---
  const realFinalMatch = rounds ? rounds[rounds.length - 1][0] : null;
  const realChampion = realFinalMatch?.winner || null;
  const realRunnerUp = useMemo(() => {
    if (!realFinalMatch || !realFinalMatch.winner) return null;
    const { teamA, teamB, winner } = realFinalMatch;
    if (!teamA || !teamB) return null;
    return winner.id === teamA.id ? teamB : teamA;
  }, [realFinalMatch]);
  const bronzeNeeded = !!(realBronzeMatch && realBronzeMatch.teamA && realBronzeMatch.teamB);
  const isComplete = !!realChampion && (!bronzeNeeded || !!realBronzeWinner);

  // Pop the podium open the moment the bracket transitions into "complete"
  // (not on every render, and not just because a saved bracket that was
  // already finished got reloaded from localStorage).
  const wasCompleteRef = useRef(isComplete);
  useEffect(() => {
    if (isComplete && !wasCompleteRef.current) {
      setShowPodium(true);
    }
    if (!isComplete) {
      setShowPodium(false);
    }
    wasCompleteRef.current = isComplete;
  }, [isComplete]);

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
              <button className="btn-reset" onClick={handleStartOver}>
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
                {projected
                  ? "Showing a seed-based projection - uncheck to go back to your picks."
                  : "Click a team in any match to advance them to the next round."}
              </p>
            </div>
            <div className="bracket-topbar-actions">
              {isComplete && (
                <button className="btn btn-secondary" onClick={() => setShowPodium(true)}>
                  🏆 View Podium
                </button>
              )}
              <label className="projected-toggle">
                <input
                  type="checkbox"
                  checked={projected}
                  onChange={(e) => setProjected(e.target.checked)}
                />
                Projected
              </label>
              <button className="btn btn-secondary" onClick={handleReset}>
                ← Edit Teams
              </button>
              <button className="btn-reset" onClick={handleStartOver}>
                Reset everything
              </button>
            </div>
          </div>

          {champion && (
            <div className="champion-banner">
              <span className="champion-label">
                {projected ? "Projected Champion" : "Champion"}
              </span>
              <span className="champion-name">{champion.name}</span>
            </div>
          )}

          <div className="bracket-scroll">
            <div className="bracket-with-bronze">
              <Bracket
                rounds={bracketData}
                renderSeedComponent={(props) => (
                  <MatchCard {...props} onSelectWinner={handleSelectWinner} readOnly={projected} />
                )}
                roundTitleComponent={(title) => (
                  <div className="round-title">{title}</div>
                )}
                roundClassName="rl-round"
                bracketClassName="rl-bracket-container"
                mobileBreakpoint={0}
              />

              {bronzeMatch && (bronzeMatch.teamA || bronzeMatch.teamB) && (
                <div className="bronze-wrap">
                  <div className="round-title">Third Place</div>
                  <MatchCard
                    seed={{
                      id: bronzeMatch.id,
                      winnerId: bronzeWinner ? bronzeWinner.id : null,
                      teams: [bronzeMatch.teamA, bronzeMatch.teamB],
                    }}
                    roundIndex={0}
                    seedIndex={0}
                    onSelectWinner={handleSelectBronzeWinner}
                    readOnly={projected}
                  />
                </div>
              )}
            </div>
          </div>

          {showPodium && realChampion && (
            <PodiumModal
              first={realChampion}
              second={realRunnerUp}
              third={bronzeNeeded ? realBronzeWinner : undefined}
              onClose={() => setShowPodium(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
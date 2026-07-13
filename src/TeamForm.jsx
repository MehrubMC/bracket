// TeamForm.js
import React, { useState } from "react";
import { getRankOptions, DEFAULT_RANK_VALUE, getRankByValue } from "./rankData";

let idCounter = 1;

export default function TeamForm({ teams, onAddTeam, onRemoveTeam, onGenerate }) {
  const [name, setName] = useState("");
  const [r1, setR1] = useState(DEFAULT_RANK_VALUE);
  const [r2, setR2] = useState(DEFAULT_RANK_VALUE);
  const [r3, setR3] = useState(DEFAULT_RANK_VALUE);
  const rankOptions = getRankOptions();

  function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onAddTeam({
      id: `team-${idCounter++}`,
      name: name.trim(),
      r1: Number(r1),
      r2: Number(r2),
      r3: Number(r3),
    });
    setName("");
    setR1(DEFAULT_RANK_VALUE);
    setR2(DEFAULT_RANK_VALUE);
    setR3(DEFAULT_RANK_VALUE);
  }

  return (
    <div className="setup-panel">
      <div className="setup-header">
        <h1>Rocket League Tournament Bracket</h1>
        <p className="setup-sub">
          Add every roster, set each player's rank, then generate the bracket.
          Seeding is calculated from each team's average rank.
        </p>
      </div>

      <form className="team-form" onSubmit={handleAdd}>
        <input
          className="team-name-input"
          type="text"
          placeholder="Team name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="rank-selects">
          <RankSelect label="Player 1" value={r1} onChange={setR1} options={rankOptions} />
          <RankSelect label="Player 2" value={r2} onChange={setR2} options={rankOptions} />
          <RankSelect label="Player 3" value={r3} onChange={setR3} options={rankOptions} />
        </div>
        <button type="submit" className="btn btn-primary">
          + Add Team
        </button>
      </form>

      <div className="team-list">
        {teams.length === 0 && (
          <p className="empty-hint">No teams added yet.</p>
        )}
        {teams.map((t) => {
          const avg = (t.r1 + t.r2 + t.r3) / 3;
          const rankInfo = getRankByValue(avg);
          return (
            <div className="team-row" key={t.id}>
              <span className="team-row-name">{t.name}</span>
              <span
                className="rank-pill"
                style={{ borderColor: rankInfo.color, color: rankInfo.color }}
              >
                {rankInfo.label}
              </span>
              <button
                type="button"
                className="btn-remove"
                onClick={() => onRemoveTeam(t.id)}
                aria-label={`Remove ${t.name}`}
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        className="btn btn-generate"
        disabled={teams.length < 2}
        onClick={onGenerate}
      >
        Generate Bracket ({teams.length} teams)
      </button>
    </div>
  );
}

function RankSelect({ label, value, onChange, options }) {
  return (
    <label className="rank-select-wrap">
      <span className="rank-select-label">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

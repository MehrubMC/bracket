// PodiumModal.jsx
import React from "react";

export default function PodiumModal({ first, second, third, onClose }) {
  return (
    <div className="podium-backdrop" onClick={onClose}>
      <div className="podium-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="podium-title">Tournament Complete</h2>

        <div className="podium-stands">
          <div className="podium-stand podium-second">
            <div className="podium-team">
              {second ? (
                <>
                  <span className="podium-team-name">{second.name}</span>
                  {second.rankInfo && (
                    <span className="podium-team-rank" style={{ color: second.rankInfo.color }}>
                      {second.rankInfo.label}
                    </span>
                  )}
                </>
              ) : (
                <span className="podium-team-name">-</span>
              )}
            </div>
            <div className="podium-block podium-block-2">
              <span className="podium-place-num">2</span>
            </div>
          </div>

          <div className="podium-stand podium-first">
            <div className="podium-team">
              <span className="podium-team-name">{first.name}</span>
              {first.rankInfo && (
                <span className="podium-team-rank" style={{ color: first.rankInfo.color }}>
                  {first.rankInfo.label}
                </span>
              )}
            </div>
            <div className="podium-block podium-block-1">
              <span className="podium-place-num">1</span>
            </div>
          </div>

          {third !== undefined && (
            <div className="podium-stand podium-third">
              <div className="podium-team">
                {third ? (
                  <>
                    <span className="podium-team-name">{third.name}</span>
                    {third.rankInfo && (
                      <span className="podium-team-rank" style={{ color: third.rankInfo.color }}>
                        {third.rankInfo.label}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="podium-team-name">-</span>
                )}
              </div>
              <div className="podium-block podium-block-3">
                <span className="podium-place-num">3</span>
              </div>
            </div>
          )}
        </div>

        <button className="btn btn-secondary podium-close" onClick={onClose}>
          ← Back to Bracket
        </button>
      </div>
    </div>
  );
}
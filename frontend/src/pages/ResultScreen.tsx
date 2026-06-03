import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function ResultScreen() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, error } = useRoomState();

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
    }
  }, [navigate, room]);

  if (!room) {
    return null;
  }

  const isHostPlayer = participantId === room.hostId;
  const sorted = [...room.participants].sort((a, b) => b.score - a.score);
  const maxScore = sorted.length > 0 ? sorted[0].score : 0;
  const allZero = sorted.every((p) => p.score === 0);

  async function handleRestart() {
    try {
      await roomStore.restartRoom();
    } catch {
      // Error handled by store
    }
  }

  return (
    <section className="panel result-page">
      <div className="result-page__header">
        <span className="section-kicker">Game Over</span>
        <h1 className="result-page__title">Final Scores</h1>
      </div>

      <Card title="Scoreboard">
        {allZero ? (
          <p className="result-page__message">No correct guesses were made this round.</p>
        ) : (
          <div>
            {sorted.map((participant) => {
              const isWinner = participant.score === maxScore && maxScore > 0;
              return (
                <div
                  key={participant.id}
                  className={`placeholder-row ${isWinner ? "winner-row" : ""}`}
                  style={{
                    borderBottom: "1px solid #e5e7eb",
                    padding: "12px 0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <span>
                    {participant.name}
                    {isWinner && <span className="winner-badge"> Winner</span>}
                  </span>
                  <strong>{participant.score}</strong>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <div className="result-page__actions">
        {isHostPlayer ? (
          <button className="button button--primary" onClick={handleRestart}>
            Restart Game
          </button>
        ) : (
          <p className="result-page__message">Waiting for host to restart the game...</p>
        )}
      </div>

      {error && (
        <p className="result-page__error">{error}</p>
      )}
    </section>
  );
}

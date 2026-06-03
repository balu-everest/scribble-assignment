import { useRoomState } from "../state/roomStore";
import { Card } from "./Card";

export function Scoreboard() {
  const { room } = useRoomState();
  const participants = room?.participants ?? [];

  const sorted = [...participants].sort((a, b) => b.score - a.score);

  return (
    <Card title="Scoreboard">
      {sorted.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          <div className="placeholder-row">
            <span>Waiting for players...</span>
            <strong>0</strong>
          </div>
        </div>
      ) : (
        <div>
          {sorted.map((participant) => (
            <div key={participant.id} className="placeholder-row" style={{ borderBottom: "1px solid #e5e7eb", padding: "8px 0" }}>
              <span>{participant.name}</span>
              <strong>{participant.score}</strong>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

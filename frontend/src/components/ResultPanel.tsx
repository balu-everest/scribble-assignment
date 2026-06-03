import { useRoomState } from "../state/roomStore";
import { Card } from "./Card";

export function ResultPanel() {
  const { room } = useRoomState();
  const guesses = room?.guesses ?? [];

  return (
    <Card title="Activity">
      {guesses.length === 0 ? (
        <div className="placeholder-block" style={{ backgroundColor: '#f9fafb' }}>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Game activity and guesses will appear here.</p>
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {guesses.map((guess, index) => (
            <li
              key={index}
              style={{
                padding: "8px 0",
                borderBottom: index < guesses.length - 1 ? "1px solid #e5e7eb" : "none",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <span>
                <strong>{guess.participantName}:</strong> {guess.text}
              </span>
              {guess.isCorrect && (
                <span style={{ color: "#16a34a", fontWeight: "bold", fontSize: "0.875rem" }}>
                  ✓ Correct!
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PageHeader } from "../components/PageHeader";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function LobbyPage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId, error, isLoading } = useRoomState();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    pollingRef.current = setInterval(async () => {
      try {
        await roomStore.fetchRoom();
      } catch {
        // Silently ignore poll errors — preserve last known state
      }
    }, 2000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [navigate, room, roomStore]);

  async function handleLeave() {
    try {
      await roomStore.leaveRoom();
      navigate("/");
    } catch {
      // Error already set in store state
    }
  }

  if (!room) {
    return null;
  }

  const isHostPlayer = participantId === room.hostId;

  return (
    <section className="panel placeholder-page">
      <div className="lobby-header">
        <PageHeader
          kicker="Waiting for players"
          title="Lobby"
          description="Share the room code with friends so they can join your game."
        />
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="summary-grid">
        <Card title="Participants">
          {room.participants.length === 0 ? (
            <p>No participants are connected to this room yet.</p>
          ) : (
            <ul className="player-list">
              {room.participants.map((participant) => (
                <li key={participant.id}>
                  <span>{participant.name}</span>
                  {participant.id === room.hostId && (
                    <span className="player-list__meta player-list__meta--host">Host</span>
                  )}
                  {participant.id !== room.hostId && (
                    <span className="player-list__meta">joined</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Status">
          <p className="status-line" style={{ backgroundColor: isLoading ? '#fef3c7' : '#e0e7ff', color: isLoading ? '#b45309' : '#3730a3' }}>
            {isLoading ? "Refreshing players..." : "Ready to play"}
          </p>
          <p style={{ marginTop: '8px' }}>{error ?? "Waiting for the host to start the game."}</p>
        </Card>
      </div>

      <div className="button-row button-row--spread">
        <button className="button button--secondary" onClick={handleLeave}>
          Leave Room
        </button>
        {isHostPlayer && (
          <button
            className="button button--primary"
            disabled={room.participants.length < 2}
            onClick={() => navigate("/game")}
          >
            {room.participants.length < 2 ? "Waiting for players..." : "Start Game"}
          </button>
        )}
      </div>
    </section>
  );
}

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { GuessForm } from "../components/GuessForm";
import { ResultPanel } from "../components/ResultPanel";
import { RoomCodeBadge } from "../components/RoomCodeBadge";
import { Scoreboard } from "../components/Scoreboard";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function GamePage() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!room) {
      navigate("/", { replace: true });
      return;
    }

    pollingRef.current = setInterval(async () => {
      try {
        const updatedRoom = await roomStore.fetchRoom();

        if (!updatedRoom) {
          navigate("/", { replace: true });
        }
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

  if (!room) {
    return null;
  }

  const viewer = room.participants.find((participant) => participant.id === participantId) ?? null;
  const drawer = room.participants.find((p) => p.role === "drawer") ?? null;

  return (
    <section className="panel game-page">
      <div className="game-page__header">
        <div className="game-page__header-left">
          <span className="section-kicker">Round 1</span>
          <h1 className="game-page__title">Guess the Word!</h1>
        </div>
        <RoomCodeBadge code={room.code} />
      </div>

      <div className="game-page__layout">
        <aside className="game-page__sidebar game-page__sidebar--left">
          <Scoreboard />
          <ResultPanel />
        </aside>

        <div className="game-page__main">
          <Card title="Canvas">
            <div className="canvas-placeholder" style={{ minHeight: '500px', backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
              {viewer?.role === "drawer" ? "Draw your word!" : "Waiting for the drawer to draw..."}
            </div>
          </Card>
        </div>

        <aside className="game-page__sidebar game-page__sidebar--right">
          <Card title="Player Info">
            <dl className="detail-list">
              <div>
                <dt>Name</dt>
                <dd>{viewer?.name ?? "Unknown player"}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{viewer?.role === "drawer" ? "Drawer" : "Guesser"}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>Playing</dd>
              </div>
            </dl>
          </Card>

          {viewer?.role === "drawer" && room.secretWord && (
            <Card title="Secret Word">
              <p style={{ fontSize: "1.5rem", fontWeight: "bold", textAlign: "center" }}>
                {room.secretWord}
              </p>
            </Card>
          )}

          {viewer?.role === "guesser" && drawer && (
            <Card title="Drawer">
              <p style={{ textAlign: "center" }}>
                <strong>{drawer.name}</strong> is drawing
              </p>
            </Card>
          )}

          <Card title="Your Guess">
            <GuessForm />
          </Card>
        </aside>
      </div>

      <div className="button-row">
        <button className="button button--secondary" onClick={async () => {
          try {
            await roomStore.leaveRoom();
          } catch {
            // Error already set in store state
          }
          navigate("/");
        }}>
          Exit Game
        </button>
      </div>
    </section>
  );
}

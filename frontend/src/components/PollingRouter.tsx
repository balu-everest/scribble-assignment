import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useRoomState, useRoomStore } from "../state/roomStore";

export function PollingRouter() {
  const navigate = useNavigate();
  const roomStore = useRoomStore();
  const { room, participantId } = useRoomState();
  const lastStatusRef = useRef<string | null>(null);
  const roomCodeRef = useRef<string | null>(null);
  const pidRef = useRef<string | null>(null);

  useEffect(() => {
    const code = room?.code ?? null;
    const pid = participantId ?? null;

    if (!code || !pid) return;

    roomCodeRef.current = code;
    pidRef.current = pid;

    const interval = setInterval(async () => {
      try {
        await roomStore.fetchRoom();
      } catch {
        // Silently ignore poll errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [room?.code, participantId, roomStore]);

  useEffect(() => {
    if (!room) return;

    const status = room.status;

    if (status === lastStatusRef.current) return;
    lastStatusRef.current = status;

    if (status === "result") {
      navigate("/result");
    } else if (status === "active") {
      navigate("/game");
    } else if (status === "lobby") {
      navigate("/lobby");
    }
  }, [room?.status, room, navigate]);

  return null;
}

import { useCallback, useEffect, useRef } from "react";
import { useRoomState } from "../state/roomStore";

export function DrawingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const { room } = useRoomState();

  function getCanvasPos(event: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    drawingRef.current = true;
    lastPosRef.current = getCanvasPos(event);
  }, []);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    const pos = getCanvasPos(event);
    if (!pos) return;

    ctx.beginPath();
    ctx.moveTo(lastPosRef.current?.x ?? pos.x, lastPosRef.current?.y ?? pos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    lastPosRef.current = pos;
  }, []);

  const handleMouseUp = useCallback(() => {
    drawingRef.current = false;
    lastPosRef.current = null;
  }, []);

  const handleMouseLeave = useCallback(() => {
    drawingRef.current = false;
    lastPosRef.current = null;
  }, []);

  function clearCanvas() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      canvas.height = Math.max(500, parent.clientHeight);
    }
  }, []);

  useEffect(() => {
    if (!room || room.status !== "active") {
      clearCanvas();
    }
  }, [room?.status]);

  return (
    <div className="drawing-canvas-wrapper">
      <canvas
        ref={canvasRef}
        className="drawing-canvas"
        style={{
          display: "block",
          width: "100%",
          minHeight: "500px",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          cursor: "crosshair",
          backgroundColor: "#fff"
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
      <div className="button-row" style={{ marginTop: "8px" }}>
        <button className="button button--secondary" type="button" onClick={clearCanvas}>
          Clear
        </button>
      </div>
    </div>
  );
}

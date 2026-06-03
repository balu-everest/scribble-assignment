import { describe, expect, it } from "vitest";
import { createRoom, joinRoom, leaveRoom } from "./roomStore.js";

describe("roomStore", () => {
  it("createRoom returns a room with a 6-character uppercase code", () => {
    const result = createRoom("Alice");

    expect(result.room.code).toMatch(/^[A-Z0-9]{6}$/);
    expect(result.room.participants).toHaveLength(1);
    expect(result.room.participants[0].name).toBe("Alice");
    expect(result.participantId).toBeDefined();
  });

  it("createRoom sets hostId to the creator's participant ID", () => {
    const result = createRoom("Alice");

    expect(result.room.hostId).toBe(result.participantId);
  });

  it("createRoom includes hostId in snapshot", () => {
    const result = createRoom("Alice");

    expect(result.room.hostId).toBeDefined();
  });

  it("joinRoom returns error for an unknown room code", () => {
    const result = joinRoom("ZZZZZZ", "Bob");

    expect("error" in result).toBe(true);
    expect(result).toEqual({ error: "Room not found" });
  });

  it("joinRoom rejects duplicate name (case-insensitive)", () => {
    const { room } = createRoom("Alice");
    const result = joinRoom(room.code, "alice");

    expect("error" in result).toBe(true);
    expect(result).toEqual({ error: "That name is already taken" });
  });

  it("joinRoom rejects duplicate name regardless of case", () => {
    const { room } = createRoom("Alice");
    const result = joinRoom(room.code, "ALICE");

    expect("error" in result).toBe(true);
    expect(result).toEqual({ error: "That name is already taken" });
  });

  it("joinRoom accepts a different name in the same room", () => {
    const { room } = createRoom("Alice");
    const result = joinRoom(room.code, "Bob");

    expect("error" in result).toBe(false);
    expect((result as { room: { participants: unknown[] } }).room.participants).toHaveLength(2);
  });

  it("leaveRoom removes a participant from the room", () => {
    const { room, participantId } = createRoom("Alice");
    const result = leaveRoom(room.code, participantId);

    expect("error" in result).toBe(false);
    const snap = result as { room: { participants: unknown[]; hostId: string | null } };
    expect(snap.room.participants).toHaveLength(0);
  });

  it("leaveRoom promotes the next participant when host leaves", () => {
    const { room: room1, participantId: hostId } = createRoom("Alice");
    const join2 = joinRoom(room1.code, "Bob");

    expect("error" in join2).toBe(false);
    const bobId = (join2 as { participantId: string }).participantId;

    const result = leaveRoom(room1.code, hostId);

    expect("error" in result).toBe(false);
    const snap = result as { room: { hostId: string } };
    expect(snap.room.hostId).toBe(bobId);
  });

  it("leaveRoom sets hostId to null when last participant leaves", () => {
    const { room, participantId } = createRoom("Alice");
    const result = leaveRoom(room.code, participantId);

    expect("error" in result).toBe(false);
    const snap = result as unknown as { room: { hostId: null } };
    expect(snap.room.hostId).toBeNull();
  });

  it("leaveRoom returns error for unknown room", () => {
    const result = leaveRoom("ZZZZZZ", "some-id");

    expect("error" in result).toBe(true);
    expect(result).toEqual({ error: "Room not found" });
  });

  it("leaveRoom returns error for unknown participant", () => {
    const { room } = createRoom("Alice");
    const result = leaveRoom(room.code, "unknown-id");

    expect("error" in result).toBe(true);
    expect(result).toEqual({ error: "Participant not found" });
  });
});

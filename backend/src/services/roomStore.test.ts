import { describe, expect, it } from "vitest";
import { createRoom, getRoom, joinRoom, leaveRoom, startGame, toRoomSnapshot } from "./roomStore.js";

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

  describe("startGame", () => {
    it("transitions room from lobby to active", () => {
      const { room, participantId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      const result = startGame(room.code, participantId);

      expect("error" in result).toBe(false);
      const snap = result as { room: ReturnType<typeof toRoomSnapshot> };
      expect(snap.room.status).toBe("active");
    });

    it("assigns host as drawer and others as guessers", () => {
      const { room, participantId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      const result = startGame(room.code, participantId);

      expect("error" in result).toBe(false);
      const snap = result as { room: ReturnType<typeof toRoomSnapshot> };
      const alice = snap.room.participants.find((p) => p.name === "Alice");
      const bob = snap.room.participants.find((p) => p.name === "Bob");
      expect(alice?.role).toBe("drawer");
      expect(bob?.role).toBe("guesser");
      expect(snap.room.drawerId).toBe(alice?.id);
    });

    it("rejects non-host participant (403)", () => {
      const { room } = createRoom("Alice");
      const join = joinRoom(room.code, "Bob");
      expect("error" in join).toBe(false);
      const bobId = (join as { participantId: string }).participantId;
      const result = startGame(room.code, bobId);

      expect("error" in result).toBe(true);
      expect((result as { error: string }).error).toBe("Only the host can start the game");
    });

    it("rejects already-active room (409)", () => {
      const { room, participantId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      startGame(room.code, participantId);
      const result = startGame(room.code, participantId);

      expect("error" in result).toBe(true);
      expect((result as { error: string }).error).toBe("Game has already started");
    });

    it("rejects unknown participantId (400)", () => {
      const { room } = createRoom("Alice");
      const result = startGame(room.code, "unknown-id");

      expect("error" in result).toBe(true);
      expect((result as { error: string }).error).toBe("Participant not found in room");
    });

    it("selects a secret word from the starter list", () => {
      const { room, participantId } = createRoom("Alice");
      const result = startGame(room.code, participantId);

      expect("error" in result).toBe(false);
      const snap = result as { room: ReturnType<typeof toRoomSnapshot> };
      expect(["rocket", "pizza", "castle", "guitar", "sunflower"]).toContain(snap.room.secretWord);
    });

    it("returns snapshot with secretWord for the drawer", () => {
      const { room, participantId } = createRoom("Alice");
      const result = startGame(room.code, participantId);

      expect("error" in result).toBe(false);
      const snap = result as { room: ReturnType<typeof toRoomSnapshot> };
      expect(snap.room.secretWord).toBeTruthy();
    });

    it("toRoomSnapshot filters secretWord for guessers", () => {
      const { room, participantId } = createRoom("Alice");
      const join = joinRoom(room.code, "Bob");
      expect("error" in join).toBe(false);
      const bobId = (join as { participantId: string }).participantId;
      startGame(room.code, participantId);

      const activeRoom = getRoom(room.code) as NonNullable<ReturnType<typeof getRoom>>;
      const drawerSnap = toRoomSnapshot(activeRoom, participantId);
      const guesserSnap = toRoomSnapshot(activeRoom, bobId);
      const noViewerSnap = toRoomSnapshot(activeRoom);

      expect(drawerSnap.secretWord).toBeTruthy();
      expect(guesserSnap.secretWord).toBeNull();
      expect(noViewerSnap.secretWord).toBeNull();
    });

    it("toRoomSnapshot without viewer returns secretWord null (when not active)", () => {
      const { room, participantId } = createRoom("Alice");
      const snap = toRoomSnapshot(room, participantId);

      expect(snap.secretWord).toBeNull();
    });
  });
});

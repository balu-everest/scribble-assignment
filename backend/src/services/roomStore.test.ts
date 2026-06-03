import { describe, expect, it } from "vitest";
import { createRoom, getRoom, joinRoom, leaveRoom, restartRoom, startGame, submitGuess, toRoomSnapshot } from "./roomStore.js";

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

  describe("submitGuess", () => {
    function startActiveRoom() {
      const { room, participantId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      startGame(room.code, participantId);
      const activeRoom = getRoom(room.code)!;
      return { room: activeRoom, hostId: participantId, guesserId: activeRoom.participants.find((p) => p.role === "guesser")!.id };
    }

    it("rejects empty/whitespace guesses", () => {
      const { room, guesserId } = startActiveRoom();
      expect(submitGuess(room.code, guesserId, "")).toEqual({ error: "Guess cannot be empty" });
      expect(submitGuess(room.code, guesserId, "   ")).toEqual({ error: "Guess cannot be empty" });
      expect(submitGuess(room.code, guesserId, " \t ")).toEqual({ error: "Guess cannot be empty" });
    });

    it("rejects non-guesser participant", () => {
      const { room, hostId } = startActiveRoom();
      const result = submitGuess(room.code, hostId, "hello");
      expect("error" in result).toBe(true);
      expect((result as { error: string }).error).toBe("Only guessers can submit guesses");
    });

    it("rejects inactive room", () => {
      const { room } = createRoom("Alice");
      const join = joinRoom(room.code, "Bob");
      const bobId = (join as { participantId: string }).participantId;
      const result = submitGuess(room.code, bobId, "hello");
      expect("error" in result).toBe(true);
      expect((result as { error: string }).error).toBe("Game is not in progress");
    });

    it("rejects unknown room", () => {
      const result = submitGuess("ZZZZZZ", "some-id", "hello");
      expect("error" in result).toBe(true);
      expect((result as { error: string }).error).toBe("Room not found");
    });

    it("rejects unknown participant", () => {
      const { room } = startActiveRoom();
      const result = submitGuess(room.code, "unknown-id", "hello");
      expect("error" in result).toBe(true);
      expect((result as { error: string }).error).toBe("Participant not found in room");
    });

    it("accepts incorrect guess: 0 points, isCorrect false", () => {
      const { room, guesserId } = startActiveRoom();
      const result = submitGuess(room.code, guesserId, "wrong");
      expect("error" in result).toBe(false);
      const snap = result as { room: ReturnType<typeof toRoomSnapshot> };
      expect(snap.room.guesses).toHaveLength(1);
      expect(snap.room.guesses[0].isCorrect).toBe(false);
      expect(snap.room.guesses[0].text).toBe("wrong");
      const guesser = snap.room.participants.find((p) => p.id === guesserId);
      expect(guesser?.score).toBe(0);
    });

    it("awards +100 points for exact match correct guess", () => {
      const { room, guesserId } = startActiveRoom();
      const secretWord = room.secretWord;
      const result = submitGuess(room.code, guesserId, secretWord);
      expect("error" in result).toBe(false);
      const snap = result as { room: ReturnType<typeof toRoomSnapshot> };
      expect(snap.room.guesses).toHaveLength(1);
      expect(snap.room.guesses[0].isCorrect).toBe(true);
      expect(snap.room.guesses[0].text).toBe(secretWord);
      const guesser = snap.room.participants.find((p) => p.id === guesserId);
      expect(guesser?.score).toBe(100);
    });

    it("awards +100 points for case-insensitive match (UPPERCASE)", () => {
      const { room, guesserId } = startActiveRoom();
      const result = submitGuess(room.code, guesserId, room.secretWord.toUpperCase());
      expect("error" in result).toBe(false);
      const snap = result as { room: ReturnType<typeof toRoomSnapshot> };
      const guess = snap.room.guesses[0];
      expect(guess.isCorrect).toBe(true);
      expect(guess.text).toBe(room.secretWord.toUpperCase());
    });

    it("awards +100 points for case-insensitive match (mixed case)", () => {
      const { room, guesserId } = startActiveRoom();
      const mixed = room.secretWord.split("").map((c, i) => i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()).join("");
      const result = submitGuess(room.code, guesserId, mixed);
      expect("error" in result).toBe(false);
      const snap = result as { room: ReturnType<typeof toRoomSnapshot> };
      expect(snap.room.guesses[0].isCorrect).toBe(true);
    });

    it("rejects second guess after correct guess ends the game", () => {
      const { room, guesserId } = startActiveRoom();
      const correct = submitGuess(room.code, guesserId, room.secretWord);
      expect("error" in correct).toBe(false);

      const duplicate = submitGuess(room.code, guesserId, room.secretWord);
      expect("error" in duplicate).toBe(true);
      expect((duplicate as { error: string }).error).toBe("Game has ended — no more guesses accepted");
    });

    it("first correct guess ends game, rejecting subsequent guesses from other players", () => {
      const { room, participantId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      joinRoom(room.code, "Charlie");
      startGame(room.code, participantId);
      const activeRoom = getRoom(room.code)!;
      const bobId = activeRoom.participants.find((p) => p.name === "Bob")!.id;
      const charlieId = activeRoom.participants.find((p) => p.name === "Charlie")!.id;

      const r1 = submitGuess(room.code, bobId, activeRoom.secretWord);
      expect("error" in r1).toBe(false);

      const r2 = submitGuess(room.code, charlieId, activeRoom.secretWord);
      expect("error" in r2).toBe(true);
      expect((r2 as { error: string }).error).toBe("Game has ended — no more guesses accepted");

      const snap1 = r1 as { room: ReturnType<typeof toRoomSnapshot> };
      const g1 = snap1.room.participants.find((p) => p.id === bobId);
      expect(g1?.score).toBe(100);
    });

    it("correct guess transitions room to result state", () => {
      const { room, guesserId } = startActiveRoom();
      const result = submitGuess(room.code, guesserId, room.secretWord);
      expect("error" in result).toBe(false);

      const updated = getRoom(room.code)!;
      expect(updated.status).toBe("result");
    });

    it("rejects guesses after room is in result state", () => {
      const { room, guesserId, hostId } = startActiveRoom();
      joinRoom(room.code, "Charlie");
      const activeRoom = getRoom(room.code)!;
      const charlieId = activeRoom.participants.find((p) => p.name === "Charlie")!.id;

      const correct = submitGuess(room.code, guesserId, room.secretWord);
      expect("error" in correct).toBe(false);

      const after = submitGuess(room.code, charlieId, "wrong");
      expect("error" in after).toBe(true);
      expect((after as { error: string }).error).toBe("Game has ended — no more guesses accepted");
    });



    it("appends guesses chronologically and maintains order", () => {
      const { room, guesserId } = startActiveRoom();
      const activeRoom = getRoom(room.code)!;
      const guessErr = submitGuess(activeRoom.code, guesserId, "first");
      expect("error" in guessErr).toBe(false);

      const guessOk = submitGuess(activeRoom.code, guesserId, "second");
      expect("error" in guessOk).toBe(false);

      const updated = getRoom(activeRoom.code)!;
      expect(updated.guesses).toHaveLength(2);
      expect(updated.guesses[0].text).toBe("first");
      expect(updated.guesses[1].text).toBe("second");
    });

    it("returns snapshot with guesses array", () => {
      const { room, guesserId } = startActiveRoom();
      const result = submitGuess(room.code, guesserId, "guess");
      expect("error" in result).toBe(false);
      const snap = result as { room: ReturnType<typeof toRoomSnapshot> };
      expect(Array.isArray(snap.room.guesses)).toBe(true);
    });

    it("includes score in participant snapshot", () => {
      const { room, guesserId } = startActiveRoom();
      const result = submitGuess(room.code, guesserId, room.secretWord);
      expect("error" in result).toBe(false);
      const snap = result as { room: ReturnType<typeof toRoomSnapshot> };
      const guesser = snap.room.participants.find((p) => p.id === guesserId);
      expect(guesser).toHaveProperty("score");
      expect(typeof guesser?.score).toBe("number");
    });
  });

  describe("restartRoom", () => {
    function createResultRoom() {
      const { room, participantId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      startGame(room.code, participantId);
      const activeRoom = getRoom(room.code)!;
      const guesserId = activeRoom.participants.find((p) => p.role === "guesser")!.id;
      submitGuess(room.code, guesserId, activeRoom.secretWord);
      return { room: getRoom(room.code)!, hostId: participantId, guesserId };
    }

    it("successful restart resets status to lobby", () => {
      const { room, hostId } = createResultRoom();
      const result = restartRoom(room.code, hostId);
      expect("error" in result).toBe(false);
      const snap = result as { room: ReturnType<typeof toRoomSnapshot> };
      expect(snap.room.status).toBe("lobby");
    });

    it("successful restart clears guesses and resets scores", () => {
      const { room, hostId } = createResultRoom();
      const result = restartRoom(room.code, hostId);
      expect("error" in result).toBe(false);
      const snap = result as { room: ReturnType<typeof toRoomSnapshot> };
      expect(snap.room.guesses).toHaveLength(0);
      for (const p of snap.room.participants) {
        expect(p.score).toBe(0);
      }
    });

    it("successful restart preserves participant list", () => {
      const { room, hostId } = createResultRoom();
      const countBefore = room.participants.length;
      const result = restartRoom(room.code, hostId);
      expect("error" in result).toBe(false);
      const snap = result as { room: ReturnType<typeof toRoomSnapshot> };
      expect(snap.room.participants).toHaveLength(countBefore);
    });

    it("successful restart resets roles to null", () => {
      const { room, hostId } = createResultRoom();
      const result = restartRoom(room.code, hostId);
      expect("error" in result).toBe(false);
      const snap = result as { room: ReturnType<typeof toRoomSnapshot> };
      for (const p of snap.room.participants) {
        expect(p.role).toBeNull();
      }
    });

    it("rejects non-host participant (403)", () => {
      const { room, guesserId } = createResultRoom();
      const result = restartRoom(room.code, guesserId);
      expect("error" in result).toBe(true);
      expect((result as { error: string }).error).toBe("Only the host can restart the game");
    });

    it("rejects restart on lobby room (409)", () => {
      const { room, participantId } = createRoom("Alice");
      const result = restartRoom(room.code, participantId);
      expect("error" in result).toBe(true);
      expect((result as { error: string }).error).toBe("Game can only be restarted from the result screen");
    });

    it("rejects restart on active room (409)", () => {
      const { room, participantId } = createRoom("Alice");
      joinRoom(room.code, "Bob");
      startGame(room.code, participantId);
      const result = restartRoom(room.code, participantId);
      expect("error" in result).toBe(true);
      expect((result as { error: string }).error).toBe("Game can only be restarted from the result screen");
    });

    it("rejects restart on non-existent room (404)", () => {
      const result = restartRoom("ZZZZZZ", "some-id");
      expect("error" in result).toBe(true);
      expect((result as { error: string }).error).toBe("Room not found");
    });

    it("rejects restart with unknown participantId (400)", () => {
      const { room, hostId } = createResultRoom();
      const result = restartRoom(room.code, "unknown-uuid");
      expect("error" in result).toBe(true);
      expect((result as { error: string }).error).toBe("Participant not found in room");
    });
  });
});

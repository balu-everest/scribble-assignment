import { randomUUID } from "node:crypto";
import type { Participant, Room, RoomSnapshot } from "../models/game.js";
import { STARTER_ROLES, STARTER_WORDS } from "../seed/starterData.js";

const rooms = new Map<string, Room>();

function now() {
  return new Date().toISOString();
}

function generateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let index = 0; index < 6; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return code;
}

function generateUniqueCode() {
  let code = generateCode();

  while (rooms.has(code)) {
    code = generateCode();
  }

  return code;
}

function displayName(name?: string) {
  return name || "Player";
}

function createParticipant(name?: string): Participant {
  return {
    id: randomUUID(),
    name: displayName(name),
    joinedAt: now(),
    role: null
  };
}

function cloneRoom(room: Room) {
  return structuredClone(room);
}

export function listWords() {
  return [...STARTER_WORDS];
}

export function createRoom(playerName?: string) {
  const participant = createParticipant(playerName);
  const room: Room = {
    code: generateUniqueCode(),
    status: "lobby",
    hostId: participant.id,
    participants: [participant],
    secretWord: "",
    createdAt: now(),
    updatedAt: now()
  };

  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function joinRoom(code: string, playerName?: string) {
  const room = rooms.get(code);

  if (!room) {
    return { error: "Room not found" as const };
  }

  const display = displayName(playerName);
  const duplicate = room.participants.some(
    (p) => p.name.toLowerCase() === display.toLowerCase()
  );

  if (duplicate) {
    return { error: "That name is already taken" as const };
  }

  const participant = createParticipant(playerName);
  room.participants.push(participant);
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room),
    participantId: participant.id
  };
}

export function leaveRoom(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return { error: "Room not found" as const };
  }

  const index = room.participants.findIndex((p) => p.id === participantId);

  if (index === -1) {
    return { error: "Participant not found" as const };
  }

  const wasHost = room.hostId === participantId;
  room.participants.splice(index, 1);

  if (room.participants.length === 0) {
    room.hostId = null as unknown as string;
  } else if (wasHost) {
    const sorted = [...room.participants].sort(
      (a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime()
    );

    room.hostId = sorted[0].id;
  }

  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: cloneRoom(room)
  };
}

export function getRoom(code: string) {
  const room = rooms.get(code);
  return room ? cloneRoom(room) : null;
}

export function saveRoom(room: Room) {
  room.updatedAt = now();
  rooms.set(room.code, cloneRoom(room));
  return getRoom(room.code);
}

function charCodeSum(code: string): number {
  return code.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export function startGame(code: string, participantId: string) {
  const room = rooms.get(code);

  if (!room) {
    return { error: "Room not found" as const };
  }

  const participant = room.participants.find((p) => p.id === participantId);

  if (!participant) {
    return { error: "Participant not found in room" as const };
  }

  if (participantId !== room.hostId) {
    return { error: "Only the host can start the game" as const };
  }

  if (room.status !== "lobby") {
    return { error: "Game has already started" as const };
  }

  for (const p of room.participants) {
    p.role = p.id === room.hostId ? "drawer" : "guesser";
  }

  const wordIndex = charCodeSum(room.code) % STARTER_WORDS.length;
  room.secretWord = STARTER_WORDS[wordIndex];
  room.status = "active";
  room.updatedAt = now();
  rooms.set(room.code, room);

  return {
    room: toRoomSnapshot(room, participantId)
  };
}

export function toRoomSnapshot(room: Room, viewerParticipantId?: string): RoomSnapshot {
  const drawer = room.participants.find((p) => p.role === "drawer");
  const viewer = viewerParticipantId
    ? room.participants.find((p) => p.id === viewerParticipantId)
    : null;
  const isViewerDrawer = viewer?.role === "drawer";

  return {
    code: room.code,
    status: room.status,
    participants: room.participants.map((participant) => ({ ...participant })),
    hostId: room.hostId,
    drawerId: drawer?.id ?? null,
    secretWord: isViewerDrawer ? room.secretWord : null,
    availableWords: listWords(),
    roles: [...STARTER_ROLES]
  };
}

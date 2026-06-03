export type ParticipantRole = "drawer" | "guesser";
export type RoomStatus = "lobby" | "active";

export interface Guess {
  participantId: string;
  participantName: string;
  text: string;
  timestamp: string;
  isCorrect: boolean;
}

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  role: ParticipantRole | null;
  score: number;
}

export interface Room {
  code: string;
  status: RoomStatus;
  hostId: string;
  participants: Participant[];
  secretWord: string;
  guesses: Guess[];
  createdAt: string;
  updatedAt: string;
}

export interface RoomSnapshot {
  code: string;
  status: RoomStatus;
  participants: Participant[];
  hostId: string;
  drawerId: string | null;
  secretWord: string | null;
  availableWords: string[];
  roles: ParticipantRole[];
  guesses: Guess[];
}

export interface RoomSessionResponse {
  participantId: string;
  room: RoomSnapshot;
}

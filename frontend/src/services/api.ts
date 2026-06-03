export type ParticipantRole = "drawer" | "guesser";

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
  role?: ParticipantRole | null;
  score: number;
}

export interface RoomSnapshot {
  code: string;
  status: "lobby" | "active" | "result";
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

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class NetworkError extends Error {
  constructor() {
    super("Network request failed");
    this.name = "NetworkError";
  }
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1000): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof TypeError) {
        lastError = new NetworkError();
        if (attempt < retries - 1) {
          await delay(delayMs);
        }
      } else {
        throw error;
      }
    }
  }

  throw lastError;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

async function request<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    ...init
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({ message: "Request failed" }))) as {
      message?: string;
    };

    throw new Error(errorBody.message ?? "Request failed");
  }

  return (await response.json()) as T;
}

export const api = {
  createRoom(playerName: string) {
    return request<RoomSessionResponse>("/rooms", {
      method: "POST",
      body: JSON.stringify({ playerName })
    });
  },
  joinRoom(code: string, playerName: string) {
    return request<RoomSessionResponse>(`/rooms/${encodeURIComponent(code)}/join`, {
      method: "POST",
      body: JSON.stringify({ playerName })
    });
  },
  fetchRoom(code: string, participantId?: string) {
    const query = participantId ? `?participantId=${encodeURIComponent(participantId)}` : "";
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}${query}`);
  },
  submitGuess(code: string, participantId: string, text: string) {
    return withRetry(() =>
      request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/guess`, {
        method: "POST",
        body: JSON.stringify({ participantId, text })
      })
    );
  },

  startGame(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/start`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  },
  leaveRoom(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/leave`, {
      method: "PATCH",
      body: JSON.stringify({ participantId })
    });
  },
  restartRoom(code: string, participantId: string) {
    return request<{ room: RoomSnapshot }>(`/rooms/${encodeURIComponent(code)}/restart`, {
      method: "POST",
      body: JSON.stringify({ participantId })
    });
  }
};

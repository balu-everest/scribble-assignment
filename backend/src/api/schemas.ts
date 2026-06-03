import { z } from "zod";

const nameValidation = z.string().trim().min(1, "Name cannot be empty").max(20, "Name must be 20 characters or less");

export const createRoomSchema = z.object({
  playerName: nameValidation.optional()
});

export const joinRoomSchema = z.object({
  playerName: nameValidation.optional()
});

export const roomCodeParamsSchema = z.object({
  code: z.string().trim().min(1, "Room code cannot be empty")
});

export const leaveRoomSchema = z.object({
  participantId: z.string().min(1, "Participant ID is required")
});

export const submitGuessSchema = z.object({
  participantId: z.string().uuid(),
  text: z.string().min(1, "Guess cannot be empty")
});

export const startGameSchema = z.object({
  participantId: z.string().uuid()
});

export const roomViewerQuerySchema = z.object({
  participantId: z.string().optional()
});

export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

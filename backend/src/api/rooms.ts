import { Router } from "express";
import {
  createRoomSchema,
  HttpError,
  joinRoomSchema,
  leaveRoomSchema,
  restartRoomSchema,
  roomCodeParamsSchema,
  roomViewerQuerySchema,
  startGameSchema,
  submitGuessSchema
} from "./schemas.js";
import type { RoomSnapshot } from "../models/game.js";
import { createRoom, getRoom, joinRoom, leaveRoom, restartRoom, startGame, submitGuess, toRoomSnapshot } from "../services/roomStore.js";

export function createRoomsRouter() {
  const router = Router();

  router.post("/", (request, response, next) => {
    try {
      const { playerName } = createRoomSchema.parse(request.body);
      const result = createRoom(playerName);

      response.status(201).json({
        participantId: result.participantId,
        room: toRoomSnapshot(result.room, result.participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/join", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { playerName } = joinRoomSchema.parse(request.body);
      const result = joinRoom(code.toUpperCase(), playerName);

      if ("error" in result) {
        const err = (result as { error: string }).error;
        const status = err === "Room not found" ? 404 : 400;
        throw new HttpError(status, err);
      }

      const success = result as { room: Parameters<typeof toRoomSnapshot>[0]; participantId: string };

      response.json({
        participantId: success.participantId,
        room: toRoomSnapshot(success.room, success.participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/start", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = startGameSchema.parse(request.body);
      const result = startGame(code.toUpperCase(), participantId);

      if ("error" in result) {
        const err = result as { error: string };
        const statusMap: Record<string, number> = {
          "Room not found": 404,
          "Participant not found in room": 400,
          "Only the host can start the game": 403,
          "Game has already started": 409
        };
        const status = statusMap[err.error] ?? 500;
        throw new HttpError(status, err.error);
      }

      const success = result as { room: RoomSnapshot };

      response.json(success);
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/guess", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId, text } = submitGuessSchema.parse(request.body);
      const result = submitGuess(code.toUpperCase(), participantId, text);

      if ("error" in result) {
        const err = result as { error: string };
        const statusMap: Record<string, number> = {
          "Room not found": 404,
          "Participant not found in room": 400,
          "Only guessers can submit guesses": 400,
          "You have already guessed the correct word": 400,
          "Game is not in progress": 409,
          "Guess cannot be empty": 400
        };
        const status = statusMap[err.error] ?? 500;
        throw new HttpError(status, err.error);
      }

      const success = result as { room: RoomSnapshot };

      response.json(success);
    } catch (error) {
      next(error);
    }
  });

  router.post("/:code/restart", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = restartRoomSchema.parse(request.body);
      const result = restartRoom(code.toUpperCase(), participantId);

      if ("error" in result) {
        const err = result as { error: string };
        const statusMap: Record<string, number> = {
          "Room not found": 404,
          "Participant not found in room": 400,
          "Only the host can restart the game": 403,
          "Game can only be restarted from the result screen": 409
        };
        const status = statusMap[err.error] ?? 500;
        throw new HttpError(status, err.error);
      }

      const success = result as { room: RoomSnapshot };

      response.json(success);
    } catch (error) {
      next(error);
    }
  });

  router.patch("/:code/leave", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = leaveRoomSchema.parse(request.body);
      const result = leaveRoom(code.toUpperCase(), participantId);

      if ("error" in result) {
        const err = result as { error: string };
        const status = err.error === "Room not found" ? 404 : 400;
        throw new HttpError(status, err.error);
      }

      const success = result as { room: Parameters<typeof toRoomSnapshot>[0] };

      response.json({
        room: toRoomSnapshot(success.room)
      });
    } catch (error) {
      next(error);
    }
  });

  router.get("/:code", (request, response, next) => {
    try {
      const { code } = roomCodeParamsSchema.parse(request.params);
      const { participantId } = roomViewerQuerySchema.parse(request.query);
      const room = getRoom(code.toUpperCase());

      if (!room) {
        throw new HttpError(404, "Unable to load room");
      }

      response.json({
        room: toRoomSnapshot(room, participantId)
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

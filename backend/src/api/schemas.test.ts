import { describe, expect, it } from "vitest";
import { createRoomSchema, joinRoomSchema, roomCodeParamsSchema } from "./schemas.js";

describe("schemas", () => {
  describe("createRoomSchema", () => {
    it("accepts a valid body with playerName", () => {
      const result = createRoomSchema.parse({ playerName: "Alice" });

      expect(result.playerName).toBe("Alice");
    });

    it("rejects empty string playerName", () => {
      expect(() => createRoomSchema.parse({ playerName: "" })).toThrow("Name cannot be empty");
    });

    it("rejects whitespace-only playerName", () => {
      expect(() => createRoomSchema.parse({ playerName: "   " })).toThrow("Name cannot be empty");
    });

    it("rejects playerName over 20 characters", () => {
      expect(() => createRoomSchema.parse({ playerName: "a".repeat(21) })).toThrow("Name must be 20 characters or less");
    });

    it("accepts playerName of exactly 20 characters", () => {
      const result = createRoomSchema.parse({ playerName: "a".repeat(20) });

      expect(result.playerName).toBe("a".repeat(20));
    });

    it("accepts omitted playerName", () => {
      const result = createRoomSchema.parse({});

      expect(result.playerName).toBeUndefined();
    });
  });

  describe("joinRoomSchema", () => {
    it("rejects empty string playerName", () => {
      expect(() => joinRoomSchema.parse({ playerName: "" })).toThrow("Name cannot be empty");
    });

    it("rejects whitespace-only playerName", () => {
      expect(() => joinRoomSchema.parse({ playerName: "   " })).toThrow("Name cannot be empty");
    });

    it("rejects playerName over 20 characters", () => {
      expect(() => joinRoomSchema.parse({ playerName: "a".repeat(21) })).toThrow("Name must be 20 characters or less");
    });

    it("accepts a valid playerName", () => {
      const result = joinRoomSchema.parse({ playerName: "Bob" });

      expect(result.playerName).toBe("Bob");
    });
  });

  describe("roomCodeParamsSchema", () => {
    it("rejects missing code", () => {
      expect(() => roomCodeParamsSchema.parse({})).toThrow();
    });

    it("rejects empty room code", () => {
      expect(() => roomCodeParamsSchema.parse({ code: "" })).toThrow("Room code cannot be empty");
    });

    it("rejects whitespace-only room code", () => {
      expect(() => roomCodeParamsSchema.parse({ code: "   " })).toThrow("Room code cannot be empty");
    });

    it("accepts a valid room code", () => {
      const result = roomCodeParamsSchema.parse({ code: "ABC123" });

      expect(result.code).toBe("ABC123");
    });
  });
});

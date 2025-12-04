/**
 * Unit tests for Database Migrations
 */

import {
  CURRENT_DB_VERSION,
  migrations,
  resetDatabase,
  runMigrations,
} from "../migrations";

// Mock schema constants
jest.mock("../schema", () => ({
  ALL_TABLES: ["CREATE TABLE t1 (id INT)"],
  ALL_INDEXES: ["CREATE INDEX i1 ON t1(id)"],
}));

describe("Database Migrations", () => {
  let mockDb: any;
  let execAsyncMock: jest.Mock;
  let getFirstAsyncMock: jest.Mock;

  beforeEach(() => {
    execAsyncMock = jest.fn().mockResolvedValue(undefined);
    getFirstAsyncMock = jest.fn();

    mockDb = {
      execAsync: execAsyncMock,
      getFirstAsync: getFirstAsyncMock,
    };

    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("runMigrations", () => {
    it("should run ALL migrations if database is fresh (version 0)", async () => {
      getFirstAsyncMock.mockResolvedValue({ user_version: 0 });

      await runMigrations(mockDb);

      // Verify basic flow
      expect(getFirstAsyncMock).toHaveBeenCalledWith("PRAGMA user_version;");
      // Verify migrations ran
      expect(execAsyncMock).toHaveBeenCalledWith("CREATE TABLE t1 (id INT)");
      expect(execAsyncMock).toHaveBeenCalledWith(
        expect.stringContaining("CREATE TABLE IF NOT EXISTS programs")
      );

      // Verify version updates
      expect(execAsyncMock).toHaveBeenCalledWith("PRAGMA user_version = 1;");
      expect(execAsyncMock).toHaveBeenCalledWith("PRAGMA user_version = 4;");
    });

    it("should skip already applied migrations", async () => {
      getFirstAsyncMock.mockResolvedValue({ user_version: 2 });

      await runMigrations(mockDb);

      // Should NOT run migration 1 or 2
      expect(execAsyncMock).not.toHaveBeenCalledWith(
        "CREATE TABLE t1 (id INT)"
      );

      // Should run migration 3 and 4
      expect(execAsyncMock).toHaveBeenCalledWith(
        expect.stringContaining(
          "CREATE TABLE IF NOT EXISTS program_day_exercise_sets"
        )
      );
      expect(execAsyncMock).toHaveBeenCalledWith("PRAGMA user_version = 3;");
    });

    it("should do nothing if database is up to date", async () => {
      getFirstAsyncMock.mockResolvedValue({ user_version: CURRENT_DB_VERSION });
      await runMigrations(mockDb);
      expect(execAsyncMock).not.toHaveBeenCalled();
    });

    it("should throw error if a migration is missing", async () => {
      getFirstAsyncMock.mockResolvedValue({ user_version: 0 });

      // 1. Backup original migrations
      const originalMigrations = [...migrations];

      // 2. Empty the migrations array
      // This forces the loop (which goes 0..3) to fail immediately at index 0
      // because migrations[0] will be undefined.
      migrations.length = 0;

      try {
        // Pass the Regex directly to .toThrow()
        await expect(runMigrations(mockDb)).rejects.toThrow(
          /Migration 1 not found/
        );
      } finally {
        // 3. Restore migrations to ensure other tests aren't broken
        migrations.splice(0, migrations.length, ...originalMigrations);
      }
    });

    it("should handle getFirstAsync returning null", async () => {
      getFirstAsyncMock.mockResolvedValue(null);
      await runMigrations(mockDb);
      expect(execAsyncMock).toHaveBeenCalledWith("PRAGMA user_version = 1;");
    });

    it("should catch errors during version check", async () => {
      const error = new Error("DB Lock");
      getFirstAsyncMock.mockRejectedValue(error);
      await runMigrations(mockDb);
      expect(console.error).toHaveBeenCalledWith(
        "Error getting database version:",
        error
      );
    });

    it("should throw and stop if a migration execution fails", async () => {
      getFirstAsyncMock.mockResolvedValue({ user_version: 0 });
      // Make the first migration fail
      execAsyncMock.mockRejectedValueOnce(new Error("Syntax Error"));

      await expect(runMigrations(mockDb)).rejects.toThrow();

      // Should not verify version update if it crashed
      expect(execAsyncMock).not.toHaveBeenCalledWith(
        "PRAGMA user_version = 1;"
      );
    });
  });

  describe("resetDatabase", () => {
    it("should drop all tables in correct reverse order", async () => {
      await resetDatabase(mockDb);

      // Check drop commands
      expect(execAsyncMock).toHaveBeenCalledWith(
        "DROP TABLE IF EXISTS sync_queue;"
      );
      expect(execAsyncMock).toHaveBeenCalledWith(
        "DROP TABLE IF EXISTS programs;"
      );

      // Check version reset
      expect(execAsyncMock).toHaveBeenCalledWith("PRAGMA user_version = 0;");
    });
  });
});

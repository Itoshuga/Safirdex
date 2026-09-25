import type { ZodError } from "zod";

export class EntityNotFoundError extends Error {
  constructor(entityName: string, id: string) {
    super(`${entityName} with ID "${id}" was not found.`);
    this.name = "EntityNotFoundError";
  }
}

export class RepositoryValidationError extends Error {
  readonly issues: ZodError["issues"];

  constructor(entityName: string, error: ZodError) {
    super(`Invalid ${entityName} data: ${error.issues[0]?.message ?? "unknown error"}`);
    this.name = "RepositoryValidationError";
    this.issues = error.issues;
  }
}

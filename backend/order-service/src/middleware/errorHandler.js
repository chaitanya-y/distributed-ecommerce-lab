import { ZodError } from "zod";

export function errorHandler(error, req, res, next) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "Validation failed",
      errors: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  if (error.status) {
    return res.status(error.status).json({ message: error.message });
  }

  console.error(error);

  return res.status(500).json({
    message: "Internal server error",
  });
}

import { NextFunction, Request, Response } from "express";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log(`Error in server: ${err}`);
  res.status(500).json({ message: err.message });
};

import { Request, Response, NextFunction } from "express";
const crypto = require("crypto");

export const tokenAuth = (req: Request, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  if (auth != undefined) {
    const check = checkToken(auth);
    if (check === "Token not found") {
      res.status(401).json({ message: "Internal Authorization Error" });
    } else if (check === "Unauthorized") {
      res.status(401).json({ message: "Unauthorized" });
    } else if (check === "Authorized") {
      next();
    }
  } else {
    res.status(401).json({ message: "Missing Authorization header" });
  }
};

type Check = "Authorized" | "Unauthorized" | "Token not found";

function checkToken(header: string): Check {
  if (header.startsWith("Bearer ")) {
    const token = header.substring(7, header.length);
    const tokenBufferLen = Buffer.byteLength(token);
    if (process.env.CRONJOB_API_KEY != undefined) {
      const checkBufferLen = Buffer.byteLength(process.env.CRONJOB_API_KEY);
      const checkBuffer = Buffer.alloc(checkBufferLen, 0, "utf8");
      checkBuffer.write(process.env.CRONJOB_API_KEY);

      const tokenBuffer = Buffer.alloc(tokenBufferLen, 0, "utf8");
      tokenBuffer.write(token);

      if (
        crypto.timingSafeEqual(tokenBuffer, checkBuffer) &&
        checkBufferLen === tokenBufferLen
      ) {
        return "Authorized";
      } else {
        return "Unauthorized";
      }
    } else {
      return "Token not found";
    }
  } else {
    return "Unauthorized";
  }
}

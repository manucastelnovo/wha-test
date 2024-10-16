import { Request, Response, NextFunction } from "express";
import { metaConfig } from "../config";
const crypto = require("crypto");

export const metaAuth = (req: Request, res: Response, next: NextFunction) => {
  const sign = req.headers["x-hub-signature-256"];
  const rawBody = req.rawBody;
  if (req.method === "GET") {
    next();
  }
  if (rawBody) {
    const match = checkSignature(sign as string, rawBody);
    if (match === "Signature match") {
      next();
    } else if (match === "No match") {
      next(new Error("No signature match"));
    }
    next();
  } else {
    next(new Error("No raw body"));
  }
};

type Match = "Signature match" | "No match";

const { webhookVerifyToken } = metaConfig;
export const checkSignature = (signature: string, body: string): Match => {
  const sig = Buffer.from(signature.replace("sha256=", ""), "utf-8");
  const hmac = crypto.createHmac("sha256", webhookVerifyToken);
  const check = hmac.update(body).digest("hex");
  const digest = Buffer.from(check, "utf-8");

  if (!crypto.timingSafeEqual(digest, sig)) {
    return "No match";
  } else {
    return "Signature match";
  }
};

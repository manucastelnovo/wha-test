import express, { NextFunction, Request, Response } from "express";
import { SellerRepository } from "../domain/repositories/seller_repository";

export default function sellersRouter(sellersRepository: SellerRepository) {
  const router = express.Router();
  router.get("/", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sellers = sellersRepository.extractFromExcel();
      res.status(200).json({ message: "success" });
    } catch (e: any) {
      next(new Error(`Error in getting sellers: ${e}`));
    }
  });
  router.get(
    "/update",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        sellersRepository.updateDatabase();
        res.status(200).json({ message: "success" });
      } catch (e: any) {
        next(new Error(`Error updating sellers: ${e}`));
      }
    }
  );
  return router;
}

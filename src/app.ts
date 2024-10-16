import { expressConfig as config } from "./core/config";
const express = require("express");
import sellersRouter from "./feature/sellers/presentation/sellers_router";
import { SellerRepositoryImplementation } from "./feature/sellers/domain/repositories/seller_repository_implementation";
import { SellersPostgresDatasource } from "./feature/sellers/data/psql_data_source";
import eventsRouter from "./feature/events/presentation/events_router";
import { errorHandler } from "./core/middlewares/errors_middlware";
import { NextFunction, Request, Response } from "express";
import { metaAuth } from "./core/middlewares/meta_auth";
import { tokenAuth } from "./core/middlewares/token_auth";
// dependency injection
const sellersRepositoryImplementationSingleton =
  SellerRepositoryImplementation.create(new SellersPostgresDatasource());

//main router
const app = express();
app.use(
  express.json({
    verify: (
      req: Request,
      res: Response,
      buf: Buffer,
      encoding: BufferEncoding
    ) => {
      if (req.method === "POST") {
        req.rawBody = buf?.toString(encoding || "utf8");
      }
    },
  })
);

const router = express.Router();

//base route
app.use("/api", router);

//sellers route
router.use(
  "/sellers",
  tokenAuth,
  sellersRouter(sellersRepositoryImplementationSingleton)
);

//meta events route
router.use(
  "/whatsapp",
  metaAuth,
  eventsRouter(sellersRepositoryImplementationSingleton)
);

//error handler
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`App is running on port: ${config.port}`);
});

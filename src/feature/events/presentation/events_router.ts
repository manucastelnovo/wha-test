import { Router, Request, Response, NextFunction } from "express";
import {
  decryptBody,
  encryptResponse,
  FlowResponse,
  HealthCheckResponse,
} from "./use_cases/encryption";
import { metaConfig } from "../../../core/config";
import { categories } from "../../sellers/domain/models/categories";
import axios from "axios";
import { sendSellersMessages } from "./use_cases/contact_sellers";
import { SellerRepository } from "../../sellers/domain/repositories/seller_repository";

const {
  passphrase,
  privateKey,
  webhookVerifyToken,
  metaGraphAPIToken,
  metaBusinessPhoneNumberId,
} = metaConfig;

export default function eventsRouter(sellersRepository: SellerRepository) {
  const router = Router();

  // flows endpoint
  router.post(
    "/flow",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { aesKeyBuffer, decryptedBody, initialVectorBuffer } =
          await decryptBody(req.body, privateKey!, passphrase!);
        let response: FlowResponse | HealthCheckResponse;
        if (decryptedBody.action === "INIT") {
          response = {
            data: {},
            screen: "contact_info",
            version: "3.0",
          };
          const encryptedResponse = await encryptResponse(
            response,
            aesKeyBuffer,
            initialVectorBuffer
          );
          res.status(200).send(encryptedResponse);
        } else if (decryptedBody.data?.contact_data) {
          const categoriesData: object[] = [];
          categories.forEach((value, index) => {
            categoriesData.push({ id: `${index}`, title: value });
          });
          response = {
            data: {
              categories: categoriesData,
              form_data: {
                name: decryptedBody.data?.contact_data.name,
                last_name: decryptedBody.data?.contact_data.last_name,
                phone: decryptedBody.data?.contact_data.phone,
              },
            },
            screen: "preferences",
            version: "3.0",
          };
          const encryptedResponse = await encryptResponse(
            response,
            aesKeyBuffer,
            initialVectorBuffer
          );

          res.status(200).send(encryptedResponse);
        } else if (decryptedBody.data?.final_data) {
          /*
          do something with the data
          */
          const buyerCategories = decryptedBody.data.final_data.category.map(
            (index: number) => categories[index]
          );
          response = {
            version: "3",
            screen: "SUCCESS",
            data: {
              flow_token: decryptedBody.flow_token,
            },
          };
          const encryptedResponse = await encryptResponse(
            response,
            aesKeyBuffer,
            initialVectorBuffer
          );
          res.status(200).send(encryptedResponse);
          const responseData = {
            messaging_product: "whatsapp",
            to: `595${decryptedBody.data?.final_data.phone}`,
            type: "text",
            text: {
              body: `Gracias ${decryptedBody.data?.final_data.name}! Los vendedores fueron notificados y aquellos interesados se pondran en contacto contigo!`,
            },
          };
          await axios({
            method: "POST",
            url: `https://graph.facebook.com/v19.0/${metaBusinessPhoneNumberId}/messages`,
            headers: {
              Authorization: `Bearer ${metaGraphAPIToken}`,
              "Content-Type": "application/json",
            },
            data: responseData,
          });

          sendSellersMessages(
            sellersRepository,
            buyerCategories,
            metaBusinessPhoneNumberId!,
            metaGraphAPIToken!,
            `${decryptedBody.data?.final_data.name} ${decryptedBody.data?.final_data.last_name}`,
            decryptedBody.data?.final_data.phone
          );
        } else if (decryptedBody.action === "ping") {
          response = {
            version: "3",
            data: {
              status: "active",
            },
          };
          const encryptedResponse = await encryptResponse(
            response,
            aesKeyBuffer,
            initialVectorBuffer
          );
          res.status(200).send(encryptedResponse);
        }
      } catch (e) {
        next(new Error(`Could not process event: ${e}`));
      }
    }
  );

  //whatsapp hook
  router.get("/hook", (req: Request, res: Response, next: NextFunction) => {
    try {
      const mode = req.query["hub.mode"];
      const token = req.query["hub.verify_token"];
      const challenge = req.query["hub.challenge"];
      console.log({ mode, token, challenge });
      if (mode === "subscribe" && token === webhookVerifyToken) {
        res.status(200).send(challenge);
      } else {
        res.sendStatus(403);
      }
    } catch (err: any) {
      next(new Error(`Error handling webhook event; ${err}`));
    }
  });
  router.post(
    "/hook",
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const body = req.body;
        const message = req.body.entry?.[0].changes?.[0].value?.messages?.[0];
        res.sendStatus(200);
        console.log(JSON.stringify(body));
        if (message?.type === "text") {
          const business_phone_number_id =
            req.body.entry?.[0].changes?.[0].value?.metadata?.phone_number_id;
          const responseData = {
            messaging_product: "whatsapp",
            to: message.from,
            type: "text",
            text: {
              body: "Bienvenido/a a Tobiano, donde compras y vendes sin costo.\nPara vender contactar al +595985567006",
            },
            context: {
              message_id: message.id, // shows the message as a reply to the original user message
            },
          };
          await axios({
            method: "POST",
            url: `https://graph.facebook.com/v19.0/${business_phone_number_id}/messages`,
            headers: {
              Authorization: `Bearer ${metaGraphAPIToken}`,
              "Content-Type": "application/json",
            },
            data: responseData,
          });
          await axios({
            method: "POST",
            url: `https://graph.facebook.com/v19.0/${business_phone_number_id}/messages`,
            headers: {
              Authorization: `Bearer ${metaGraphAPIToken}`,
              "Content-Type": "application/json",
            },
            data: {
              messaging_product: "whatsapp",
              status: "read",
              message_id: message.id,
            },
          });
          const flowBody = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: message.from,
            type: "interactive",
            interactive: {
              type: "flow",
              body: {
                text: "Para comprar, completa el formulario",
              },
              action: {
                name: "flow",
                parameters: {
                  flow_message_version: "3",
                  flow_token: message.id,
                  flow_id: "3118209388309102",
                  flow_cta: "Comenzar!",
                  flow_action: "data_exchange",
                },
              },
            },
          };
          await axios({
            method: "POST",
            url: `https://graph.facebook.com/v20.0/${business_phone_number_id}/messages`,
            headers: {
              Authorization: `Bearer ${metaGraphAPIToken}`,
              "Content-Type": "application/json",
            },
            data: flowBody,
          });
        }
      } catch (e: any) {
        next(new Error(`Error processing webhook request: ${e}`));
      }
    }
  );
  return router;
}

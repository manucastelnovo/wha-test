import { Category } from "../../../sellers/domain/models/seller_model";
import axios from "axios";
import { SellerRepository } from "../../../sellers/domain/repositories/seller_repository";
export async function sendSellersMessages(
  sellerRepository: SellerRepository,
  categories: Category[],
  businessPhoneId: string,
  metaAPITOken: string,
  buyerName: string,
  buyerNumber: string
) {
  const data: {
    category: Category;
    numbers: { name: string; phone: string; contacted: string }[];
  }[] = await sellerRepository.getSellersByCategory(categories);
  try {
    for (const category of data) {
      for (const contact of category.numbers) {
        console.log(`---- sending message to ${contact.name} ----`);
        const nowDate = new Date();
        const initiationExpired = new Date(contact.contacted);
        let format;
        if (
          nowDate.getTime() >
          initiationExpired.getTime() + 24 * 60 * 60 * 1000
        ) {
          console.log("---- Marketing message ----");
          format = {
            type: "template",
            template: {
              name: "seller_message",
              language: {
                policy: "deterministic",
                code: "es_ES",
              },
              components: [
                {
                  type: "body",
                  parameters: [
                    {
                      type: "text",
                      text: contact.name,
                    },
                    {
                      type: "text",
                      text: category.category,
                    },
                    {
                      type: "text",
                      text: buyerName,
                    },
                    {
                      type: "text",
                      text: buyerNumber,
                    },
                  ],
                },
              ],
            },
          };
          await sellerRepository.updateSellerContacted(
            nowDate.toISOString(),
            `${contact.name.split(" ").join("")}${contact.phone}`
          );
        } else {
          console.log("---- Normal Message ----");
          format = {
            type: "text",
            text: {
              body: `Buenas ${contact.name}! Tobiano se comunica contigo para informarte que hay compradores interesados en tus productos de ${category.category}! Puedes ponerte en contacto con ${buyerName} al numero +595${buyerNumber}`,
            },
          };
        }
        const response = await axios({
          method: "POST",
          url: `https://graph.facebook.com/v19.0/${businessPhoneId}/messages`,
          headers: {
            Authorization: `Bearer ${metaAPITOken}`,
            "Content-Type": "application/json",
          },
          data: {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: `595${contact.phone}`,
            // to: `595${buyerNumber}`,
            ...format,
          },
        }).catch(async (err: any) => {
          console.log(err.response.data);
          if (err.response.data) {
            try {
              console.log("---- GOT TO RESET CONTACTED ----");
              await sellerRepository.resetSellerContacted(
                initiationExpired.toISOString(),
                contact.phone
              );
            } catch (e: any) {
              console.log(e);
            }
          }
          console.log(err.response.status);
          console.log(err.response.headers);
        });
      }
    }
  } catch (e: any) {
    throw new Error(`Error sending messages to clients: ${e.message}`);
  }
}

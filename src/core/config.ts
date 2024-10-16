export const dbConfig = {
  user: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT ? +process.env.POSTGRES_PORT : 5432,
  database: process.env.POSTGRES_DATABASE,
};
export const expressConfig = {
  port: process.env.PORT,
};
export const metaConfig = {
  passphrase: process.env.META_PASSPHRASE,
  privateKey: process.env.META_PRIVATE_KEY
    ? process.env.META_PRIVATE_KEY.split(String.raw`\n`).join("\n")
    : "",
  webhookVerifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN,
  metaGraphAPIToken: process.env.META_GRAPH_API_TOKEN,
  metaBusinessPhoneNumberId: process.env.META_BUSINESS_PHONE_NUMBER_ID,
};

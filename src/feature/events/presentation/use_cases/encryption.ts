import crypto from "crypto";

export type FlowEncryptedBody = {
  encrypted_aes_key: string;
  initial_vector: string;
  encrypted_flow_data: string;
};
export type FlowResponse = {
  version: string;
  screen: string;
  data: object;
  error_message?: string;
};
export type HealthCheckResponse = {
  version: string;
  data: object;
};

export async function decryptBody(
  body: FlowEncryptedBody,
  privatePem: string,
  passphrase: string
) {
  const { encrypted_aes_key, initial_vector, encrypted_flow_data } = body;
  const privateKey = crypto.createPrivateKey({ key: privatePem, passphrase });
  let decryptedAesKey = undefined;
  try {
    //decrypt aes key
    decryptedAesKey = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      Buffer.from(encrypted_aes_key, "base64")
    );
  } catch (err: any) {
    throw new Error(`Error decrypting body: ${err}`);
  }

  //decrypt payload data
  const flowDataBuffer = Buffer.from(encrypted_flow_data, "base64");
  const initialVectorBuffer = Buffer.from(initial_vector, "base64");

  const TAG_LENGTH = 16;
  const encrypted_flow_data_body = flowDataBuffer.subarray(0, -TAG_LENGTH);
  const encrypted_flow_data_tag = flowDataBuffer.subarray(-TAG_LENGTH);

  const decipher = crypto.createDecipheriv(
    "aes-128-gcm",
    decryptedAesKey,
    initialVectorBuffer
  );
  decipher.setAuthTag(encrypted_flow_data_tag);

  const decryptedJSONString = Buffer.concat([
    decipher.update(encrypted_flow_data_body),
    decipher.final(),
  ]).toString("utf8");

  return {
    decryptedBody: JSON.parse(decryptedJSONString),
    aesKeyBuffer: decryptedAesKey,
    initialVectorBuffer,
  };
}

export async function encryptResponse(
  payload: FlowResponse | HealthCheckResponse,
  aeskeyBuffer: Buffer,
  initialVectorBuffer: Buffer
) {
  //flip initial vector
  const flipped_iv = [];
  for (const pair of initialVectorBuffer.entries()) {
    flipped_iv.push(~pair[1]);
  }

  //encrypt endpoint data
  const cipher = crypto.createCipheriv(
    "aes-128-gcm",
    aeskeyBuffer,
    Buffer.from(flipped_iv)
  );
  return Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf-8"),
    cipher.final(),
    cipher.getAuthTag(),
  ]).toString("base64");
}

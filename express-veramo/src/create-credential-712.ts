import { agent } from "./veramo/setup.js";

export async function createCredential(id: string) {
  const identifier = await agent.didManagerGetByAlias({ alias: "default" });
  const verifiableCredential = await agent.createVerifiableCredential({
    proofFormat: "EthereumEip712Signature2021",
    credential: {
      issuer: identifier.did,
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://beta.api.schemas.serto.id/v1/public/trusted-reviewer/1.0/ld-context.json",
      ],
      type: ["VerifiableCredential", "TrustedReviewer"],
      credentialSchema: {
        id: "https://beta.api.schemas.serto.id/v1/public/trusted-reviewer/1.0/json-schema.json",
        type: "JsonSchemaValidator2018",
      },
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        isTrusted: true,
        id,
      },
    },
  });
  return verifiableCredential;
}

import { VerifiableCredential } from "@veramo/core";
import { agent } from "./veramo/setup.js";

export async function verifyJWT(cred: any) {
  // @ts-ignore
  const result = await agent.verifyCredential({
    credential: {
      credentialSubject: {
        isTrusted: cred.credentialSubject.isTrusted,
        id: cred.credentialSubject.id.id,
      },
      issuer: {id: cred.issuer},
      type: cred.type,
      "@context": cred["@context"],
      credentialSchema: cred.credentialSchema,
      issuanceDate: cred.issuanceDate,
      proof: cred.proof,
    },
  });
  console.log(`Credential verified`, result.error?.message || result.verified);
  return result;
}

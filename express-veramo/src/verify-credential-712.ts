import { VerifiableCredential } from '@veramo/core'
import { agent } from './veramo/setup.js'

export async function verify(cred: any) {
  // @ts-ignore
  const result = await agent.verifyCredential({
    credential: {
      credentialSubject: {
        isTrusted: true,
        id: cred.credentialSubject.id.id,
      },
      issuer: cred.issuer.id,
      type: ["VerifiableCredential", "TrustedReviewer"],
      "@context": [
        "https://www.w3.org/2018/credentials/v1",
        "https://beta.api.schemas.serto.id/v1/public/trusted-reviewer/1.0/ld-context.json",
      ],
      credentialSchema: {
        id: "https://beta.api.schemas.serto.id/v1/public/trusted-reviewer/1.0/json-schema.json",
        type: "JsonSchemaValidator2018",
      },
      issuanceDate: cred.issuanceDate,
      proof: cred.proof,
    },
  })
  console.log(result.error || result.verified)
  return result;
}

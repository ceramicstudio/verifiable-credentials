import { VerifiableCredential } from '@veramo/core'
import { agent } from './veramo/setup.js'

export async function verify(cred: any) {
  // @ts-ignore
  const result = await agent.verifyCredential({
    credential: {
      credentialSubject: {
        isTrusted: cred.credentialSubject.isTrusted,
        id: cred.credentialSubject.id.id,
      },
      issuer: cred.issuer.id,
      type: cred.type,
      "@context": cred["@context"],
      credentialSchema: cred.credentialSchema,
      issuanceDate: cred.issuanceDate,
      proof: cred.proof,
    },
  })
  console.log(result.error || result.verified)
  return result;
}

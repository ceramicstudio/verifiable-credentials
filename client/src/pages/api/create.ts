import { CeramicClient } from "@ceramicnetwork/http-client";
import { ComposeClient } from "@composedb/client";
import { RuntimeCompositeDefinition } from "@composedb/types";
import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import KeyResolver from "key-did-resolver";
import { NextApiRequest, NextApiResponse } from "next";
import { fromString } from "uint8arrays/from-string";
import { definition } from "../../__generated__/definition.js";

const uniqueKey = process.env.SECRET_KEY;

export default async function createCredential(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  const { toJson } = req.body;
  //instantiate a ceramic client instance
  const ceramic = new CeramicClient("http://localhost:7007");

  //instantiate a composeDB client instance
  const composeClient = new ComposeClient({
    ceramic: "http://localhost:7007",
    definition: definition as RuntimeCompositeDefinition,
  });

  //authenticate developer DID in order to create a write transaction
  const authenticateDID = async (seed: string) => {
    const key = fromString(seed, "base16");
    const provider = new Ed25519Provider(key);
    const staticDid = new DID({
      // @ts-expect-error: Ignore type error
      resolver: KeyResolver.getResolver(),
      provider,
    });
    await staticDid.authenticate();
    ceramic.did = staticDid;
    composeClient.setDID(staticDid);
    return staticDid;
  };

  try {
    if (uniqueKey) {
      await authenticateDID(uniqueKey);
      const data: any = await composeClient.executeQuery(`
      mutation {
        createVerifiableCredential(input: {
          content: {
              context: ${JSON.stringify(toJson["@context"]).replace(/"([^"]+)":/g, "$1:")}
              issuer: "${toJson.issuer}"
              type: ${JSON.stringify(toJson.type).replace(/"([^"]+)":/g, "$1:")}
              credentialSchema: ${JSON.stringify(
                toJson.credentialSchema
              ).replace(/"([^"]+)":/g, "$1:")}
              issuanceDate: "${toJson.issuanceDate}"
              credentialSubject: ${JSON.stringify(
                toJson.credentialSubject
              ).replace(/"([^"]+)":/g, "$1:")}
                proof: {
                  proofPurpose: "${toJson.proof.proofPurpose}"
                  type: "${toJson.proof.type}"
                  created: "${toJson.proof.created}"
                  verificationMethod: "${toJson.proof.verificationMethod}"
                  proofValue: "${toJson.proof.proofValue}"
                  eip712: {
                    domain: ${JSON.stringify(
                      toJson.proof.eip712.domain
                    ).replace(/"([^"]+)":/g, "$1:")}
                    types: ${JSON.stringify(toJson.proof.eip712.types).replace(
                      /"([^"]+)":/g,
                      "$1:"
                    )}
                    primaryType: "${toJson.proof.eip712.primaryType}"
                  }
                }
            }
          
        }) 
        {
          document {
            id
            issuer {
              id
            }
            issuanceDate
            type
            context
            credentialSubject{
              id {
                id
              }
              isTrusted
            }
            proof{
              type
              proofPurpose
              verificationMethod
              proofValue
              created
              eip712{
                domain{
                  name
                  version
                  chainId
                }
                types {
                  EIP712Domain {
                    name
                    type
                  }
                  CredentialSchema {
                    name
                    type
                  }
                  CredentialSubject {
                    name
                    type
                  }
                  Proof {
                    name
                    type
                  }
                  VerifiableCredential {
                    name
                    type
                  }
                }
                primaryType
              }
            }
          }
        }
      }
    `);
      return res.json(data);
    }
  } catch (err) {
    res.json({
      err,
    });
  }
}

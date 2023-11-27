import React, { useState } from "react";
import { CopyBlock, dracula } from "react-code-blocks";
import { useComposeDB } from "../fragments";
import * as u8a from "uint8arrays";
import { hash } from "@stablelib/sha256";
import { Ed25519Provider } from "key-did-provider-ed25519";
import KeyResolver from "key-did-resolver";
import { EthereumWebAuth, getAccountId } from "@didtools/pkh-ethereum";
import { DIDSession } from "did-session";
import { ethers } from "ethers";
import { DID } from "dids";
import { Web3KeyManagementSystem } from '@veramo/kms-web3'
import {
  DisclosureFrame,
  Hasher,
  SDJWTPayload,
  Signer,
  base64encode,
} from "../../@meeco/sd-jwt";
import {
  CreateSDJWTPayload,
  HasherConfig,
  Issuer,
  SignerConfig,
  VCClaims,
  defaultHashAlgorithm,
  supportedAlgorithm,
} from "../../@meeco/sd-jwt-vc"
import { createHash } from "crypto";
import {
  JWTHeaderParameters,
  JWTPayload,
  KeyLike,
  SignJWT,
  exportJWK,
  generateKeyPair,
} from "jose";

const Credential = () => {
  const [cred, setCred] = useState<string>(
    JSON.stringify({ "Generate Credentials Below": "👇" }, null, 2)
  );
  const { compose } = useComposeDB();

  const createCredential = async () => {
    // const response = await fetch("http://localhost:8080/create-jws", {
    //   method: "POST",
    //   mode: "cors",
    //   cache: "no-cache",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   redirect: "follow",
    //   referrerPolicy: "no-referrer",
    //   body: JSON.stringify({
    //     id: localStorage.getItem("did"),
    //   }),
    // });
    // const toJson = await response.json();
    // console.log(toJson);
    const id = await window.localStorage.getItem("did")
    const provider = new ethers.providers.Web3Provider(
      window.ethereum as unknown as ethers.providers.ExternalProvider
    );
    const signer = provider.getSigner();

    const payload = {
      proofFormat: "jwt",
      credential: {
        issuer: id,
        "@context": [
          "https://www.w3.org/2018/credentials/v1",
          "https://beta.api.schemas.serto.id/v1/public/vetted-reviewer/1.0/ld-context.json",
        ],
        type: ["VerifiableCredential", "VettedReviewer"],
        credentialSchema: {
          id: "https://beta.api.schemas.serto.id/v1/public/vetted-reviewer/1.0/json-schema.json",
          type: "JsonSchemaValidator2018",
        },
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          isTrusted: true,
          id: id,
        },
      },
    };
    const sesh = new Web3KeyManagementSystem({
      web3: provider
    });
    const keys = await sesh.listKeys();
    console.log(keys);
    //@ts-ignore
    const keyRef = { kid: keys[0].kid }; // Replace "your_key_id" with the actual key ID
    const encoder = new TextEncoder();
    const data = u8a.fromString(JSON.stringify(payload))
    
    console.log(data)
    //@ts-ignore
    const item = await sesh.sign({ keyRef, algorithm: 'eth_signMessage', data });
    console.log(item)
    
    //       .getSigner()
    //       .signMessage(u8a.fromString(JSON.stringify(data)));
    //     return base64encode(signature);
    //   },
    // };
    // const issuer = new Issuer(signer, hasher);

   
    // const jws = await session.did.createJWS(payLoad);
    // console.log(jws);

    // const data = await compose.executeQuery<{
    //   createVerifiableCredentialJWS: {
    //     document: {
    //       id: string;
    //       issuer: string
    //       issuanceDate: string;
    //       type: string[];
    //       context: string[];
    //       credentialSubject: {
    //         id: {
    //           id: string;
    //         };
    //         isTrusted: boolean;
    //       };
    //       proof: {
    //         type: string;
    //         jwt: string;
    //       };
    //     };
    //   };
    // }>(`
    //   mutation {
    //     createVerifiableCredentialJWT(input: {
    //       content: {
    //           context: ${JSON.stringify(toJson["@context"]).replace(
    //             /"([^"]+)":/g,
    //             "$1:"
    //           )}
    //           issuer: {
    //               id: "${toJson.issuer.id}"
    //             }
    //           type: ${JSON.stringify(toJson.type).replace(/"([^"]+)":/g, "$1:")}
    //           credentialSchema: ${JSON.stringify(
    //             toJson.credentialSchema
    //           ).replace(/"([^"]+)":/g, "$1:")}
    //           issuanceDate: "${toJson.issuanceDate}"
    //           credentialSubject: ${JSON.stringify(
    //             toJson.credentialSubject
    //           ).replace(/"([^"]+)":/g, "$1:")}
    //             proof: {
    //               type: "${toJson.proof.type}"
    //               jwt: "${toJson.proof.jwt}"
    //             }
    //         }
    //     })
    //     {
    //       document {
    //         id
    //         issuer {
    //           id
    //         }
    //         issuanceDate
    //         type
    //         context
    //         credentialSchema{
    //           id
    //           type
    //         }
    //         credentialSubject{
    //           id {
    //             id
    //           }
    //           isTrusted
    //         }
    //         proof{
    //           type
    //           jwt
    //         }
    //       }
    //     }
    //   }
    // `);
    // console.log(data);
    // setCred(JSON.stringify(data, null, 2));
  };

  const verifyCredential = async () => {
    const credential = await fetch("/api/query-jws");
    const toJsonCredential = await credential.json();
    const bodyToSend =
      toJsonCredential.data.verifiableCredentialJWTIndex.edges[0].node;
    const final = { ...bodyToSend, "@context": bodyToSend.context };
    delete final.context;
    console.log(final);
    setCred(JSON.stringify(final));
    const response = await fetch("http://localhost:8080/verify-jws", {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
      },
      redirect: "follow",
      referrerPolicy: "no-referrer",
      body: JSON.stringify({
        final,
      }),
    });
    const toJson = await response.json();
    setCred(JSON.stringify(toJson, null, 2));
  };

  return (
    <div className="max-w-xxl mx-auto mt-32 mb-10 w-5/6 min-h-500">
      <CopyBlock
        style={{ width: "100%", height: "100%" }}
        text={cred ?? ""}
        language={"json"}
        showLineNumbers={false}
        theme={dracula}
        wrapLines={true}
        codeBlock
      />
      <div className="flex flex-row items-center justify-center w-full">
        <button
          onClick={createCredential}
          className="h-12 bg-blue-700 hover:bg-blue-800 rounded-md font-bold text-white w-1/3 mr-4"
        >
          Generate JWT Credential
        </button>
        <button
          onClick={verifyCredential}
          className="h-12 bg-blue-700 hover:bg-blue-800 rounded-md font-bold text-white w-1/3 ml-4"
        >
          Verify JWT Credential
        </button>
      </div>
    </div>
  );
};

export default Credential;

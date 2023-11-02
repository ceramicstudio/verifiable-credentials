import React, { useState } from "react";
import { CopyBlock, dracula } from "react-code-blocks";
import { useComposeDB } from "../fragments";

const Credential = () => {
  const [cred, setCred] = useState<string>(
    JSON.stringify({ "Generate Credentials Below": "👇" }, null, 2)
  );
  const { compose } = useComposeDB();

  const createCredential = async () => {
    const response = await fetch("http://localhost:8080/create-jws", {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
      },
      redirect: "follow",
      referrerPolicy: "no-referrer",
      body: JSON.stringify({
        id: localStorage.getItem("did"),
      }),
    });
    const toJson = await response.json();
    console.log(toJson);

    const subjectData = await compose.executeQuery<{
        createCredentialSubject: {
            document: {
            id: string;
            subjectId: {
                id: string;
            };
            isTrusted: boolean;
            };
        };
    }>(`
    mutation {
        createCredentialSubject(input: {
          content: {
              subjectId: "${toJson.credentialSubject.id}"
              isTrusted: ${toJson.credentialSubject.isTrusted}
            }
        }) 
        {
          document {
            id
            subjectId {
              id
            }
            isTrusted
          }
        }
      }
    `);

    if(!subjectData.data) {
        return;
    }

    const data = await compose.executeQuery<{
      createJWSGeneric: {
        document: {
          id: string;
          issuer: {
            id: string;
          };
          issuanceDate: string;
          type: string[];
          context: string[];
          credentialSubject: {
            id: {
              id: string;
            };
            isTrusted: boolean;
          };
          proof: {
            type: string;
            jwt: string;
          };
        };
      };
    }>(`
      mutation {
        createJWSGeneric(input: {
          content: {
              context: ${JSON.stringify(toJson["@context"]).replace(
                /"([^"]+)":/g,
                "$1:"
              )}
              issuer: "${toJson.issuer.id}"
              type: ${JSON.stringify(toJson.type).replace(/"([^"]+)":/g, "$1:")}
              credentialSchema: ${JSON.stringify(
                toJson.credentialSchema
              ).replace(/"([^"]+)":/g, "$1:")}
              issuanceDate: "${toJson.issuanceDate}"
              credentialSubjectID: "${subjectData.data.createCredentialSubject.document.id}"
                proof: {
                  type: "${toJson.proof.type}"
                  jwt: "${toJson.proof.jwt}"
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
              subjectId {
                id
              }
              isTrusted
            }
            proof{
              type
              jwt
            }
          }
        }
      }
    `);
    console.log(data);
    setCred(JSON.stringify(data, null, 2));
  };

  const verifyCredential = async () => {
    const credential = await fetch("/api/query-jws-generic");
    const toJsonCredential = await credential.json();
    const bodyToSend =
      toJsonCredential.data.jWSGenericIndex.edges[0].node;
    const final = { ...bodyToSend, "@context": bodyToSend.context };
    delete final.context;
    console.log(final);
    // setCred(JSON.stringify(final));
    const response = await fetch("http://localhost:8080/verify-jws-generic", {
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

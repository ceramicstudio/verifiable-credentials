import React, { useState } from "react";
import { CopyBlock, dracula } from "react-code-blocks";


const Credential = () => {
  const [cred, setCred] = useState<string>(JSON.stringify({"Generate Credentials Below": "👇"}, null, 2));

  const createCredential = async () => {
    const response = await fetch("http://localhost:8080/create", {
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
    const credential = await fetch("/api/create", {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
      },
      redirect: "follow",
      referrerPolicy: "no-referrer",
      body: JSON.stringify({
        toJson,
      }),
    });

    const toJsonCredential = await credential.json();

    console.log(toJsonCredential);
    setCred(JSON.stringify(toJsonCredential, null, 2));
  };

  const verifyCredential = async () => {
    const credential = await fetch("/api/query");
    const toJsonCredential = await credential.json();
    const bodyToSend =
      toJsonCredential.data.verifiableCredentialEIP712Index.edges[0].node;
    const final = { ...bodyToSend, "@context": bodyToSend.context };
    delete final.context;
    console.log(final);
    setCred(JSON.stringify(final));
    const response = await fetch("http://localhost:8080/verify", {
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
    console.log(toJson);
    setCred(JSON.stringify(toJson, null, 2));
  };

  return (
    <div className="max-w-xxl mx-auto mt-32 mb-10 w-5/6 min-h-500">
      <CopyBlock
        style={{ width: "100%", minHeight: "100" }}
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
          Generate Verifiable Credential
        </button>
        <button
          onClick={verifyCredential}
          className="h-12 bg-blue-700 hover:bg-blue-800 rounded-md font-bold text-white w-1/3 ml-4"
        >
          Verify Credential
        </button>
      </div>
    </div>
  );
};

export default Credential;

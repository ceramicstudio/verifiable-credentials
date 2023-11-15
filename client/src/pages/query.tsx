"use client";
import Head from "next/head";
import Nav from "../components/Navbar";
import styles from "./index.module.css";
import type { NextPage } from "next";
import { useEffect, useState } from "react";
import * as LitJsSdk from "@lit-protocol/lit-node-client";
import { ILitNodeClient } from "@lit-protocol/types";
import { WagmiConfig, useAccount } from "wagmi";
import { GraphiQL } from "graphiql";
import { definition } from "../__generated__/definition.js";
import { ComposeClient } from "@composedb/client";
import "graphiql/graphiql.min.css";

const Home: NextPage = () => {
  const [lit, setLit] = useState<ILitNodeClient>();
  const { isDisconnected } = useAccount();

  const handleLogin = async () => {
    const thisLit = startLitClient(window);
    setLit(thisLit);
  };

  const verifiableCredentialQuery = 
`
query VerifiableCredentialsAll {
    verifiableCredentialIndex(first: 10){
        edges{
          node{
            controller{
              id
            }
            issuer{
              id
            }
            context
            type
            credentialSchema{
              id
              type
            }
            issuanceDate
            ...on VCEIP712Proof{
              proof{
                verificationMethod
                created
                proofPurpose
                type
                proofValue
                eip712{
                  domain{
                    chainId
                    name
                    version
                  }
                  types{
                    EIP712Domain{
                      name
                      type
                    }
                    CredentialSchema{
                      name
                      type
                    }
                    CredentialSubject{
                      name
                      type
                    }
                    Proof{
                      name
                      type
                    }
                    VerifiableCredential{
                      name
                      type
                    }
                  }
                  primaryType
                }
              }
            }
            ...on VCJWTProof{
              proof{
                type
                jwt
              }
            }
          }
        }
      }
  }`

  const Queries = {
    values: [
      {title: `First 10 Verifiable Credentials`, query: verifiableCredentialQuery},
    ]
  }

  const fetcher = async (graphQLParams: Record<string, any>) => {
    const composeClient = new ComposeClient({
      ceramic: "http://localhost:7007",
      definition: definition as any,
    });

    const data = await composeClient.executeQuery(`${graphQLParams.query}`);
    console.log(data);

    if (data && data.data && !data.data.__schema) {
      return data.data;
    }
  };

  const startLitClient = (window: Window): ILitNodeClient => {
    // connect to lit
    console.log("Starting Lit Client...");
    const client = new LitJsSdk.LitNodeClient({
      url: window.location.origin,
    });
    client.connect();
    return client as ILitNodeClient;
  };

  useEffect(() => {
    handleLogin();
  }, []);

  return (
    <>
      <Nav />
      <Head>
        <title>Save Verifiable Credentials to Ceramic</title>
        <meta name="description" content="" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {!isDisconnected ? (
        <main className={styles.main}>
          {lit && (
            <div style={{ height: "60rem", width: "100%", margin: "auto" }}>
                {/* @ts-ignore */}
              <GraphiQL fetcher={fetcher} storage={null} defaultTabs={Queries.values}/>
            </div>
          )}
        </main>
      ) : (
        <main className={styles.main}></main>
      )}
    </>
  );
};

export default Home;

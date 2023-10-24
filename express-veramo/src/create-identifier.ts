import { agent } from "./veramo/setup.js";

async function main() {
  const identifier = await agent.didManagerCreate({
    provider: "did:key",
    alias: "default",
    kms: "local",
    options: {
      keyType: "Secp256k1",
      algorithm: "ES256K",
    },
  });
  const jwsIdentifier = await agent.didManagerCreate({alias: "jws"});
  console.log(`New identifier created`);
  console.log(JSON.stringify(identifier, null, 2));
}

main().catch(console.log);

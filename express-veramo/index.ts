import express from "express";
import cors from "cors";
import { verify } from "./src/verify-credential-712.js";
import { verifyJWT } from "./src/verify-credential-jws.js";
import { verifyJWTGeneric } from "./src/verify-credential-jws-generic.js";
import { createCredential } from "./src/create-credential-712.js";
import { createjwt } from "./src/create-credential-jws.js";
import { listIdentifiers } from "./src/list-identifiers.js";
import bodyParser from "body-parser";

const app = express();
const port = 8080; // default port to listen

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

const allowCrossDomain = (
  req: any,
  res: { header: (arg0: string, arg1: string) => void },
  next: () => void
) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
};

app.use(allowCrossDomain);

app.get("/identifiers", async (req, res) => {
  const identifiers = await listIdentifiers();
  res.json(identifiers);
});

app.post("/verify", async (req, res) => {
  const { final } = req.body;
  const verifiable = await verify(final);
  res.json(verifiable);
});

app.post("/create", async (req, res) => {
  const { id } = req.body;
  const vc = await createCredential(id);
  console.log(vc);
  res.json(vc);
});

app.post("/create-jws", async (req, res) => {
  const { id } = req.body;
  const vc = await createjwt(id);
  console.log(vc);
  res.json(vc);
});

app.post("/verify-jws", async (req, res) => {
  const { final } = req.body;
  const verifiable = await verifyJWT(final);
  res.json(verifiable);
});

app.post("/verify-jws-generic", async (req, res) => {
  const { final } = req.body;
  const verifiable = await verifyJWTGeneric(final);
  res.json(verifiable);
});

app.listen(port, () => {
  // tslint:disable-next-line:no-console
  console.log(`server started at http://localhost:${port}`);
});

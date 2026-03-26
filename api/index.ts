import serverless from "serverless-http";
import { createApp } from "../src/app";

const app = createApp();

const handler = serverless(app);

export default handler;

import serverless from "serverless-http";
import { expressApp } from "../server";

export const expressHandler = serverless(expressApp);
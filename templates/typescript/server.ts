import { alexa } from "./src/app";
import * as config from "./src/config";

alexa.startServer(config.server.port);

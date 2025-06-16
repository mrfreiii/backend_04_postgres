import cookieParser from "cookie-parser";

import { pipesSetup } from "./pipes.setup";
import { swaggerSetup } from "./swagger.setup";
import { globalPrefixSetup } from "./global-prefix.setup";
import { NestExpressApplication } from "@nestjs/platform-express";

export function appSetup({
  app,
  env = "common",
}: {
  app: NestExpressApplication;
  env?: "e2e_tests" | "common";
}) {
  pipesSetup(app);

  app.enableCors();
  app.use(cookieParser());

  app.set("trust proxy", true);

  switch (env) {
    case "common":
      globalPrefixSetup(app);
      swaggerSetup(app);
      break;
    case "e2e_tests":
      break;
  }
}

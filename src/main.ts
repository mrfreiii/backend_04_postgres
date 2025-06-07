import { CoreConfig } from "./core/config/core.config";

import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";

import { appSetup } from "./setup/app.setup";
import { initAppModule } from "./init-app-module";

async function bootstrap() {
  const DynamicAppModule = await initAppModule();
  // создаём на основе донастроенного модуля наше приложение
  const app =
    await NestFactory.create<NestExpressApplication>(DynamicAppModule);

  appSetup({ app });

  const coreConfig = app.get<CoreConfig>(CoreConfig);
  const port = coreConfig.port;

  await app.listen(port, () => {
    console.log("Server is running on port " + port);
  });
}
bootstrap();

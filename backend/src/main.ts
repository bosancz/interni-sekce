import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import * as cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { Config } from "./config";
import { registerOpenApi } from "./openapi";

async function bootstrap() {
  const logger = new Logger("MAIN");

  logger.log("Bošán - Interní sekce");
  logger.log(`Verze: ${Config.app.version}`);

  const app = await NestFactory.create(AppModule, {
    logger: Config.logging.level,
    rawBody: true,
  });

  app.setGlobalPrefix(Config.server.baseDir + "/api");

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, transformOptions: { enableImplicitConversion: true } }),
  );

  if (!Config.production) {
    // make JSONs nice for debugging
    app.getHttpAdapter().getInstance().set("json spaces", 2);
  }

  if (Config.cors.enable) {
    // enable local app access
    app.enableCors(Config.cors.options);
  }

  app.use(cookieParser());

  registerOpenApi(app);

  const port = Config.server.port;
  const host = Config.server.host;

  await app.listen(port, host);
  logger.log(`Server started at http://${host}:${port}`);
}
bootstrap();

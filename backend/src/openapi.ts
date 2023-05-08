import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Config } from "./config";

export type ResponseData<T> = Omit<T, "_links">;

export function registerOpenApi(app: INestApplication) {
  // OpenAPI
  const config = new DocumentBuilder()
    .setTitle(Config.app.name)
    .setVersion(`v${Config.app.version}`)
    // .addSecurity("AuthToken", { type: "apiKey", name: "token", in: "query" })

    .build();
  const document = SwaggerModule.createDocument(app, config, {
    // ignoreGlobalPrefix: true,
    operationIdFactory: (controllerKey, methodKey) => methodKey,
  });
  SwaggerModule.setup("/api", app, document, { customSiteTitle: `${Config.app.name} API` });
}

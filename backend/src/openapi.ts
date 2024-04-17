import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from "@nestjs/swagger";
import { Config } from "./config";

const config = new DocumentBuilder()
  .setTitle(Config.app.name)
  .setVersion(`v${Config.app.version}`)
  .addServer(Config.app.baseUrl + "/api")
  .build();

export const OpenApiDocument: OpenAPIObject = {
  ...config,
  paths: {},
};

export function registerOpenApi(app: INestApplication) {
  // OpenAPI
  const document = SwaggerModule.createDocument(app, config, {
    ignoreGlobalPrefix: true,
    operationIdFactory: (controllerKey, methodKey) => methodKey,
  });

  Object.assign(OpenApiDocument, document);

  SwaggerModule.setup("/api", app, document, { customSiteTitle: `${Config.app.name} API` });
}

import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from "@nestjs/swagger";
import { COOKIE_AUTH_SCHEME } from "./auth/decorators/authenticated.decorator";
import { Config } from "./config";

const ROOT_TAG = "Root" as const;
const PUBLIC_TAG = "Public API" as const;

const SESSION_COOKIE_NAME = "token" as const;

export function generateOpenAPI(path: string, app: INestApplication, config: Config) {
	const builder = new DocumentBuilder()
		.setTitle(config.app.name)
		.setVersion(config.app.version)
		.addServer(config.app.baseUrl)
		.addTag(
			PUBLIC_TAG,
			"Unauthenticated public API consumed by the public bosan.cz website frontend. " +
				"Exposes only published events (program) and published photo galleries, in the " +
				"legacy response shape the website expects (string `_id`s, photo `sizes`, `_links`). " +
				"These endpoints require no login and are safe to call cross-origin from the website.",
		)
		.addCookieAuth(
			SESSION_COOKIE_NAME,
			{
				type: "apiKey",
				in: "cookie",
				name: SESSION_COOKIE_NAME,
				description:
					"Session authentication via the httpOnly `token` cookie issued on login. Sent " +
					"automatically by the browser; it cannot be set from JavaScript.",
			},
			COOKIE_AUTH_SCHEME,
		)
		.build();

	const document = SwaggerModule.createDocument(app, builder, {
		autoTagControllers: false,
		operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
	});

	addOpenapiPaths(path, document);

	return document;
}

export function registerOpenAPI(path: string, app: INestApplication, config: Config) {
	const openapiDocument = generateOpenAPI(path, app, config);

	function openapiTagSorter(a: string, b: string) {
		const rootTag: typeof ROOT_TAG = "Root";
		if (a === rootTag) return -1;
		if (b === rootTag) return 1;
		return a.localeCompare(b);
	}

	SwaggerModule.setup(path, app, openapiDocument, {
		swaggerOptions: {
			tagsSorter: openapiTagSorter,
			operationsSorter: "alpha",
		},
	});
}

function addOpenapiPaths(prefix: string, document: OpenAPIObject) {
	if (!prefix.startsWith("/")) prefix = "/" + prefix;
	if (prefix.endsWith("/") && prefix !== "/") prefix = prefix.slice(0, -1);

	const paths = {
		[prefix]: {
			get: {
				tags: [ROOT_TAG],
				summary: "This SwaggerUI page",
				operationId: "viewSwaggerUI",
				parameters: [],
				responses: {
					"200": {
						description: "OpenAPI document",
						content: {
							"application/html": {
								schema: {
									type: "string",
								},
							},
						},
					},
				},
			},
		},
		[prefix + "-json"]: {
			get: {
				tags: [ROOT_TAG],
				summary: "The OpenAPI document in JSON",
				operationId: "getOpenAPIJSON",
				parameters: [],
				responses: {
					"200": {
						description: "OpenAPI document",
						content: {
							"application/json": {
								schema: {
									type: "string",
								},
							},
						},
					},
				},
			},
		},
		[prefix + "-yaml"]: {
			get: {
				tags: [ROOT_TAG],
				summary: "The OpenAPI document in YAML",
				operationId: "getOpenAPIYAML",
				parameters: [],
				responses: {
					"200": {
						description: "OpenAPI document",
						content: {
							"application/yaml": {
								schema: {
									type: "string",
								},
							},
						},
					},
				},
			},
		},
	};
	Object.assign(document.paths, paths);
}

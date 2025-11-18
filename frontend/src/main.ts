import { enableProdMode } from "@angular/core";
import { platformBrowser } from "@angular/platform-browser";

import { AppModule } from "./app/app.module";
import { environment } from "./environments/environment";
import { Logger } from "./logger";

const logger = new Logger("MAIN");

if (environment.production) {
	enableProdMode();
}

logger.log(`Starting application...`);
logger.debug(`Environment: ${environment.production ? "production" : "development"}`);

platformBrowser()
	.bootstrapModule(AppModule)
	.then(() => logger.log(`Application started`))
	.catch((err) => logger.error(`Application failed to start`, err));

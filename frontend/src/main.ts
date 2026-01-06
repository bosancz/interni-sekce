import { registerLocaleData } from "@angular/common";
import localeCs from "@angular/common/locales/cs";
import { enableProdMode } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { AppComponent } from "./app/app.component";
import { appConfig } from "./app/app.config";
import { environment } from "./environments/environment";
import { Logger } from "./logger";

const logger = new Logger("MAIN");

logger.log(`Starting application...`);
logger.debug(`Environment: ${environment.production ? "production" : "development"}`);

if (environment.production) {
	enableProdMode();
}

registerLocaleData(localeCs);

bootstrapApplication(AppComponent, appConfig)
	.then(() => logger.log(`Application started`))
	.catch((err) => logger.error(`Application failed to start`, err));

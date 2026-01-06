import { ApplicationConfig, ErrorHandler, isDevMode, LOCALE_ID } from "@angular/core";
import {
	provideRouter,
	RouteReuseStrategy,
	TitleStrategy,
	withComponentInputBinding,
	withInMemoryScrolling,
} from "@angular/router";
import { provideServiceWorker } from "@angular/service-worker";
import { IonicRouteStrategy, isPlatform, provideIonicAngular } from "@ionic/angular/standalone";
import { appRoutes } from "./app.routing";
import { MainErrorHandler } from "./core/error-handlers/main.error-handler";
import { TitleService } from "./core/services/title.service";

export const appConfig: ApplicationConfig = {
	providers: [
		provideIonicAngular({
			backButtonText: isPlatform("ios") ? "Zpět" : "",
		}),
		provideRouter(
			appRoutes,
			withComponentInputBinding(),
			withInMemoryScrolling({
				anchorScrolling: "enabled",
			}),
		),
		provideServiceWorker("ngsw-worker.js", {
			enabled: !isDevMode(), // Disable in development, enable in production
		}),
		{ provide: TitleStrategy, useClass: TitleService },
		{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
		{ provide: ErrorHandler, useClass: MainErrorHandler },
		{ provide: LOCALE_ID, useValue: "cs" },
	],
};

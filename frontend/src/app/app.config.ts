import { ApplicationConfig, ErrorHandler, isDevMode, LOCALE_ID } from "@angular/core";
import { RouteReuseStrategy, TitleStrategy } from "@angular/router";
import { provideServiceWorker } from "@angular/service-worker";
import { IonicRouteStrategy, isPlatform } from "@ionic/angular";
import { provideIonicAngular } from "@ionic/angular/standalone";
import { MainErrorHandler } from "./core/error-handlers/main.error-handler";
import { TitleService } from "./core/services/title.service";


export const appConfig: ApplicationConfig = {
	providers: [
		provideIonicAngular({
			backButtonText: isPlatform("ios") ? "Zpět" : "",
		}),
		provideServiceWorker("ngsw-worker.js", {
			enabled: !isDevMode(), // Disable in development, enable in production
		}),
		{ provide: TitleStrategy, useClass: TitleService },
		{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
		{ provide: ErrorHandler, useClass: MainErrorHandler },
		{ provide: LOCALE_ID, useValue: "cs" },
	],
};

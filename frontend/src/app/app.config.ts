import { ApplicationConfig, ErrorHandler, isDevMode, LOCALE_ID } from "@angular/core";
import {
	provideRouter,
	RouteReuseStrategy,
	TitleStrategy,
	withComponentInputBinding,
	withInMemoryScrolling,
} from "@angular/router";
import { provideServiceWorker } from "@angular/service-worker";
import { createAnimation, IonicRouteStrategy, isPlatform, provideIonicAngular } from "@ionic/angular/standalone";
import { Config } from "src/config";
import { appRoutes } from "./app.routing";
import { MainErrorHandler } from "./core/error-handlers/main.error-handler";
import { TitleService } from "./core/services/title.service";

export const appConfig: ApplicationConfig = {
	providers: [
		provideIonicAngular({
			backButtonText: isPlatform("ios") ? "Zpět" : "",
			navAnimation: (baseEl, opts) =>
				opts.direction === "forward"
					? createAnimation()
							.addElement(opts.enteringEl)
							.fromTo("opacity", "0", "1")
							.duration(250)
							.easing("ease-out")
					: createAnimation()
							.addElement(opts.leavingEl)
							.fromTo("opacity", "1", "0")
							.duration(150)
							.easing("ease-out"),
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
		Config,
	],
};

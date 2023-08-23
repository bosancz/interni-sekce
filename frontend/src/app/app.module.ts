import { registerLocaleData } from "@angular/common";
import localeCs from "@angular/common/locales/cs";
import { APP_INITIALIZER, ErrorHandler, LOCALE_ID, NgModule } from "@angular/core";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { RouteReuseStrategy, TitleStrategy } from "@angular/router";
import { ServiceWorkerModule } from "@angular/service-worker";
import { IonicModule, IonicRouteStrategy, isPlatform } from "@ionic/angular";
import { environment } from "src/environments/environment";
import SwiperCore, { Navigation } from "swiper";
import { SwiperModule } from "swiper/angular";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { CoreModule } from "./core/core.module";
import { MainErrorHandler } from "./error-handlers/main.error-handler";
import { ApiService } from "./services/api.service";
import { TitleService } from "./services/title.service";
import { SharedModule } from "./shared/shared.module";

registerLocaleData(localeCs);

SwiperCore.use([Navigation]);

@NgModule({
  declarations: [AppComponent],
  imports: [
    SharedModule,
    CoreModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    IonicModule.forRoot({
      backButtonText: isPlatform("ios") ? "Zpět" : "",
    }),
    ServiceWorkerModule.register("ngsw-worker.js", { enabled: environment.production }),
    SwiperModule,
  ],
  providers: [
    { provide: APP_INITIALIZER, useFactory: (api: ApiService) => () => api.init(), deps: [ApiService], multi: true },
    { provide: TitleStrategy, useClass: TitleService },
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: ErrorHandler, useClass: MainErrorHandler },
    { provide: LOCALE_ID, useValue: "cs" },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

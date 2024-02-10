import { registerLocaleData } from "@angular/common";
import localeCs from "@angular/common/locales/cs";
import { APP_INITIALIZER, ErrorHandler, LOCALE_ID, NgModule } from "@angular/core";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { RouteReuseStrategy, TitleStrategy } from "@angular/router";
import { ServiceWorkerModule } from "@angular/service-worker";
import { IonicModule, IonicRouteStrategy, isPlatform } from "@ionic/angular";
import { NgChartsModule } from "ng2-charts";
import { loadConfig } from "src/config";
import { environment } from "src/environments/environment";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { CoreModule } from "./core/core.module";
import { MainErrorHandler } from "./error-handlers/main.error-handler";
import { TitleService } from "./services/title.service";
import { SharedModule } from "./shared/shared.module";

registerLocaleData(localeCs);

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
    NgChartsModule.forRoot({
      generateColors: true,
    }),
    ServiceWorkerModule.register("ngsw-worker.js", { enabled: environment.production }),
  ],
  providers: [
    { provide: TitleStrategy, useClass: TitleService },
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: ErrorHandler, useClass: MainErrorHandler },
    { provide: LOCALE_ID, useValue: "cs" },
    { provide: APP_INITIALIZER, useFactory: () => loadConfig, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

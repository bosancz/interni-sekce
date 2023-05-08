import { ErrorHandler, LOCALE_ID, NgModule } from "@angular/core";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { RouteReuseStrategy } from "@angular/router";
import { ServiceWorkerModule } from "@angular/service-worker";
import { IonicModule, IonicRouteStrategy, isPlatform } from "@ionic/angular";
import { environment } from "src/environments/environment";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { AdminMenuComponent } from "./components/admin-menu/admin-menu.component";
import { LoginComponent } from "./components/login/login.component";
import { MainErrorHandler } from "./error-handlers/main.error-handler";
import { NotFoundComponent } from "./pages/not-found/not-found.component";
import { SharedModule } from "./shared/shared.module";

@NgModule({
  declarations: [AppComponent, AdminMenuComponent, LoginComponent, NotFoundComponent],
  imports: [
    SharedModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    IonicModule.forRoot({
      backButtonText: isPlatform("ios") ? "Zpět" : "",
    }),
    ServiceWorkerModule.register("ngsw-worker.js", { enabled: environment.production }),
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: ErrorHandler, useClass: MainErrorHandler },
    { provide: LOCALE_ID, useValue: "cs" },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

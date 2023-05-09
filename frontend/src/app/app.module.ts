import { ErrorHandler, LOCALE_ID, NgModule } from "@angular/core";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { RouteReuseStrategy } from "@angular/router";
import { ServiceWorkerModule } from "@angular/service-worker";
import { IonicModule, IonicRouteStrategy, isPlatform } from "@ionic/angular";
import { environment } from "src/environments/environment";
import SwiperCore, { Navigation } from "swiper";
import { SwiperModule } from "swiper/angular";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { AdminMenuComponent } from "./components/admin-menu/admin-menu.component";
import { DarkModeToggleComponent } from "./components/dark-mode-toggle/dark-mode-toggle.component";
import { LoginComponent } from "./components/login/login.component";
import { MainErrorHandler } from "./error-handlers/main.error-handler";
import { NotFoundComponent } from "./pages/not-found/not-found.component";
import { SharedModule } from "./shared/shared.module";
import { SidebarComponent } from './components/sidebar/sidebar.component';

SwiperCore.use([Navigation]);

@NgModule({
  declarations: [AppComponent, AdminMenuComponent, LoginComponent, NotFoundComponent, DarkModeToggleComponent, SidebarComponent],
  imports: [
    SharedModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    IonicModule.forRoot({
      backButtonText: isPlatform("ios") ? "Zpět" : "",
    }),
    ServiceWorkerModule.register("ngsw-worker.js", { enabled: environment.production }),
    SwiperModule,
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: ErrorHandler, useClass: MainErrorHandler },
    { provide: LOCALE_ID, useValue: "cs" },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

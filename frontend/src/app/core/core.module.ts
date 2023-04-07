import { CommonModule, registerLocaleData } from "@angular/common";
import localeCs from "@angular/common/locales/cs";
import { NgModule } from "@angular/core";
import { SharedModule } from "src/app/shared/shared.module";
import { AdminMenuComponent } from "./components/admin-menu/admin-menu.component";
import { LoginComponent } from "./pages/login/login.component";
import { NotFoundComponent } from "./pages/not-found/not-found.component";

/* STARUP SCRIPTS */
registerLocaleData(localeCs, "cs");

@NgModule({
  declarations: [NotFoundComponent, LoginComponent, AdminMenuComponent],
  imports: [CommonModule, SharedModule],
  providers: [],
})
export class CoreModule {}

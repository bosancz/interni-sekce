import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { SharedModule } from "../shared/shared.module";
import { AdminMenuComponent } from "./components/admin-menu/admin-menu.component";
import { AppLayoutComponent } from "./components/app-layout/app-layout.component";
import { AppLoadingComponent } from "./components/app-loading/app-loading.component";
import { DarkModeToggleComponent } from "./components/dark-mode-toggle/dark-mode-toggle.component";
import { LoginComponent } from "./components/login/login.component";
import { SidebarComponent } from "./components/sidebar/sidebar.component";
import { NotFoundComponent } from "./pages/not-found/not-found.component";

@NgModule({
  declarations: [
    AdminMenuComponent,
    LoginComponent,
    NotFoundComponent,
    DarkModeToggleComponent,
    SidebarComponent,
    AppLayoutComponent,
    AppLoadingComponent,
  ],
  imports: [CommonModule, SharedModule],
  exports: [
    AdminMenuComponent,
    LoginComponent,
    NotFoundComponent,
    DarkModeToggleComponent,
    SidebarComponent,
    AppLayoutComponent,
    AppLoadingComponent,
  ],
})
export class CoreModule {}

import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { SharedModule } from "../shared/shared.module";
import { AppLayoutComponent } from "./components/app-layout/app-layout.component";
import { AppLoadingComponent } from "./components/app-loading/app-loading.component";
import { DarkModeToggleComponent } from "./components/dark-mode-toggle/dark-mode-toggle.component";
import { LoginComponent } from "./components/login/login.component";
import { SideMenuComponent } from "./components/side-menu/side-menu.component";
import { SidebarComponent } from "./components/sidebar/sidebar.component";
import { NotFoundComponent } from "./pages/not-found/not-found.component";

@NgModule({
  declarations: [
    SideMenuComponent,
    LoginComponent,
    NotFoundComponent,
    DarkModeToggleComponent,
    SidebarComponent,
    AppLayoutComponent,
    AppLoadingComponent,
  ],
  imports: [CommonModule, SharedModule],
  exports: [
    SideMenuComponent,
    LoginComponent,
    NotFoundComponent,
    DarkModeToggleComponent,
    SidebarComponent,
    AppLayoutComponent,
    AppLoadingComponent,
  ],
})
export class CoreModule {}

import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { SharedModule } from "../shared/shared.module";
import { AppLayoutComponent } from "./components/app-layout/app-layout.component";
import { AppLoadingComponent } from "./components/app-loading/app-loading.component";
import { LoginComponent } from "./components/login/login.component";
import { NotFoundComponent } from "./pages/not-found/not-found.component";

@NgModule({
	declarations: [LoginComponent, NotFoundComponent, AppLayoutComponent, AppLoadingComponent],
	imports: [CommonModule, SharedModule],
	exports: [LoginComponent, NotFoundComponent, AppLayoutComponent, AppLoadingComponent],
})
export class CoreModule {}

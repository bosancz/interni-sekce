import { Component } from "@angular/core";
import { ButtonSquareComponent } from "src/app/shared/components/button-square/button-square.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";

@Component({
	selector: "bo-admin-home",

	templateUrl: "./admin-home.component.html",
	styleUrl: "./admin-home.component.scss",
	imports: [PageHeaderComponent, PageContentComponent, ButtonSquareComponent],
})
export class AdminHomeComponent {}

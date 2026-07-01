import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { UserService } from "src/app/core/services/user.service";
import { ButtonSquareComponent } from "src/app/shared/components/button-square/button-square.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";

@Component({
	selector: "bo-admin-home",

	templateUrl: "./admin-home.component.html",
	styleUrl: "./admin-home.component.scss",
	imports: [PageHeaderComponent, PageContentComponent, ButtonSquareComponent, RouterLink],
})
export class AdminHomeComponent {
	canManageUsers = this.userService.canManageUsers;
	canManagePrograms = this.userService.canManagePrograms;

	constructor(private readonly userService: UserService) {}
}

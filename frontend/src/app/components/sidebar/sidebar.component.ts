import { Component } from "@angular/core";
import { map } from "rxjs";
import { ApiService } from "src/app/services/api.service";

@Component({
	selector: "bo-sidebar",
	standalone: false,
	templateUrl: "./sidebar.component.html",
	styleUrl: "./sidebar.component.scss",
})
export class SidebarComponent {
	title = this.api.info.pipe(map((info) => "Bošán" + (info.environmentTitle ? ` ${info.environmentTitle}` : "")));

	constructor(private readonly api: ApiService) {}
}

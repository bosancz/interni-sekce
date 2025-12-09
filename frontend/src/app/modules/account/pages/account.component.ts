import { Component } from "@angular/core";
import { ApiService } from "src/app/services/api.service";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-account",
	templateUrl: "./account.component.html",
	styleUrls: ["./account.component.scss"],
	standalone: false,
})
export class AccountComponent {
	user?: SDK.UserResponseWithLinks;

	modal?: HTMLIonModalElement;

	constructor(private api: ApiService) {}

	ngOnInit() {
		this.loadUser();
	}

	async loadUser() {
		this.user = await this.api.AccountApi.getMe().then((res) => res.data);
	}
}

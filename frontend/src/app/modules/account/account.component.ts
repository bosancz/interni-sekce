import { Component } from "@angular/core";

@Component({
	selector: "bo-account",
	templateUrl: "./account.component.html",
	styleUrls: ["./account.component.scss"],
	standalone: false,
})
export class AccountComponent {
	user?: BackendApiTypes.UserResponseWithLinks;

	modal?: HTMLIonModalElement;

	constructor(private api: BackendApi) {}

	ngOnInit() {
		this.loadUser();
	}

	async loadUser() {
		this.user = await this.api.AccountApi.getMe().then((res) => res.data);
	}
}

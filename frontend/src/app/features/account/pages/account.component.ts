import { Component } from "@angular/core";
import { IonBadge, IonItem, IonLabel, IonList } from "@ionic/angular/standalone";
import { ApiService } from "src/app/core/services/api.service";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { GroupPipe } from "src/app/shared/pipes/group.pipe";
import { SDK } from "src/sdk";
import { AccountAppComponent } from "../components/account-app/account-app.component";
import { AccountCredentialsComponent } from "../components/account-credentials/account-credentials.component";

@Component({
	selector: "bo-account",
	templateUrl: "./account.component.html",
	styleUrls: ["./account.component.scss"],
	imports: [
		PageHeaderComponent,
		PageContentComponent,
		IonList,
		IonItem,
		IonLabel,
		IonBadge,
		AccountCredentialsComponent,
		AccountAppComponent,
		GroupPipe,
	],
})
export class AccountComponent {
	user?: SDK.AccountResponseWithLinks;

	modal?: HTMLIonModalElement;

	constructor(private api: ApiService) {}

	ngOnInit() {
		this.loadUser();
	}

	async loadUser() {
		this.user = await this.api.AccountApi.getMe().then((res) => res.data);
	}
}

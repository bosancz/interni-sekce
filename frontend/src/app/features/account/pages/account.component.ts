import { Component } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { IonIcon } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { mailOutline, peopleOutline } from "ionicons/icons";
import { UserService } from "src/app/core/services/user.service";
import { AvatarComponent } from "src/app/shared/components/avatar/avatar.component";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardHeaderComponent } from "src/app/shared/components/card-header/card-header.component";
import { CardTitleComponent } from "src/app/shared/components/card-title/card-title.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { GroupPipe } from "src/app/shared/pipes/group.pipe";
import { MemberPipe } from "src/app/shared/pipes/member.pipe";
import { AccountAppComponent } from "../components/account-app/account-app.component";
import { AccountCredentialsComponent } from "../components/account-credentials/account-credentials.component";

@Component({
	selector: "bo-account",
	templateUrl: "./account.component.html",
	styleUrls: ["./account.component.scss"],
	imports: [
		PageHeaderComponent,
		PageContentComponent,
		IonIcon,
		AvatarComponent,
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
		AccountCredentialsComponent,
		AccountAppComponent,
		GroupPipe,
		MemberPipe,
	],
})
export class AccountComponent {
	user = toSignal(this.userService.user);

	constructor(private userService: UserService) {
		addIcons({ mailOutline, peopleOutline });
	}
}

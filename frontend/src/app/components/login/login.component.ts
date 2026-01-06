import { Component, OnInit } from "@angular/core";
import { FormsModule, NgForm } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { NavController } from "@ionic/angular";
import { IonButton, IonContent, IonInput, IonItem, IonLabel } from "@ionic/angular/standalone";
import { toSignal } from "@angular/core/rxjs-interop";
import { map } from "rxjs/operators";
import { LoginError, LoginErrorCode, LoginService } from "src/app/services/login.service";

@Component({
	selector: "bo-login",
	templateUrl: "./login.component.html",
	styleUrls: ["./login.component.scss"],
	standalone: true,
	imports: [IonContent, IonItem, IonInput, IonButton, IonLabel, FormsModule],
})
export class LoginComponent implements OnInit {
	expired = toSignal(this.route.params.pipe(map((params) => params.expired)), { initialValue: false });

	status?: "linkSending" | "linkSent" | "userNotFound";
	error?: LoginErrorCode | "linkSendFailed" | "unknownError";

	view: string = "login";

	loginValue: string = "";

	constructor(
		private navController: NavController,
		private route: ActivatedRoute,
		private loginService: LoginService,
	) {}

	ngOnInit() {}

	async loginCredentials(loginForm: NgForm) {
		try {
			await this.loginService.loginCredentials(loginForm.value);
			this.loginSuccess();
		} catch (err: any) {
			this.error = err instanceof LoginError ? err.code : "unknownError";
		}
	}

	async loginGoogle() {
		try {
			await this.loginService.loginGoogle();

			this.loginSuccess();
		} catch (err: any) {
			this.error = err instanceof LoginError ? err.code : "unknownError";
		}
	}

	async sendLoginLink(linkForm: NgForm) {
		try {
			this.status = "linkSending";

			const formData = linkForm.value;
			await this.loginService.sendLoginLink(formData.login);

			this.status = "linkSent";
		} catch (err: any) {
			this.status = undefined;
			this.error = "linkSendFailed";
		}
	}

	async loginSuccess() {
		const return_url = this.route.snapshot.queryParams["return_url"];

		if (return_url) {
			this.navController.navigateBack([return_url]);
		} else {
			this.navController.navigateRoot(["/"]);
		}
	}
}

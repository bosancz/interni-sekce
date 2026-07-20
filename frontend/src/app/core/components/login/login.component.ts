import { Component, OnInit, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormsModule, NgForm } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { IonButton, IonContent, IonInput, IonItem, IonLabel, NavController } from "@ionic/angular/standalone";
import { map } from "rxjs/operators";
import { LoginError, LoginErrorCode, LoginService } from "src/app/core/services/login.service";

@Component({
	selector: "bo-login",
	templateUrl: "./login.component.html",
	styleUrls: ["./login.component.scss"],

	imports: [IonContent, IonItem, IonInput, IonButton, IonLabel, FormsModule],
})
export class LoginComponent implements OnInit {
	expired = toSignal(this.route.params.pipe(map((params) => params.expired)), { initialValue: false });

	status = signal<"linkSending" | "linkSent" | undefined>(undefined);
	error = signal<LoginErrorCode | "linkSendFailed" | "unknownError" | undefined>(undefined);

	view = signal<string>("login");

	loginValue = signal<string>("");

	constructor(
		private navController: NavController,
		private route: ActivatedRoute,
		private loginService: LoginService,
	) {}

	ngOnInit() {}

	async loginCredentials(loginForm: NgForm) {
		try {
			this.error.set(undefined);
			await this.loginService.loginCredentials(loginForm.value);
			this.loginSuccess();
		} catch (err: any) {
			this.error.set(err instanceof LoginError ? err.code : "unknownError");
		}
	}

	async loginGoogle() {
		try {
			this.error.set(undefined);
			await this.loginService.loginGoogle();

			this.loginSuccess();
		} catch (err: any) {
			this.error.set(err instanceof LoginError ? err.code : "unknownError");
		}
	}

	async sendLoginLink(linkForm: NgForm) {
		try {
			this.error.set(undefined);
			this.status.set("linkSending");

			const formData = linkForm.value;
			await this.loginService.sendLoginLink(formData.login);

			this.status.set("linkSent");
		} catch (err: any) {
			this.status.set(undefined);
			this.error.set("linkSendFailed");
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

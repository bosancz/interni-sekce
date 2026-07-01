import { Component, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { RouterLink } from "@angular/router";
import { IonButton, IonButtons, IonIcon } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { bugOutline, searchSharp } from "ionicons/icons";
import { map } from "rxjs";
import { AccountMenuComponent } from "src/app/core/components/account-menu/account-menu.component";
import { GlobalSearchComponent } from "src/app/core/components/global-search/global-search.component";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { PlatformService } from "src/app/core/services/platform.service";
import { ToastService } from "src/app/core/services/toast.service";

@Component({
	selector: "bo-header",
	templateUrl: "./header.component.html",
	styleUrl: "./header.component.scss",
	imports: [RouterLink, IonButton, IonButtons, IonIcon, GlobalSearchComponent, AccountMenuComponent],
})
export class HeaderComponent {
	showSearch = signal(false);

	isLg = toSignal(this.platformService.isLg);

	environment = toSignal(this.api.info.pipe(map((info) => info.environmentTitle || "")));
	

	constructor(
		private readonly api: ApiService,
		private readonly platformService: PlatformService,
		private readonly modalService: ModalService,
		private readonly toastService: ToastService,
	) {
		addIcons({ searchSharp, bugOutline });
	}

	async reportBug() {
		const url = window.location.href;

		const result = await this.modalService.wideInputModal<{ description: string }>({
			header: "Nahlásit chybu",
			buttonText: "Odeslat",
			inputs: {
				description: {
					type: "textarea",
					placeholder: "Popiš, co nefunguje..., ideálně co nejvíc detailně a s kroky, jak chybu vyvolat.",
				},
			},
		});

		const description = result?.description?.trim();
		if (!description) return;

		try {
			await this.api.FeedbackApi.sendBugReport({ description, url });
			await this.toastService.toast("Díky! Chyba byla odeslána.");
		} catch {
			await this.toastService.toast("Chybu se nepodařilo odeslat.");
		}
	}
}

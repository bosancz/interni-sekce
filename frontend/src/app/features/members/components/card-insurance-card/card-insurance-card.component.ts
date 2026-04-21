import { Component, effect, input, OnChanges, output, signal, SimpleChanges } from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { IonButton, IonButtons, IonSkeletonText } from "@ionic/angular/standalone";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { SDK } from "src/sdk";
import { CardContentComponent } from "../../../../shared/components/card-content/card-content.component";
import { CardFooterComponent } from "../../../../shared/components/card-footer/card-footer.component";
import { CardComponent } from "../../../../shared/components/card/card.component";

@Component({
	selector: "bo-card-insurance-card",
	templateUrl: "./card-insurance-card.component.html",
	styleUrls: ["./card-insurance-card.component.scss"],
	
	imports: [
		CardComponent,
		CardContentComponent,
		CardFooterComponent,
		IonSkeletonText,
		IonButton,
		IonButtons,
	],
})
export class CardInsuranceCardComponent implements OnChanges {
	member = input<SDK.MemberResponseWithLinks | null | undefined>();
	update = output<void>();

	insuranceCardUrl = signal<string | null | undefined>(undefined);
	insuranceCardSafeUrl = signal<SafeResourceUrl | null | undefined>(undefined);

	constructor(
		private api: ApiService,
		private toastService: ToastService,
		private sanitizer: DomSanitizer,
		private modalService: ModalService,
	) {
		effect(() => {
			this.setInsuranceCardUrl(this.member());
		});
	}

	ngOnChanges(changes: SimpleChanges): void {
		// Effect handles member changes now
	}

	private setInsuranceCardUrl(member?: SDK.MemberResponseWithLinks | null) {
		if (member) {
			const url =
				member?._links?.getInsuranceCard.applicable && member?._links?.getInsuranceCard.applicable
					? member._links.getInsuranceCard.href
					: null;

			this.insuranceCardUrl.set(url);
			this.insuranceCardSafeUrl.set(
				url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null,
			);
		} else {
			this.insuranceCardUrl.set(null);
			this.insuranceCardSafeUrl.set(null);
		}
	}

	onFileDrop(event: DragEvent, dropzone: HTMLDivElement) {
		console.log(event, dropzone);
		event.preventDefault();

		const file = event.dataTransfer?.files[0];
		if (!file) return;

		this.uploadCard(file);
	}

	async onFileOpen(fileInput: HTMLInputElement) {
		const file = fileInput.files?.[0];
		if (file) await this.uploadCard(file);
		fileInput.value = "";
	}

	private async uploadCard(file: File) {
		const member = this.member();
		if (!member) return;

		const uploadToast = await this.toastService.toast("Nahrávám kartičku pojištěnce...");

		try {
			await this.api.MembersApi.uploadInsuranceCard(member.id, file);

			this.setInsuranceCardUrl(member);

			this.toastService.toast("Karta byla nahrána", { color: "success" });
		} catch (e) {
			this.toastService.toast("Nahrání karty se nezdařilo", { color: "danger" });
		} finally {
			uploadToast.dismiss();
		}
	}

	openCard() {
		const insuranceCardUrl = this.insuranceCardUrl();
		if (!insuranceCardUrl) return;

		const link = document.createElement("a");
		link.href = insuranceCardUrl;
		link.target = "_blank";
		link.rel = "noopener noreferrer";

		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	async deleteCard() {
		const member = this.member();
		if (!member) return;

		const confirmation = await this.modalService.deleteConfirmationModal(
			"Opravdu chcete smazat tuto kartu pojištěnce?",
		);
		if (confirmation) {
			await this.api.MembersApi.deleteInsuranceCard(member.id);

			this.setInsuranceCardUrl(null);

			this.toastService.toast("Karta byla smazána", { color: "success" });
		}
	}
}

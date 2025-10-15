import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { ModalService } from "src/app/services/modal.service";
import { ToastService } from "src/app/services/toast.service";

@Component({
	selector: "bo-card-insurance-card",
	templateUrl: "./card-insurance-card.component.html",
	styleUrls: ["./card-insurance-card.component.scss"],
	standalone: false,
})
export class CardInsuranceCardComponent implements OnChanges {
	@Input() member?: BackendApiTypes.MemberResponseWithLinks | null;
	@Output() update = new EventEmitter<void>();

	insuranceCardUrl?: string | null;
	insuranceCardSafeUrl?: SafeResourceUrl | null;

	constructor(
		private api: BackendApi,
		private toastService: ToastService,
		private sanitizer: DomSanitizer,
		private modalService: ModalService,
	) {}

	ngOnChanges(changes: SimpleChanges): void {
		if (changes.member) this.setInsuranceCardUrl(this.member);
	}

	private setInsuranceCardUrl(member?: BackendApiTypes.MemberResponseWithLinks | null) {
		if (member) {
			this.insuranceCardUrl =
				member?._links?.getInsuranceCard.applicable && member?._links?.getInsuranceCard.applicable
					? member._links.getInsuranceCard.href
					: null;

			this.insuranceCardSafeUrl = this.insuranceCardUrl
				? this.sanitizer.bypassSecurityTrustResourceUrl(this.insuranceCardUrl)
				: undefined;
		} else {
			this.insuranceCardUrl = null;
			this.insuranceCardSafeUrl = null;
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
		const uploadToast = await this.toastService.toast("Nahrávám kartičku pojištěnce...");

		try {
			await this.api.MembersApi.uploadInsuranceCard(this.member!.id, file);

			this.setInsuranceCardUrl(this.member);

			this.toastService.toast("Karta byla nahrána", { color: "success" });
		} catch (e) {
			this.toastService.toast("Nahrání karty se nezdařilo", { color: "danger" });
		} finally {
			uploadToast.dismiss();
		}
	}

	async deleteCard() {
		const confirmation = await this.modalService.deleteConfirmationModal(
			"Opravdu chcete smazat tuto kartu pojištěnce?",
		);
		if (confirmation) {
			await this.api.MembersApi.deleteInsuranceCard(this.member!.id);

			this.setInsuranceCardUrl(null);

			this.toastService.toast("Karta byla smazána", { color: "success" });
		}
	}
}

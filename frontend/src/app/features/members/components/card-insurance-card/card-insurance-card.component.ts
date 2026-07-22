import { Component, effect, input, OnDestroy, output, signal } from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { Platform } from "@ionic/angular";
import { IonButton, IonButtons, IonIcon, IonSkeletonText } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { cardOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { SDK } from "src/sdk";
import { CardContentComponent } from "../../../../shared/components/card-content/card-content.component";
import { CardFooterComponent } from "../../../../shared/components/card-footer/card-footer.component";
import { CardHeaderComponent } from "../../../../shared/components/card-header/card-header.component";
import { CardTitleComponent } from "../../../../shared/components/card-title/card-title.component";
import { CardComponent } from "../../../../shared/components/card/card.component";
import { InsuranceCardCameraModalComponent } from "../insurance-card-camera-modal/insurance-card-camera-modal.component";

@Component({
	selector: "bo-card-insurance-card",
	templateUrl: "./card-insurance-card.component.html",
	styleUrls: ["./card-insurance-card.component.scss"],

	imports: [
		CardComponent,
		CardHeaderComponent,
		CardTitleComponent,
		CardContentComponent,
		CardFooterComponent,
		IonIcon,
		IonSkeletonText,
		IonButton,
		IonButtons,
	],
})
export class CardInsuranceCardComponent implements OnDestroy {
	member = input<SDK.MemberResponseWithLinks | null | undefined>();
	update = output<void>();

	insuranceCardUrl = signal<string | null | undefined>(undefined);
	insuranceCardSafeUrl = signal<SafeResourceUrl | null | undefined>(undefined);

	public isCameraCapable = false;

	/** Currently held object URL, kept so it can be revoked. */
	private objectUrl: string | null = null;
	/** Key of the card last loaded, to avoid re-fetching on unrelated member updates. */
	private loadedKey: string | null = null;
	/** Guards against out-of-order async loads superseding the latest one. */
	private loadToken = 0;

	constructor(
		private api: ApiService,
		private toastService: ToastService,
		private sanitizer: DomSanitizer,
		private modalService: ModalService,
		private platform: Platform,
	) {
		addIcons({ cardOutline });
		this.isCameraCapable = this.checkCapabilities();

		effect(() => {
			this.loadInsuranceCard(this.member());
		});
	}

	ngOnDestroy(): void {
		this.revokeObjectUrl();
	}

	private checkCapabilities() {
		return this.platform.is("mobile") || this.platform.is("mobileweb") || this.platform.is("tablet");
	}

	/**
	 * Loads the insurance card through the authenticated API client and renders it
	 * from a blob object URL. Using the SDK (instead of pointing an <img> at the
	 * protected endpoint) ensures the request carries the session credentials and
	 * always fetches the current file rather than a cached one.
	 */
	private async loadInsuranceCard(member?: SDK.MemberResponseWithLinks | null) {
		const applicable = !!member?._links?.getInsuranceCard?.applicable;

		if (!member || !applicable) {
			this.loadedKey = null;
			this.revokeObjectUrl();
			this.insuranceCardUrl.set(null);
			this.insuranceCardSafeUrl.set(null);
			return;
		}

		const key = `${member.id}:${member.insuranceCardFile}`;
		// Already showing this exact card – skip refetching on unrelated member changes.
		if (key === this.loadedKey && this.objectUrl) return;

		const token = ++this.loadToken;

		// Show the loading skeleton while fetching.
		this.insuranceCardUrl.set(undefined);
		this.insuranceCardSafeUrl.set(undefined);

		try {
			const res = await this.api.MembersApi.getInsuranceCard(member.id, { responseType: "blob" });
			if (token !== this.loadToken) return; // a newer load started

			this.revokeObjectUrl();
			this.objectUrl = URL.createObjectURL(res.data as unknown as Blob);
			this.loadedKey = key;
			this.insuranceCardUrl.set(this.objectUrl);
			this.insuranceCardSafeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl));
		} catch (e) {
			if (token !== this.loadToken) return;

			this.loadedKey = null;
			this.revokeObjectUrl();
			this.insuranceCardUrl.set(null);
			this.insuranceCardSafeUrl.set(null);
		}
	}

	private revokeObjectUrl() {
		if (this.objectUrl) {
			URL.revokeObjectURL(this.objectUrl);
			this.objectUrl = null;
		}
	}

	onFileDrop(event: DragEvent, dropzone: HTMLDivElement) {
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

	/**
	 * Opens the camera modal, lets the user frame and photograph the card, then
	 * uploads the cropped image through the same path as a file upload.
	 */
	async captureFromCamera() {
		const file = await this.modalService.componentModal(InsuranceCardCameraModalComponent, undefined, {
			cssClass: "insurance-card-camera",
		});
		if (file) await this.uploadCard(file);
	}

	private async uploadCard(file: File) {
		const member = this.member();
		if (!member) return;

		const uploadToast = await this.toastService.toast("Nahrávám kartičku pojištěnce...");

		try {
			await this.api.MembersApi.uploadInsuranceCard(member.id, file);

			// Force a reload of the preview even if the file extension is unchanged.
			this.loadedKey = null;
			this.insuranceCardUrl.set(undefined);
			this.update.emit();

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

		window.open(insuranceCardUrl, "_blank", "noopener,noreferrer");
	}

	async deleteCard() {
		const member = this.member();
		if (!member) return;

		const confirmation = await this.modalService.deleteConfirmationModal(
			"Opravdu chcete smazat tuto kartu pojištěnce?",
		);
		if (confirmation) {
			await this.api.MembersApi.deleteInsuranceCard(member.id);

			this.loadedKey = null;
			this.revokeObjectUrl();
			this.insuranceCardUrl.set(null);
			this.insuranceCardSafeUrl.set(null);
			this.update.emit();

			this.toastService.toast("Karta byla smazána", { color: "success" });
		}
	}
}

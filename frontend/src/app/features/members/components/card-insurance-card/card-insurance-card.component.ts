import { DatePipe } from "@angular/common";
import { Component, computed, effect, input, OnDestroy, output, signal } from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { Platform } from "@ionic/angular";
import { IonButton, IonButtons, IonIcon, IonSkeletonText } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { cardOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import {
	getInsuranceCardExpirationLabel,
	getInsuranceCardExpirationState,
	InsuranceCardExpirationState,
} from "src/helpers/insurance-card";
import { SDK } from "src/sdk";
import { CardContentComponent } from "../../../../shared/components/card-content/card-content.component";
import { CardFooterComponent } from "../../../../shared/components/card-footer/card-footer.component";
import { CardHeaderComponent } from "../../../../shared/components/card-header/card-header.component";
import { CardTitleComponent } from "../../../../shared/components/card-title/card-title.component";
import { CardComponent } from "../../../../shared/components/card/card.component";
import { EditButtonDateComponent } from "../../../../shared/components/edit-button-date/edit-button-date.component";
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
		EditButtonDateComponent,
		DatePipe,
	],
})
export class CardInsuranceCardComponent implements OnDestroy {
	member = input<SDK.MemberResponseWithLinks | null | undefined>();
	update = output<Partial<SDK.MemberUpdateBody>>();
	reload = output<void>();

	expirationState = computed<InsuranceCardExpirationState>(() =>
		getInsuranceCardExpirationState(this.member()?.insuranceCardExpiration),
	);

	expirationLabel = computed(() => getInsuranceCardExpirationLabel(this.member()?.insuranceCardExpiration));

	insuranceCardUrl = signal<string | null | undefined>(undefined);
	insuranceCardSafeUrl = signal<SafeResourceUrl | null | undefined>(undefined);

	public isCameraCapable = false;

	private objectUrl: string | null = null;
	private loadedKey: string | null = null;
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
		if (key === this.loadedKey && this.objectUrl) return;

		const token = ++this.loadToken;

		this.insuranceCardUrl.set(undefined);
		this.insuranceCardSafeUrl.set(undefined);

		try {
			const res = await this.api.MembersApi.getInsuranceCard(member.id, { responseType: "blob" });
			if (token !== this.loadToken) return;

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

		let uploaded = false;

		try {
			await this.api.MembersApi.uploadInsuranceCard(member.id, file);

			this.loadedKey = null;
			this.insuranceCardUrl.set(undefined);
			this.reload.emit();

			uploaded = true;

			this.toastService.toast("Karta byla nahrána", { color: "success" });
		} catch (e) {
			this.toastService.toast("Nahrání karty se nezdařilo", { color: "danger" });
		} finally {
			uploadToast.dismiss();
		}

		if (uploaded) await this.askExpiration();
	}

	private async askExpiration() {
		const result = await this.modalService.inputModal<{ insuranceCardExpiration: string | null }>({
			header: "Platnost kartičky",
			inputs: {
				insuranceCardExpiration: {
					type: "date",
					placeholder: "Datum expirace",
					value: this.member()?.insuranceCardExpiration,
				},
			},
		});

		if (result) this.update.emit({ insuranceCardExpiration: result.insuranceCardExpiration || null });
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
			this.reload.emit();

			this.toastService.toast("Karta byla smazána", { color: "success" });
		}
	}
}

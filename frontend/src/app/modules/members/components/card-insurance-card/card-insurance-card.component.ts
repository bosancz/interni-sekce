import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { AlertController } from "@ionic/angular";
import { MemberResponseWithLinks } from "src/app/api";
import { ApiService } from "src/app/services/api.service";
import { ToastService } from "src/app/services/toast.service";
import { MemberStoreService } from "../../services/member-store.service";

@Component({
  selector: "bo-card-insurance-card",
  templateUrl: "./card-insurance-card.component.html",
  styleUrls: ["./card-insurance-card.component.scss"],
})
export class CardInsuranceCardComponent implements OnChanges {
  @Input() member?: MemberResponseWithLinks | null;
  insuranceCardUrl?: string | null;
  insuranceCardSafeUrl?: SafeResourceUrl;

  constructor(
    private memberStore: MemberStoreService,
    private api: ApiService,
    private toastService: ToastService,
    private alertController: AlertController,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.member) {
      this.insuranceCardUrl =
        this.member?._links?.getInsuranceCard.applicable && this.member?._links?.getInsuranceCard.applicable
          ? this.member._links.getInsuranceCard.href
          : null;

      this.insuranceCardSafeUrl = this.insuranceCardUrl
        ? this.sanitizer.bypassSecurityTrustResourceUrl(this.insuranceCardUrl)
        : undefined;
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
      await this.api.members.uploadInsuranceCard(this.member!.id, file);

      await this.memberStore.loadMember(this.member!.id);

      this.toastService.toast("Karta byla nahrána", { color: "success" });
    } catch (e) {
      this.toastService.toast("Nahrání karty se nezdařilo", { color: "danger" });
    } finally {
      uploadToast.dismiss();
    }
  }

  async deleteCard() {
    const alert = await this.alertController.create({
      header: "Smazat kartičku pojištěnce",
      message: "Opravdu chcete smazat kartičku pojištěnce?",

      buttons: [
        {
          text: "Zrušit",
          role: "cancel",
        },
        {
          text: "Smazat",
          handler: async () => {
            this.deleteCardConfirmed();
          },
        },
      ],
    });

    await alert.present();
  }

  private async deleteCardConfirmed() {
    await this.api.members.deleteInsuranceCard(this.member!.id);

    await this.memberStore.loadMember(this.member!.id);

    this.toastService.toast("Karta byla smazána", { color: "success" });
  }
}

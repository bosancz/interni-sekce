import { CommonModule } from "@angular/common";
import { Component, input, output, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonButton, IonIcon, IonItem, IonLabel, IonSkeletonText } from "@ionic/angular/standalone";
import { UntilDestroy } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import { addOutline, chevronForwardOutline, imagesOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ToastService } from "src/app/core/services/toast.service";
import { EditButtonMarkdownComponent } from "src/app/shared/components/edit-button-markdown/edit-button-markdown.component";
import { SDK } from "src/sdk";
import { MarkdownPipe } from "../../../../shared/pipes/markdown.pipe";

@UntilDestroy()
@Component({
	selector: "bo-event-report",
	templateUrl: "./event-report.component.html",
	styleUrls: ["./event-report.component.scss"],

	imports: [
		CommonModule,
		RouterLink,
		EditButtonMarkdownComponent,
		MarkdownPipe,
		IonButton,
		IonIcon,
		IonItem,
		IonLabel,
		IonSkeletonText,
	],
})
export class EventReportComponent {
	event = input<SDK.EventResponseWithLinks | undefined>();
	update = output<SDK.EventUpdateBody>();
	change = output<void>();

	creatingAlbum = signal(false);

	constructor(
		private readonly api: ApiService,
		private readonly toastService: ToastService,
	) {
		addIcons({ addOutline, imagesOutline, chevronForwardOutline });
	}

	async createAlbum() {
		const event = this.event();
		if (!event || this.creatingAlbum()) return;

		this.creatingAlbum.set(true);

		try {
			const album = await this.api.PhotoGalleryApi.createAlbum({
				name: event.name,
				dateFrom: event.dateFrom,
				dateTill: event.dateTill,
			}).then((res) => res.data);

			await this.api.PhotoGalleryApi.updateAlbum(album.id, { eventId: event.id });

			this.toastService.toast("Album vytvořeno a připojeno k akci.");
			this.change.emit();
		} catch (e) {
			this.toastService.toast("Nepodařilo se vytvořit album.", { color: "warning" });
		} finally {
			this.creatingAlbum.set(false);
		}
	}
}

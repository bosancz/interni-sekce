import { CommonModule } from "@angular/common";
import { Component, input, output, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { IonButton, IonIcon, IonItem, IonLabel, IonSkeletonText } from "@ionic/angular/standalone";
import { UntilDestroy } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import { chevronForwardOutline, closeOutline, documentTextOutline, imagesOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { EditButtonMarkdownComponent } from "src/app/shared/components/edit-button-markdown/edit-button-markdown.component";
import { MarkdownEditorModalComponent } from "src/app/shared/components/markdown-editor-modal/markdown-editor-modal.component";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { SDK } from "src/sdk";
import { MarkdownPipe } from "../../../../shared/pipes/markdown.pipe";
import { AlbumSelectorModalComponent, CREATE_ALBUM } from "../album-selector-modal/album-selector-modal.component";

/**
 * Prefilled outline offered when writing a report for an event that doesn't have one yet.
 *
 * Vedle vlastního průběhu akce obsahuje otázky, které hospodář potřebuje mít v účtování
 * zodpovězené — dřív byly natvrdo v šabloně účtování, i s odpovědí "žádné", takže je nikdo
 * nikdy nevyplnil. Odpovědi jsou předvyplněné tak, aby stačilo přepsat, co se skutečně stalo.
 *
 * Nadpisy jsou úmyslně až úrovně 4: report se vypisuje pod nadpisem sekce, takže se má držet pod
 * ním, a v účtování jde do jedné buňky, kde by h1 vedle desetibodového textu působilo jako překlep.
 */
const EVENT_REPORT_TEMPLATE = [
	"#### Průběh akce",
	"",
	"",
	"#### Zdravotní komplikace některého z účastníků",
	"žádné",
	"",
	"#### Nevhodné chování účastníků (jak dětí, tak dospělých)",
	"žádné",
	"",
	"#### Stížnosti rodičů či dětí, jiné komplikace při průběhu akce",
	"žádné",
	"",
	"#### Pochvala pro jakéhokoliv účastníka akce (se zdůvodněním)",
	"žádná",
].join("\n");

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
		TooltipDirective,
	],
})
export class EventReportComponent {
	event = input<SDK.EventResponseWithLinks | undefined>();
	update = output<SDK.EventUpdateBody>();
	change = output<void>();

	addingAlbum = signal(false);
	removingAlbum = signal(false);

	constructor(
		private readonly api: ApiService,
		private readonly toastService: ToastService,
		private readonly modalService: ModalService,
	) {
		addIcons({ imagesOutline, chevronForwardOutline, documentTextOutline, closeOutline });
	}

	/** opens the same markdown editor as the pencil edit button */
	async writeReport() {
		const result = await this.modalService.componentModal(MarkdownEditorModalComponent, {
			header: "Report",
			value: this.event()?.report || EVENT_REPORT_TEMPLATE,
		});

		if (result !== null) this.update.emit({ report: result });
	}

	/**
	 * Single entry point for adding a gallery to the event. The selector is pre-searched with the
	 * event name so a likely-matching album surfaces immediately: the user either links that existing
	 * album or creates a new one (pre-filled from the event) — both paths from one modal.
	 */
	async addAlbum() {
		const event = this.event();
		if (!event || this.addingAlbum()) return;

		const result = await this.modalService.componentModal(
			AlbumSelectorModalComponent,
			{ allowCreate: true, initialSearch: event.name, createName: event.name },
			{ cssClass: "dialog-list" },
		);
		if (!result) return;

		this.addingAlbum.set(true);
		try {
			const albumId =
				result === CREATE_ALBUM
					? await this.api.PhotoGalleryApi.createAlbum({
							name: event.name,
							dateFrom: event.dateFrom,
							dateTill: event.dateTill,
						}).then((res) => res.data.id)
					: result.id;

			await this.api.PhotoGalleryApi.updateAlbum(albumId, { eventId: event.id });

			this.toastService.toast(
				result === CREATE_ALBUM ? "Album vytvořeno a připojeno k akci." : "Album připojeno k akci.",
			);
			this.change.emit();
		} catch (e) {
			this.toastService.toast(
				result === CREATE_ALBUM ? "Nepodařilo se vytvořit album." : "Nepodařilo se připojit album.",
				{ color: "warning" },
			);
		} finally {
			this.addingAlbum.set(false);
		}
	}

	/**
	 * Detaches the linked album from the event. The album itself is kept — only the link is cleared
	 * by nulling the album's `eventId` (albums own the relation, so there is no event-side field).
	 */
	async removeAlbum(album: SDK.Album, mouseEvent?: Event) {
		// the album row is itself a router link; keep the click from navigating away
		mouseEvent?.stopPropagation();
		mouseEvent?.preventDefault();

		if (this.removingAlbum()) return;

		const confirmed = await this.modalService.deleteConfirmationModal(
			`Opravdu chcete odpojit album „${album.name}“ od této akce? Album zůstane zachováno.`,
			{ header: "Odpojit album?", buttonText: "Odpojit" },
		);
		if (!confirmed) return;

		this.removingAlbum.set(true);
		try {
			await this.api.PhotoGalleryApi.updateAlbum(album.id, { eventId: null });
			this.toastService.toast("Album odpojeno od akce.");
			this.change.emit();
		} catch (e) {
			this.toastService.toast("Nepodařilo se odpojit album.", { color: "warning" });
		} finally {
			this.removingAlbum.set(false);
		}
	}
}

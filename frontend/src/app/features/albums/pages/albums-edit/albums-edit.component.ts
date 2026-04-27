import { DatePipe } from "@angular/common";
import { Component, signal, ViewChild } from "@angular/core";
import { FormsModule, NgForm } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { IonContent, IonItem, IonLabel, NavController } from "@ionic/angular/standalone";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { ApiService } from "src/app/core/services/api.service";
import { ToastService } from "src/app/core/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { SDK } from "src/sdk";
import { EventSelectorComponent } from "../../components/event-selector/event-selector.component";

@UntilDestroy()
@Component({
	selector: "albums-edit",
	templateUrl: "./albums-edit.component.html",
	styleUrls: ["./albums-edit.component.scss"],

	imports: [FormsModule, EventSelectorComponent, PageHeaderComponent, IonContent, IonItem, IonLabel, DatePipe],
})
export class AlbumsEditComponent {
	album = signal<SDK.AlbumResponseWithLinks | undefined>(undefined);

	actions = signal<Action[]>([
		{
			text: "Uložit",
			handler: () => this.saveAlbum(),
		},
	]);

	@ViewChild("albumForm") albumForm!: NgForm;

	constructor(
		public api: ApiService,
		private route: ActivatedRoute,
		private router: Router,
		private toastService: ToastService,
		private navController: NavController,
	) {}

	ngOnInit() {
		this.route.params.pipe(untilDestroyed(this)).subscribe((params) => this.loadAlbum(params.album));
	}

	private async loadAlbum(albumId: number) {
		const album = await this.api.PhotoGalleryApi.getAlbum(albumId).then((res) => res.data);
		this.album.set(album);
	}

	eventUpdated(event: SDK.EventResponseWithLinks) {
		const album = this.album();
		if (!album || !event) return;

		const updatedAlbum = { ...album, dateFrom: event.dateFrom, dateTill: event.dateTill };
		this.album.set(updatedAlbum);
	}

	private async saveAlbum() {
		const album = this.album();
		if (!album) return;

		if (this.albumForm.invalid) {
			this.toastService.toast("Nelze uložit, zkontrolujte údaje.");
			return;
		}

		let albumData: SDK.AlbumUpdateBody = this.albumForm.value;

		// prevent switched date order
		if (albumData.dateFrom && albumData.dateTill) {
			const dates = [albumData.dateFrom, albumData.dateTill];
			dates.sort();
			albumData.dateFrom = dates[0];
			albumData.dateTill = dates[1];
		}

		await this.api.PhotoGalleryApi.updateAlbum(album.id, albumData);

		this.toastService.toast("Uloženo.");

		this.navController.navigateBack(["/galerie", album.id]);
	}
}

import { DatePipe } from "@angular/common";
import { Component, signal } from "@angular/core";
import { AlertController, ViewWillEnter } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { arrowUndoOutline, trashOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ToastService } from "src/app/core/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { AdminTableCellDirective } from "src/app/shared/components/admin-table/admin-table-cell.directive";
import { AdminTableColumnComponent } from "src/app/shared/components/admin-table/admin-table-column.component";
import { AdminTableComponent } from "src/app/shared/components/admin-table/admin-table.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { AlbumPipe } from "src/app/shared/pipes/album.pipe";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-deleted-albums-list",
	templateUrl: "./deleted-albums-list.component.html",
	styleUrls: ["./deleted-albums-list.component.scss"],
	imports: [
		PageHeaderComponent,
		PageContentComponent,
		AdminTableComponent,
		AdminTableColumnComponent,
		AdminTableCellDirective,
		AlbumPipe,
		DatePipe,
	],
})
export class DeletedAlbumsListComponent implements ViewWillEnter {
	albums = signal<SDK.AlbumResponseWithLinks[] | undefined>(undefined);

	// Header shown above the actions on the mobile ActionSheet.
	rowActionsHeader = (album: SDK.AlbumResponseWithLinks) => album.name;

	// Arrow property (stable reference + bound `this`) so it can be passed as the
	// admin-table `[actions]` input and invoked from there per row.
	albumActions = (album: SDK.AlbumResponseWithLinks): Action[] => [
		{
			text: "Obnovit",
			color: "success",
			icon: arrowUndoOutline,
			hidden: !album._links.restoreAlbum.allowed,
			handler: () => this.restoreAlbum(album),
		},
		{
			text: "Smazat trvale",
			role: "destructive",
			color: "danger",
			icon: trashOutline,
			hidden: !album._links.deleteAlbumPermanent.allowed,
			handler: () => this.permanentlyDeleteAlbum(album),
		},
	];

	constructor(
		private api: ApiService,
		private alertController: AlertController,
		private toastService: ToastService,
	) {
		addIcons({ arrowUndoOutline, trashOutline });
	}

	ionViewWillEnter(): void {
		this.loadAlbums();
	}

	private async loadAlbums() {
		const albums = await this.api.PhotoGalleryApi.listDeletedAlbums().then((res) => res.data);
		this.albums.set(albums);
	}

	async restoreAlbum(album: SDK.AlbumResponseWithLinks) {
		if (!album._links.restoreAlbum.allowed) return;

		await this.api.PhotoGalleryApi.restoreAlbum(album.id);

		await this.loadAlbums();

		await this.toastService.toast(`${album.name} obnoveno.`);
	}

	async permanentlyDeleteAlbum(album: SDK.AlbumResponseWithLinks) {
		if (!album._links.deleteAlbumPermanent.allowed) return;

		const alert = await this.alertController.create({
			header: `Trvale smazat ${album.name}?`,
			message: "Smažou se i všechny fotky v albu včetně souborů. Tuto akci nelze vzít zpět.",
			buttons: [
				{ text: "Zrušit", role: "cancel" },
				{
					text: "Smazat trvale",
					role: "destructive",
					handler: async () => this.permanentlyDeleteAlbumConfirmed(album),
				},
			],
		});

		alert.present();
	}

	private async permanentlyDeleteAlbumConfirmed(album: SDK.AlbumResponseWithLinks) {
		try {
			await this.api.PhotoGalleryApi.deleteAlbumPermanent(album.id);
		} catch (err: any) {
			const message = err?.response?.data?.message ?? "Album se nepodařilo trvale smazat.";
			await this.toastService.toast(message, { color: "danger", duration: 4000 });
			return;
		}

		await this.loadAlbums();

		await this.toastService.toast(`${album.name} trvale smazáno.`);
	}
}

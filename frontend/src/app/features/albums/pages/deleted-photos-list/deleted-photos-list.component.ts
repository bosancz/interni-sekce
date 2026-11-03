import { DatePipe } from "@angular/common";
import { Component, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { ViewWillEnter } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { arrowUndoOutline, trashOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { AdminTableCellDirective } from "src/app/shared/components/admin-table/admin-table-cell.directive";
import { AdminTableColumnComponent } from "src/app/shared/components/admin-table/admin-table-column.component";
import { AdminTableComponent } from "src/app/shared/components/admin-table/admin-table.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { PhotoImageUrlPipe } from "src/app/shared/pipes/photo-image-url.pipe";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-deleted-photos-list",
	templateUrl: "./deleted-photos-list.component.html",
	styleUrls: ["./deleted-photos-list.component.scss"],
	imports: [
		PageHeaderComponent,
		PageContentComponent,
		AdminTableComponent,
		AdminTableColumnComponent,
		AdminTableCellDirective,
		PhotoImageUrlPipe,
		RouterLink,
		DatePipe,
	],
})
export class DeletedPhotosListComponent implements ViewWillEnter {
	photos = signal<SDK.PhotoResponseWithLinks[] | undefined>(undefined);

	rowActionsHeader = (photo: SDK.PhotoResponseWithLinks) => photo.name;

	photoActions = (photo: SDK.PhotoResponseWithLinks): Action[] => [
		{
			text: "Obnovit",
			color: "success",
			icon: arrowUndoOutline,
			hidden: !photo._links.restorePhoto.allowed,
			handler: () => this.restorePhoto(photo),
		},
		{
			text: "Smazat trvale",
			role: "destructive",
			color: "danger",
			icon: trashOutline,
			hidden: !photo._links.deletePhotoPermanent.allowed,
			handler: () => this.permanentlyDeletePhoto(photo),
		},
	];

	constructor(
		private api: ApiService,
		private modalService: ModalService,
		private toastService: ToastService,
	) {
		addIcons({ arrowUndoOutline, trashOutline });
	}

	ionViewWillEnter(): void {
		this.loadPhotos();
	}

	userName(user: SDK.UserResponseWithLinks | null | undefined) {
		return user ? user.member?.nickname || user.login : "";
	}

	private async loadPhotos() {
		const photos = await this.api.PhotoGalleryApi.listDeletedPhotos().then((res) => res.data);
		this.photos.set(photos);
	}

	async restorePhoto(photo: SDK.PhotoResponseWithLinks) {
		if (!photo._links.restorePhoto.allowed) return;

		await this.api.PhotoGalleryApi.restorePhoto(photo.id);

		await this.loadPhotos();

		await this.toastService.toast(`${photo.name} obnovena.`);
	}

	async permanentlyDeletePhoto(photo: SDK.PhotoResponseWithLinks) {
		if (!photo._links.deletePhotoPermanent.allowed) return;

		const confirmed = await this.modalService.deleteConfirmationModal(
			"Smaže se i soubor fotky. Tuto akci nelze vzít zpět.",
			{ header: `Trvale smazat ${photo.name}?`, buttonText: "Smazat trvale" },
		);
		if (confirmed) await this.permanentlyDeletePhotoConfirmed(photo);
	}

	private async permanentlyDeletePhotoConfirmed(photo: SDK.PhotoResponseWithLinks) {
		try {
			await this.api.PhotoGalleryApi.deletePhotoPermanent(photo.id);
		} catch (err: any) {
			const message = err?.response?.data?.message ?? "Fotku se nepodařilo trvale smazat.";
			await this.toastService.toast(message, { color: "danger", duration: 4000 });
			return;
		}

		await this.loadPhotos();

		await this.toastService.toast(`${photo.name} trvale smazána.`);
	}
}

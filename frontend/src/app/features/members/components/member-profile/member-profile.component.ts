import { Component, input, output } from "@angular/core";
import { IonAvatar, IonIcon } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { cameraOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { ModalService } from "src/app/core/services/modal.service";
import { ToastService } from "src/app/core/services/toast.service";
import { PhotosEditComponent } from "src/app/features/albums/components/photos-edit/photos-edit.component";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { MemberProfilePhotoUrlPipe } from "src/app/shared/pipes/member-profile-photo-url.pipe";
import { SDK } from "src/sdk";
import { CardContentComponent } from "../../../../shared/components/card-content/card-content.component";
import { CardComponent } from "../../../../shared/components/card/card.component";
import { MemberPipe } from "../../../../shared/pipes/member.pipe";
import { MemberProfilePhotoModalComponent } from "../member-profile-photo-modal/member-profile-photo-modal.component";

@Component({
	selector: "bo-member-profile",
	templateUrl: "./member-profile.component.html",
	styleUrl: "./member-profile.component.scss",
	imports: [
		CardComponent,
		CardContentComponent,
		IonAvatar,
		IonIcon,
		MemberPipe,
		MemberProfilePhotoUrlPipe,
		TooltipDirective,
	],
})
export class MemberProfileComponent {
	member = input<SDK.MemberResponseWithLinks | null | undefined>();

	change = output<void>();

	constructor(
		private api: ApiService,
		private modalService: ModalService,
		private toastService: ToastService,
	) {
		addIcons({ cameraOutline });
	}

	async openSourcePhoto() {
		const source = this.member()?.profilePhoto;
		if (!source) return;

		try {
			const photos = await this.api.PhotoGalleryApi.getAlbumPhotos(source.albumId).then((res) => res.data);
			const startPhoto = photos.find((photo) => photo.id === source.photoId);
			if (!startPhoto) throw new Error("Photo not found");

			await this.modalService.modal(
				PhotosEditComponent,
				{ photos, startPhoto },
				{ backdropDismiss: false, cssClass: "ion-modal-lg" },
			);
		} catch {
			this.toastService.toast("Fotku se nepodařilo otevřít.", { color: "warning" });
		}
	}

	async editProfilePhoto() {
		const member = this.member();
		if (!member?._links.updateMemberProfilePhoto.allowed) return;

		const result = await this.modalService.componentModal(
			MemberProfilePhotoModalComponent,
			{ member },
			{ cssClass: "dialog-brand" },
		);
		if (!result) return;

		try {
			if (result.faceId === null) await this.api.MembersApi.deleteMemberProfilePhoto(member.id);
			else await this.api.MembersApi.updateMemberProfilePhoto(member.id, { faceId: result.faceId });
		} catch {
			this.toastService.toast("Profilovou fotku se nepodařilo uložit.", { color: "danger" });
			return;
		}

		this.toastService.toast(result.faceId === null ? "Profilová fotka odebrána." : "Profilová fotka uložena.");
		this.change.emit();
	}
}

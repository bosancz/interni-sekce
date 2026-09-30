import { Component, OnInit, signal } from "@angular/core";
import { IonSpinner, ModalController } from "@ionic/angular/standalone";
import { ApiService } from "src/app/core/services/api.service";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";
import { PhotoFaceImageUrlPipe } from "src/app/shared/pipes/photo-face-image-url.pipe";
import { FACE_EMOTIONS, faceHappiness } from "src/helpers/face-emotions";
import { SDK } from "src/sdk";

export interface MemberProfilePhotoModalResult {
	faceId: number | null;
}

@Component({
	selector: "bo-member-profile-photo-modal",
	templateUrl: "./member-profile-photo-modal.component.html",
	styleUrl: "./member-profile-photo-modal.component.scss",
	imports: [ModalLayoutComponent, PhotoFaceImageUrlPipe, IonSpinner],
})
export class MemberProfilePhotoModalComponent
	extends InputModalComponent<MemberProfilePhotoModalResult>
	implements OnInit
{
	member!: SDK.MemberResponseWithLinks;

	faces = signal<SDK.PhotoFaceResponse[]>([]);
	loading = signal(true);
	selectedFaceId = signal<number | null>(null);

	faceEmotions = FACE_EMOTIONS;

	constructor(
		modalController: ModalController,
		private api: ApiService,
	) {
		super(modalController);
	}

	async ngOnInit() {
		this.selectedFaceId.set(this.member.profilePhotoFaceId ?? null);

		try {
			const photos = await this.api.MembersApi.listMemberPhotos(this.member.id, { limit: 200 }).then(
				(res) => res.data,
			);
			this.faces.set(photos.map((photo) => photo.face).sort((a, b) => faceHappiness(b) - faceHappiness(a)));
		} finally {
			this.loading.set(false);
		}
	}

	save() {
		const faceId = this.selectedFaceId();
		if (faceId === null) return;
		this.submit.emit({ faceId });
	}

	remove() {
		this.submit.emit({ faceId: null });
	}
}

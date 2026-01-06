import { DatePipe } from "@angular/common";
import { Component, OnInit, signal } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { AlertController, NavController } from "@ionic/angular";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { ApiService } from "src/app/services/api.service";
import { ToastService } from "src/app/services/toast.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { PhotoGalleryComponent } from "src/app/shared/components/photo-gallery/photo-gallery.component";
import { DateRangePipe } from "src/app/shared/pipes/date-range.pipe";
import { SDK } from "src/sdk";
import { AlbumsTabsComponent } from "../components/albums-tabs/albums-tabs.component";

@UntilDestroy()
@Component({
	selector: "bo-albums-view-info",
	templateUrl: "./albums-view-info.component.html",
	styleUrls: ["./albums-view-info.component.scss"],
	
	imports: [
		PageHeaderComponent,
		PageContentComponent,
		PhotoGalleryComponent,
		AlbumsTabsComponent,
		DatePipe,
		DateRangePipe,
	],
})
export class AlbumsViewInfoComponent implements OnInit {
	album = signal<SDK.AlbumResponseWithLinks | undefined>(undefined);

	actions = signal<Action[]>([]);

	alert?: HTMLIonAlertElement;

	constructor(
		private route: ActivatedRoute,
		private router: Router,
		private api: ApiService,
		private toastService: ToastService,
		private alertController: AlertController,
		private navController: NavController,
	) {}

	ngOnInit(): void {
		this.route.params.pipe(untilDestroyed(this)).subscribe((params) => this.loadAlbum(params["album"]));
	}

	ngOnDestroy() {
		this.alert?.dismiss();
	}

	async loadAlbum(albumId: number) {
		const album = await this.api.PhotoGalleryApi.getAlbum(albumId).then((res) => res.data);
		this.album.set(album);
		this.updateActions(album);
	}

	private async publish() {
		const album = this.album();
		if (!album?._links.unpublishAlbum.allowed) return;
		await this.api.PhotoGalleryApi.unpublishAlbum(album.id);
		await this.loadAlbum(album.id);
		this.toastService.toast("Publikováno.");
	}

	private async unpublish() {
		const album = this.album();
		if (!album?._links.publishAlbum.allowed) return;
		await this.api.PhotoGalleryApi.publishAlbum(album.id);
		await this.loadAlbum(album.id);
		this.toastService.toast("Publikováno.");
	}

	private async delete() {
		const album = this.album();
		this.alert = await this.alertController.create({
			message: `Opravdu chcete smazat album ${album?.name}?`,
			buttons: [
				{ text: "Zrušit", role: "cancel" },
				{ text: "Smazat", handler: () => this.deleteConfirmed() },
			],
		});

		this.alert.present();
	}

	private async deleteConfirmed() {
		const album = this.album();
		if (!album) return;

		await this.api.PhotoGalleryApi.deleteAlbum(album.id);

		this.toastService.toast("Smazáno.");
		this.router.navigate(["/galerie"], { relativeTo: this.route, replaceUrl: true });
	}

	private open() {
		const album = this.album();
		if (!album) return;
		window.open("https://bosan.cz/fotogalerie/" + album.id);
	}

	onPhotoClick(event: SDK.PhotoResponseWithLinks) {
		const album = this.album();
		if (album) {
			this.navController.navigateForward(`/galerie/${album.id}/fotky`, {
				queryParams: { photo: event.id },
			});
		}
	}

	private updateActions(album: SDK.AlbumResponseWithLinks) {
		this.actions.set([
			{
				text: "Upravit",
				icon: "create-outline",
				pinned: true,
				handler: () => this.router.navigate(["../upravit"], { relativeTo: this.route }),
			},
			{
				text: "Otevřít na webu",
				icon: "open-outline",
				color: "success",
				hidden: album.status !== "public",
				handler: () => this.open(),
			},
			{
				text: "Publikovat",
				icon: "eye-outline",
				hidden: album.status !== "draft",
				handler: () => this.publish(),
			},
			{
				text: "Zrušit publikaci",
				icon: "eye-off-outline",
				hidden: album.status !== "public",
				handler: () => this.unpublish(),
			},
			{
				text: "Smazat",
				role: "destructive",
				icon: "trash",
				color: "danger",
				handler: () => this.delete(),
			},
		]);
	}
}

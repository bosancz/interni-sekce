import {
	AfterViewInit,
	Component,
	effect,
	ElementRef,
	input,
	NgZone,
	OnDestroy,
	OnInit,
	output,
	signal,
} from "@angular/core";
import { IonIcon } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { star } from "ionicons/icons";
import { PhotoImageUrlPipe } from "src/app/shared/pipes/photo-image-url.pipe";
import { SDK } from "src/sdk";

interface PhotoRowItem {
	photo: SDK.PhotoResponseWithLinks;
	ratio: number;
}

class PhotoRow {
	height: number = 0;
	photos: PhotoRowItem[] = [];
}

@Component({
	selector: "bo-photo-gallery",
	templateUrl: "./photo-gallery.component.html",
	styleUrls: ["./photo-gallery.component.scss"],
	imports: [IonIcon, PhotoImageUrlPipe],
})
export class PhotoGalleryComponent implements OnInit, AfterViewInit, OnDestroy {
	photos = input<SDK.PhotoResponseWithLinks[]>([]);
	maxHeight = input<number>(200);
	clickable = input<boolean>(false);

	margin: number = 5;

	click = output<SDK.PhotoResponseWithLinks>();

	rows = signal<PhotoRow[]>([]);

	width!: number;

	private resizeObserver?: ResizeObserver;

	constructor(
		private elRef: ElementRef<HTMLElement>,
		private ngZone: NgZone,
	) {
		addIcons({ star });

		effect(() => {
			const photos = this.photos();
			if (photos) this.createRows();
		});
	}

	ngOnInit(): void {}

	ngAfterViewInit() {
		this.resizeObserver = new ResizeObserver(() => {
			const width = this.elRef.nativeElement.offsetWidth;
			if (width === this.width) return;

			this.ngZone.run(() => {
				this.width = width;
				this.createRows();
			});
		});

		this.resizeObserver.observe(this.elRef.nativeElement);
	}

	ngOnDestroy() {
		this.resizeObserver?.disconnect();
	}

	createRows() {
		if (!this.width) return;

		const photos = this.photos().slice();
		const maxHeight = this.maxHeight();

		const rows: PhotoRow[] = [];

		while (photos.length) {
			let rowWidth = 0;
			let row = new PhotoRow();
			let photo: SDK.PhotoResponseWithLinks | undefined;

			while (rowWidth <= this.width && (photo = photos.shift())) {
				const ratio = photo.width && photo.height ? photo.width / photo.height : 3 / 2;
				rowWidth += maxHeight * ratio;
				if (row.photos.length) rowWidth += this.margin;
				row.photos.push({ photo, ratio });
			}

			const totalMaxWidth = row.photos.reduce((acc, cur) => {
				return acc + maxHeight * cur.ratio;
			}, 0);

			const availableWidth = this.width - (row.photos.length - 1) * this.margin;

			const ratio = availableWidth / totalMaxWidth;

			row.height = maxHeight * ratio;

			if (!photos.length) {
				const rowHeightAvg = rows.reduce((acc, cur) => acc + cur.height, 0) / rows.length;
				row.height = Math.min(rowHeightAvg, row.height);
			}

			rows.push(row);
		}

		this.rows.set(rows);
	}

	private static readonly TRANSPARENT_PX =
		"data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

	onImgError(event: Event) {
		const img = event.target as HTMLImageElement;
		if (img.src === PhotoGalleryComponent.TRANSPARENT_PX) return;
		img.src = PhotoGalleryComponent.TRANSPARENT_PX;
	}

	onPhotoClick(event: MouseEvent, photo: SDK.PhotoResponseWithLinks) {
		if (!this.clickable()) return;

		event.preventDefault();
		event.stopPropagation();
		this.click.emit(photo);
	}
}

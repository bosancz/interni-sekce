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
	imports: [PhotoImageUrlPipe],
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

	// Some photos carry a transposed width/height (e.g. EXIF-rotated originals imported from
	// the old server, whose served thumbnail is baked upright while the stored dimensions are
	// not). The served image is the source of truth for the aspect ratio, so once it loads we
	// override the stored ratio with the natural one and re-tile. Keyed by photo id.
	private ratioOverrides = new Map<SDK.PhotoResponseWithLinks["id"], number>();

	private recomputeScheduled = false;

	constructor(
		private elRef: ElementRef<HTMLElement>,
		private ngZone: NgZone,
	) {
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

			// add photos to row, stop when first photo over limit
			while (rowWidth <= this.width && (photo = photos.shift())) {
				const ratio = this.ratioFor(photo);
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

	private ratioFor(photo: SDK.PhotoResponseWithLinks): number {
		const override = this.ratioOverrides.get(photo.id);
		if (override) return override;
		return photo.width && photo.height ? photo.width / photo.height : 3 / 2;
	}

	// Coalesce the re-tiling that natural-ratio corrections trigger: many lazily-loaded
	// images can report a corrected ratio within the same frame, so rebuild the rows once.
	private scheduleRecompute() {
		if (this.recomputeScheduled) return;
		this.recomputeScheduled = true;
		requestAnimationFrame(() => {
			this.recomputeScheduled = false;
			this.ngZone.run(() => this.createRows());
		});
	}

	onImgLoad(event: Event, photo: SDK.PhotoResponseWithLinks) {
		const img = event.target as HTMLImageElement;
		const { naturalWidth, naturalHeight } = img;

		// ignore the 1x1 transparent placeholder swapped in on error
		if (naturalWidth <= 1 || naturalHeight <= 1) return;

		const natural = naturalWidth / naturalHeight;
		const current = this.ratioFor(photo);

		// only re-tile when the stored ratio is meaningfully off (e.g. transposed), so
		// correctly-tagged photos never shift and sub-pixel differences are ignored
		if (Math.abs(natural - current) / current <= 0.02) return;

		this.ratioOverrides.set(photo.id, natural);
		this.scheduleRecompute();
	}

	// transparent 1x1 pixel — replaces a failed image so the browser stops
	// drawing its broken-image glyph while the placeholder colour stays visible
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

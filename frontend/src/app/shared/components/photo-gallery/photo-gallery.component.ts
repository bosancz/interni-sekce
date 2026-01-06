import {
    AfterViewChecked,
    Component,
    effect,
    ElementRef,
    input,
    OnInit,
    output,
} from "@angular/core";
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
	
})
export class PhotoGalleryComponent implements OnInit, AfterViewChecked {
	photos = input<SDK.PhotoResponseWithLinks[]>([]);
	maxHeight = input<number>(200);
	clickable = input<boolean>(false);

	margin: number = 5;

	click = output<SDK.PhotoResponseWithLinks>();

	rows: PhotoRow[] = [];

	width!: number;

	constructor(private elRef: ElementRef<HTMLElement>) {
		effect(() => {
			const photos = this.photos();
			if (photos) this.createRows();
		});
	}

	ngOnInit(): void {}

	ngAfterViewChecked() {
		const width = this.elRef.nativeElement.offsetWidth;

		if (width !== this.width) {
			this.width = width;
			setTimeout(() => this.createRows(), 0);
		}
	}

	createRows() {
		if (!this.width) return;

		this.rows = [];

		const photos = this.photos().slice();
		const maxHeight = this.maxHeight();

		const rows: PhotoRow[] = [];

		while (photos.length) {
			let rowWidth = 0;
			let row = new PhotoRow();
			let photo: SDK.PhotoResponseWithLinks | undefined;

			// add photos to row, stop when first photo over limit
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

		this.rows = rows;
	}

	onPhotoClick(event: MouseEvent, photo: SDK.PhotoResponseWithLinks) {
		if (!this.clickable()) return;

		event.preventDefault();
		event.stopPropagation();
		this.click.emit(photo);
	}
}

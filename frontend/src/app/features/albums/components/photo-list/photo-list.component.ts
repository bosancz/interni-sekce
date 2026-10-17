import { DatePipe } from "@angular/common";
import { Component, ElementRef, input, OnInit, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
	IonCheckbox,
	IonChip,
	IonIcon,
	IonInput,
	IonItem,
	IonLabel,
	IonReorder,
	IonReorderGroup,
	IonRippleEffect,
	IonSkeletonText,
	IonThumbnail,
} from "@ionic/angular/standalone";
import { ItemReorderEventDetail } from "@ionic/core";
import { addIcons } from "ionicons";
import { star } from "ionicons/icons";
import { TooltipDirective } from "src/app/shared/directives/tooltip.directive";
import { PhotoImageUrlPipe } from "src/app/shared/pipes/photo-image-url.pipe";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-photo-list",
	templateUrl: "./photo-list.component.html",
	styleUrls: ["./photo-list.component.scss"],

	imports: [
		FormsModule,
		DatePipe,
		IonReorderGroup,
		IonItem,
		IonCheckbox,
		IonChip,
		IonIcon,
		IonInput,
		IonLabel,
		IonReorder,
		IonSkeletonText,
		IonThumbnail,
		IonRippleEffect,
		PhotoImageUrlPipe,
		TooltipDirective,
	],
})
export class PhotoListComponent implements OnInit {
	photos = input<SDK.PhotoResponseWithLinks[] | undefined>();
	view = input<"list" | "grid">("grid");
	selectable = input<boolean>(false);
	sortable = input<boolean>(false);
	selected = input<SDK.PhotoResponseWithLinks[]>([]);
	editCaptions = input<boolean>(false);
	captions = input<Record<number, string>>({});

	selectedChange = output<SDK.PhotoResponseWithLinks[]>();
	reorderChange = output<SDK.PhotoResponseWithLinks[]>();
	longPress = output<SDK.PhotoResponseWithLinks>();
	captionChange = output<{ photo: SDK.PhotoResponseWithLinks; caption: string }>();
	click = output<CustomEvent<SDK.PhotoResponseWithLinks | undefined>>();

	loadingPhotos = signal<any[]>(Array(5).fill(true));

	private longPressTimeout?: ReturnType<typeof setTimeout>;
	private longPressStart?: { x: number; y: number };
	private longPressFired = false;

	constructor(private host: ElementRef<HTMLElement>) {
		addIcons({ star });
	}

	ngOnInit(): void {}

	onReorder(ev: CustomEvent<ItemReorderEventDetail>) {
		const photos = this.photos();
		if (!photos) {
			ev.detail.complete();
			return;
		}

		const reordered = ev.detail.complete([...photos]) as SDK.PhotoResponseWithLinks[];
		this.reorderChange.emit(reordered);
	}

	getMpix(width: number, height: number) {
		return Math.round((width * height) / 1000000);
	}

	onPhotoClick(photo: SDK.PhotoResponseWithLinks, event: MouseEvent) {
		if (this.editCaptions()) return;

		event.preventDefault();
		event.stopPropagation();

		if (this.longPressFired) {
			this.longPressFired = false;
			return;
		}

		if (this.selectable()) {
			this.onPhotoCheck(photo, !this.isPhotoChecked(photo));
		} else {
			this.click.emit(new CustomEvent("click", { detail: photo }));
		}
	}

	onPointerDown(photo: SDK.PhotoResponseWithLinks, event: PointerEvent) {
		this.cancelLongPress();
		if (this.editCaptions()) return;
		this.longPressFired = false;
		this.longPressStart = { x: event.clientX, y: event.clientY };
		this.longPressTimeout = setTimeout(() => {
			this.longPressFired = true;
			this.longPress.emit(photo);
		}, 500);
	}

	onPointerMove(event: PointerEvent) {
		if (!this.longPressStart) return;
		const dx = event.clientX - this.longPressStart.x;
		const dy = event.clientY - this.longPressStart.y;
		if (Math.hypot(dx, dy) > 10) this.cancelLongPress();
	}

	cancelLongPress() {
		if (this.longPressTimeout) clearTimeout(this.longPressTimeout);
		this.longPressTimeout = undefined;
		this.longPressStart = undefined;
	}

	focusNextCaption(event: Event) {
		event.preventDefault();
		const inputs = Array.from(
			this.host.nativeElement.querySelectorAll<HTMLIonInputElement>("ion-input.caption-input"),
		);
		const current = (event.target as HTMLElement).closest("ion-input");
		const next = inputs.slice(inputs.indexOf(current as HTMLIonInputElement) + 1).find((item) => !item.disabled);
		next?.setFocus();
	}

	isPhotoChecked(photo: SDK.PhotoResponseWithLinks) {
		return this.selected().indexOf(photo) !== -1;
	}

	onPhotoCheck(photo: SDK.PhotoResponseWithLinks, isChecked: boolean) {
		const selected = [...this.selected()];
		const i = selected.indexOf(photo);

		if (isChecked && i === -1) {
			selected.push(photo);
		} else if (!isChecked && i !== -1) {
			selected.splice(i, 1);
		}

		this.selectedChange.emit(selected);
	}
}

import { Component, computed, ElementRef, linkedSignal, signal, ViewChild } from "@angular/core";
import { IonIcon, ModalController, ViewDidEnter } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { addOutline, checkmarkOutline, closeOutline, searchOutline } from "ionicons/icons";
import { POPULAR_RIVERS, RIVERS } from "src/app/core/config/rivers";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";

interface RiverOption {
	river: string;
	popular: boolean;
}

@Component({
	selector: "bo-river-select-modal",
	templateUrl: "./river-select-modal.component.html",
	styleUrl: "./river-select-modal.component.scss",
	imports: [IonIcon, ModalLayoutComponent],
})
export class RiverSelectModalComponent extends InputModalComponent<{ river: string | null }> implements ViewDidEnter {
	value: string | null = null;

	query = signal("");

	@ViewChild("searchInput") searchInput?: ElementRef<HTMLInputElement>;
	@ViewChild("list") list?: ElementRef<HTMLElement>;

	options = computed<RiverOption[]>(() => {
		const query = this.normalize(this.query().trim());
		if (query) {
			return RIVERS.filter((river) => this.normalize(river).includes(query)).map((river) => ({
				river,
				popular: false,
			}));
		}
		return [
			...POPULAR_RIVERS.map((river) => ({ river, popular: true })),
			...RIVERS.map((river) => ({ river, popular: false })),
		];
	});

	customRiver = computed(() => {
		const query = this.query().trim();
		if (!query) return null;
		const normalized = this.normalize(query);
		return RIVERS.some((river) => this.normalize(river) === normalized) ? null : query;
	});

	activeIndex = linkedSignal<RiverOption[], number>({
		source: this.options,
		computation: (options) => (this.query().trim() && options.length ? 0 : -1),
	});

	constructor(modalController: ModalController) {
		super(modalController);
		addIcons({ addOutline, checkmarkOutline, closeOutline, searchOutline });
	}

	ionViewDidEnter(): void {
		this.searchInput?.nativeElement.focus();
	}

	select(river: string | null) {
		this.submit.emit({ river });
	}

	onSearchKeydown(event: KeyboardEvent) {
		const options = this.options();
		switch (event.key) {
			case "ArrowDown":
				event.preventDefault();
				if (options.length) this.setActive(Math.min(this.activeIndex() + 1, options.length - 1));
				break;
			case "ArrowUp":
				event.preventDefault();
				if (options.length) this.setActive(Math.max(this.activeIndex() - 1, 0));
				break;
			case "Enter": {
				event.preventDefault();
				const option = options[this.activeIndex()];
				if (option) this.select(option.river);
				else if (this.customRiver()) this.select(this.customRiver());
				break;
			}
		}
	}

	setActive(index: number) {
		this.activeIndex.set(index);
		window.requestAnimationFrame(() =>
			this.list?.nativeElement.querySelectorAll(".rs-row")[index]?.scrollIntoView({ block: "nearest" }),
		);
	}

	private normalize(value: string) {
		return value
			.toLocaleLowerCase()
			.normalize("NFD")
			.replace(/\p{Diacritic}/gu, "");
	}
}

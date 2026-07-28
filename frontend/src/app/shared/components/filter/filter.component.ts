import {
	AfterContentInit,
	AfterViewInit,
	Component,
	ContentChildren,
	input,
	Optional,
	output,
	QueryList,
	signal,
	TemplateRef,
	ViewChild,
} from "@angular/core";
import { FormsModule, NgModel } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { IonBadge, IonButton, IonIcon, IonModal, IonSearchbar, IonToolbar } from "@ionic/angular/standalone";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import { filterOutline } from "ionicons/icons";
import { ModalService } from "src/app/core/services/modal.service";
import { UrlParams } from "src/helpers/typings";
import { FilterModalComponent } from "../filter-modal/filter-modal.component";
import { FilterModel } from "./filter-model";

export type FilterData = any;

@UntilDestroy()
@Component({
	selector: "bo-filter",
	templateUrl: "./filter.component.html",
	styleUrls: ["./filter.component.scss"],

	imports: [IonToolbar, IonSearchbar, IonButton, IonIcon, IonBadge, FormsModule],
})
export class FilterComponent implements AfterContentInit, AfterViewInit {
	search = input<boolean>(false);
	paramsSeparator = input<string>(",");
	showButtonMobileOnly = input<boolean>(false);
	// Whether to render the filter button that opens the modal. Set to false when every filter lives
	// in the toolbar (pills/popovers) and there is no projected modal content, so mobile and desktop
	// share the same inline controls instead of a redundant modal.
	filterModal = input<boolean>(true);
	// When true the modal is a plain disclosure sheet whose controls (pills/toggles) write straight to
	// the URL, so there is nothing to submit or revert — used to collect inline controls into a modal
	// on mobile while keeping them inline on desktop.
	immediateFilter = input<boolean>(false);
	change = output<FilterData>();

	@ViewChild(IonModal) modal?: IonModal;
	@ViewChild(IonSearchbar) searchbar?: IonSearchbar;

	@ContentChildren(NgModel, { descendants: true }) controls!: QueryList<NgModel>;

	readonly filterId = String(new Date().getTime());

	searchString = signal<string | undefined>(undefined);

	filterCount = signal<number>(0);

	// ControlValueAccessor
	disabled = signal<boolean>(false);

	constructor(
		private router: Router,
		private route: ActivatedRoute,
		private modalService: ModalService,
		// Provided by the list page as the wrapper filter model; absent for legacy (NgModel) filters.
		@Optional() private filterModel: FilterModel | null,
	) {
		addIcons({ filterOutline });
	}

	public ngAfterContentInit() {
		setTimeout(() => {
			this.route.queryParams.pipe(untilDestroyed(this)).subscribe((params) => {
				this.setControls(params);
				this.emitValue();
			});
		});
	}

	ngAfterViewInit(): void {
		// FIXME: Workaround for focus on searchbar, because it's not working when called directly
		setTimeout(() => this.searchbar?.setFocus(), 500);
	}

	async openFilter(filterContent: TemplateRef<any>) {
		const immediate = this.immediateFilter();

		if (immediate) {
			// Stage the whole filter in the model: while the modal is open, control changes only build
			// a draft (the list behind it stays put). On confirm ("Hotovo") the model emits the full
			// filter to apply; any other close (Zrušit / backdrop / back) drops the draft.
			this.filterModel?.begin();

			// Present without the history-based back-close: the model applies the filter with
			// `replaceUrl`, so it replaces the current entry and the browser back button doesn't cycle
			// through every filter change.
			const modal = await this.modalService.modal(
				FilterModalComponent,
				{ content: filterContent, immediate },
				{ cssClass: "dialog" },
				false,
			);
			const { data } = await modal.onDidDismiss<boolean>();

			if (data === true) this.filterModel?.commit();
			else this.filterModel?.cancel();
			return;
		}

		const result = await this.modalService.componentModal(FilterModalComponent, {
			content: filterContent,
			immediate,
		});

		if (result === true) {
			// filter submitted - set new filters
			this.setParams();
		} else if (result === false) {
			// filter reset - clear all filters
			this.setControls({});
			this.setParams();
		} else {
			// filter dismissed - revert changes
			this.setControls(this.route.snapshot.queryParams);
		}
	}

	onSearchbarUpdate() {
		this.setParams();
	}

	public setParams() {
		const queryParams: UrlParams = { ...this.route.snapshot.queryParams };

		const paramsSeparator = this.paramsSeparator();
		this.controls.forEach((item) => {
			if (Array.isArray(item.value)) {
				queryParams[item.name] = item.value
					.filter((i) => !!i)
					.map((i) => String(i))
					.join(paramsSeparator);
			} else {
				queryParams[item.name] = item.value ? String(item.value) : undefined;
			}

			if (!queryParams[item.name]) delete queryParams[item.name];
		});

		if (this.search()) {
			const searchString = this.searchString();
			if (searchString) queryParams.search = searchString;
			else delete queryParams.search;
		}

		this.router.navigate([], { queryParams, replaceUrl: true });
	}

	emitValue() {
		const value: FilterData = this.controls.reduce((acc, cur) => ({ ...acc, [cur.name]: cur.value || null }), {});
		if (this.search() && this.searchString()) value["search"] = this.searchString();
		this.change.emit(value);
	}

	setControls(params: UrlParams) {
		const paramsSeparator = this.paramsSeparator();
		for (const item of this.controls) {
			let value: any = params[item.name]?.split(paramsSeparator);
			if (Array.isArray(value) && value.length === 1) value = value[0];

			item.control.setValue(value || null);
		}

		this.filterCount.set(this.controls.reduce((acc, cur) => acc + (cur.value ? 1 : 0), 0));

		if (this.search() && params["search"]) this.searchString.set(params["search"]);
	}
}

import { DecimalPipe, NgTemplateOutlet } from "@angular/common";
import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { ActivatedRoute, Params, Router, RouterLink } from "@angular/router";
import { IonIcon, IonSkeletonText } from "@ionic/angular/standalone";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import { imagesOutline, peopleOutline } from "ionicons/icons";
import { EventKinds } from "src/app/core/config/event-kinds";
import { EventTypeID, EventTypes } from "src/app/core/config/event-types";
import { ApiService } from "src/app/core/services/api.service";
import { PlatformService } from "src/app/core/services/platform.service";
import { ToastService } from "src/app/core/services/toast.service";
import { EventGroupsComponent } from "src/app/shared/components/event-groups/event-groups.component";
import { FilterPillComponent, FilterPillOption } from "src/app/shared/components/filter-pill/filter-pill.component";
import { FilterModel, FilterValues } from "src/app/shared/components/filter/filter-model";
import { FilterComponent } from "src/app/shared/components/filter/filter.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageFooterComponent } from "src/app/shared/components/page-footer/page-footer.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { DateRangePipe } from "src/app/shared/pipes/date-range.pipe";
import { TypographyPipe } from "src/app/shared/pipes/typography.pipe";
import { SDK } from "src/sdk";
import { EventsViewSwitchComponent } from "../../components/events-view-switch/events-view-switch.component";

type Camp = SDK.CampResponseWithLinks;

interface CampsYear {
	year: number;
	camps: Camp[];
	trips: Camp[];
}

const CAMP_TYPES: FilterPillOption[] = [
	{ value: SDK.EventKindsEnum.Tabor, label: EventKinds.tabor.plural },
	{ value: SDK.EventKindsEnum.Putak, label: EventKinds.putak.plural },
];

@UntilDestroy()
@Component({
	selector: "bo-camps-list",
	templateUrl: "./camps-list.component.html",
	styleUrl: "./camps-list.component.scss",
	imports: [
		DecimalPipe,
		NgTemplateOutlet,
		RouterLink,
		IonIcon,
		IonSkeletonText,
		EventGroupsComponent,
		EventsViewSwitchComponent,
		FilterComponent,
		FilterPillComponent,
		PageContentComponent,
		PageFooterComponent,
		PageHeaderComponent,
		DateRangePipe,
		TypographyPipe,
	],
	providers: [FilterModel],
})
export class CampsListComponent implements OnInit {
	camps = signal<Camp[] | undefined>(undefined);
	isDesktop = signal(true);
	search = signal("");
	types = signal<string[]>([]);

	typeOptions = CAMP_TYPES;
	campImage(camp: Camp) {
		if (camp.kind === "putak")
			return (camp.type && EventTypes[camp.type as EventTypeID]?.image) || EventKinds.putak.image;
		return EventKinds.tabor.image;
	}

	years = computed<CampsYear[] | undefined>(() => {
		const camps = this.camps();
		if (!camps) return undefined;

		const search = normalizeSearch(this.search());
		const types = this.types();
		const years = new Map<number, CampsYear>();

		for (const camp of camps) {
			if (types.length && !types.includes(camp.kind)) continue;
			if (search && !normalizeSearch(campSearchText(camp)).includes(search)) continue;

			const year = Number(camp.dateFrom.slice(0, 4));
			if (!years.has(year)) years.set(year, { year, camps: [], trips: [] });
			const item = years.get(year)!;

			if (camp.kind === SDK.EventKindsEnum.Putak) item.trips.push(camp);
			else item.camps.push(camp);
		}

		for (const item of years.values()) {
			item.camps.sort(byDate);
			item.trips.sort(byDate);
		}

		return [...years.values()].sort((a, b) => b.year - a.year);
	});

	private model = inject(FilterModel);

	constructor(
		private readonly api: ApiService,
		private readonly toastService: ToastService,
		private readonly route: ActivatedRoute,
		private readonly router: Router,
		platformService: PlatformService,
	) {
		addIcons({ imagesOutline, peopleOutline });
		platformService.isLg.pipe(untilDestroyed(this)).subscribe((isLg) => this.isDesktop.set(isLg));
	}

	ngOnInit() {
		this.route.queryParams.pipe(untilDestroyed(this)).subscribe((params) => this.onParams(params));
		this.model.apply$.pipe(untilDestroyed(this)).subscribe((filter) => this.applyFilter(filter));
		this.load();
	}

	ionViewWillEnter() {
		if (this.camps()) this.load();
	}

	setTypes(types: string[]) {
		this.model.set("druh", types);
	}

	private leadersFormat = new Intl.ListFormat("cs", { type: "conjunction" });

	leaderNames(camp: Camp) {
		return this.leadersFormat.format((camp.leaders ?? []).map((leader) => leader.nickname));
	}

	private onParams(params: Params) {
		const types = toList(params["druh"]);
		this.model.setCommitted({ druh: types });
		this.types.set(types);
		this.search.set(params["search"] ?? "");
	}

	private applyFilter(filter: FilterValues) {
		const types = toList(filter["druh"]);
		this.router.navigate([], {
			queryParams: { druh: types.length ? types.join(",") : null },
			queryParamsHandling: "merge",
			replaceUrl: true,
		});
	}

	private async load() {
		try {
			const camps = await this.api.EventsApi.listCamps().then((res) => res.data);
			this.camps.set(camps);
		} catch (e) {
			this.toastService.toast("Nepodařilo se načíst tábory.");
			this.camps.set([]);
		}
	}
}

function byDate(a: Camp, b: Camp) {
	return a.dateFrom.localeCompare(b.dateFrom) || a.id - b.id;
}

function campSearchText(camp: Camp) {
	return [camp.name, camp.campTheme, camp.river, camp.place, ...(camp.leaders ?? []).map((l) => l.nickname)]
		.filter(Boolean)
		.join(" ");
}

function normalizeSearch(text: string) {
	return text
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.trim();
}

function toList(value: unknown): string[] {
	if (Array.isArray(value)) return value.filter((item) => !!item).map((item) => String(item));
	if (!value) return [];
	return String(value)
		.split(",")
		.map((item) => item.trim())
		.filter((item) => !!item);
}

import { DatePipe, DecimalPipe, NgTemplateOutlet } from "@angular/common";
import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { ActivatedRoute, Params, Router, RouterLink } from "@angular/router";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import {
	InfiniteScrollCustomEvent,
	IonIcon,
	IonInfiniteScroll,
	IonInfiniteScrollContent,
	IonSkeletonText,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { documentTextOutline, imagesOutline, lockClosedOutline } from "ionicons/icons";
import { EventExpenseTypes } from "src/app/core/config/event-expense-types";
import { ApiService } from "src/app/core/services/api.service";
import { PlatformService } from "src/app/core/services/platform.service";
import { ToastService } from "src/app/core/services/toast.service";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { FilterPillComponent, FilterPillOption } from "src/app/shared/components/filter-pill/filter-pill.component";
import { FilterModel, FilterValues } from "src/app/shared/components/filter/filter-model";
import { FilterComponent } from "src/app/shared/components/filter/filter.component";
import { GroupBadgeComponent } from "src/app/shared/components/group-badge/group-badge.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { DateRangePipe } from "src/app/shared/pipes/date-range.pipe";
import { MarkdownPipe } from "src/app/shared/pipes/markdown.pipe";
import { PhotoImageUrlPipe } from "src/app/shared/pipes/photo-image-url.pipe";
import { getParamsKey } from "src/helpers/list-loading";
import { openPdf } from "src/helpers/open-pdf";
import { SDK } from "src/sdk";

const PAGE_SIZE = 20;

const UNTYPED_EXPENSE = { title: "Bez typu", color: "#b8bcc8" };

export interface ReportAccountingRow {
	title: string;
	color: string;
	total: number;
	perPersonDay: number;
}

@UntilDestroy()
@Component({
	selector: "bo-reports-list",
	templateUrl: "./reports-list.component.html",
	styleUrl: "./reports-list.component.scss",
	imports: [
		DatePipe,
		DecimalPipe,
		NgTemplateOutlet,
		RouterLink,
		IonIcon,
		IonInfiniteScroll,
		IonInfiniteScrollContent,
		IonSkeletonText,
		CardComponent,
		CardContentComponent,
		FilterComponent,
		FilterPillComponent,
		GroupBadgeComponent,
		PageContentComponent,
		PageHeaderComponent,
		DateRangePipe,
		MarkdownPipe,
		PhotoImageUrlPipe,
	],
	providers: [FilterModel],
})
export class ReportsListComponent implements OnInit {
	reports = signal<SDK.EventWithReportResponseWithLinks[] | undefined>(undefined);
	hasMore = signal(false);
	years = signal<string[]>([]);
	isDesktop = signal(true);

	yearOptions = computed<FilterPillOption[]>(() => this.years().map((year) => ({ value: year, label: year })));
	selectedYears = computed(() => toList(this.model.value("year")));

	private model = inject(FilterModel);
	private params: Params = {};
	private loadedParamsKey?: string;
	private loadRequest = 0;

	constructor(
		private readonly api: ApiService,
		private readonly toastService: ToastService,
		private readonly route: ActivatedRoute,
		private readonly router: Router,
		platformService: PlatformService,
	) {
		addIcons({ documentTextOutline, imagesOutline, lockClosedOutline });
		platformService.isLg.pipe(untilDestroyed(this)).subscribe((isLg) => this.isDesktop.set(isLg));
	}

	ngOnInit() {
		this.loadYears();
		this.route.queryParams.pipe(untilDestroyed(this)).subscribe((params) => this.onParams(params));
		this.model.apply$.pipe(untilDestroyed(this)).subscribe((filter) => this.applyFilter(filter));
	}

	setYears(years: string[]) {
		this.model.set("year", years);
	}

	private onParams(params: Params) {
		this.model.setCommitted({ year: toList(params["year"]) });

		const key = getParamsKey(params);
		if (key === this.loadedParamsKey) return;
		this.loadedParamsKey = key;

		this.params = params;
		this.reports.set(undefined);
		this.load();
	}

	private applyFilter(filter: FilterValues) {
		const years = toList(filter["year"]);
		this.router.navigate([], {
			queryParams: { year: years.length ? years.join(",") : null },
			queryParamsHandling: "merge",
			replaceUrl: true,
		});
	}

	private async loadYears() {
		const years = await this.api.EventsApi.listReportsYears()
			.then((res) => res.data.map((year) => String(year)))
			.catch(() => []);
		this.years.set(years);
	}

	async load(more = false) {
		const offset = more ? (this.reports()?.length ?? 0) : 0;
		const request = ++this.loadRequest;

		try {
			const reports = await this.api.EventsApi.listReports({
				limit: PAGE_SIZE,
				offset,
				search: this.params["search"] || undefined,
				year: toList(this.params["year"]).map((year) => parseInt(year, 10)),
			}).then((res) => res.data);
			if (request !== this.loadRequest) return;
			this.reports.set(more ? [...(this.reports() ?? []), ...reports] : reports);
			this.hasMore.set(reports.length === PAGE_SIZE);
		} catch (e) {
			this.toastService.toast("Reporty se nepodařilo načíst.", { color: "warning" });
			if (!more) this.reports.set([]);
		}
	}

	async onInfiniteScroll(e: InfiniteScrollCustomEvent) {
		try {
			await this.load(true);
		} finally {
			e.target.complete();
		}
	}

	accountingRows(report: SDK.EventWithReportResponseWithLinks): ReportAccountingRow[] {
		const personDays = this.personDays(report);
		return report.accounting.categories
			.filter((category) => category.total > 0)
			.map((category) => {
				const meta = (category.type && EventExpenseTypes[category.type]) || UNTYPED_EXPENSE;
				return {
					title: meta.title,
					color: meta.color,
					total: category.total,
					perPersonDay: personDays ? category.total / personDays : 0,
				};
			})
			.sort((a, b) => b.total - a.total);
	}

	async openChronicle(eventId: number, event: MouseEvent) {
		event.preventDefault();

		try {
			const response = await this.api.EventsApi.getEventReportChronicle(eventId, { responseType: "blob" });
			openPdf(response.data as unknown as Blob);
		} catch (e) {
			this.toastService.toast("Nepodařilo se otevřít kroniku.", { color: "warning" });
		}
	}

	personDays(report: SDK.EventWithReportResponseWithLinks) {
		return report.accounting.persons * report.accounting.days;
	}

	leaderNames(report: SDK.EventWithReportResponseWithLinks) {
		return (report.leaders ?? []).map((leader) => leader.nickname).join(", ");
	}
}

function toList(value: unknown): string[] {
	if (Array.isArray(value)) return value.filter((item) => !!item).map((item) => String(item));
	if (!value) return [];
	return String(value)
		.split(",")
		.map((item) => item.trim())
		.filter((item) => !!item);
}

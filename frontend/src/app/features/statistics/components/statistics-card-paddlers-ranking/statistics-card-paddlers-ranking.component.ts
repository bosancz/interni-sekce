import { DecimalPipe } from "@angular/common";
import { Component, computed, effect, input, signal } from "@angular/core";
import { IonIcon } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { happyOutline, peopleOutline } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { AdminTableCellDirective } from "src/app/shared/components/admin-table/admin-table-cell.directive";
import { AdminTableColumnComponent } from "src/app/shared/components/admin-table/admin-table-column.component";
import { AdminTableComponent } from "src/app/shared/components/admin-table/admin-table.component";
import { GroupBadgeComponent } from "src/app/shared/components/group-badge/group-badge.component";
import { SDK } from "src/sdk";
import { StatisticsLeaderboardCardComponent } from "../statistics-leaderboard-card/statistics-leaderboard-card.component";

export type PaddlersView = "children" | "leaders";

const PADDLERS_VIEWS: { name: PaddlersView; label: string; icon: string }[] = [
	{ name: "children", label: "Děti", icon: "happy-outline" },
	{ name: "leaders", label: "Vedoucí", icon: "people-outline" },
];

@Component({
	selector: "bo-statistics-card-paddlers-ranking",
	templateUrl: "./statistics-card-paddlers-ranking.component.html",
	styleUrls: ["./statistics-card-paddlers-ranking.component.scss"],

	imports: [
		DecimalPipe,
		IonIcon,
		AdminTableComponent,
		AdminTableColumnComponent,
		AdminTableCellDirective,
		GroupBadgeComponent,
		StatisticsLeaderboardCardComponent,
	],
})
export class StatisticsCardPaddlersRankingComponent {
	statistics = signal<SDK.PaddlersRankingResponse | undefined>(undefined);

	year = input.required<number>();

	view = signal<PaddlersView>("children");
	views = PADDLERS_VIEWS;

	canSeeRanking = computed(() => this.api.links()?.getPaddlersRanking?.allowed ?? false);

	paddlers = computed(() => this.statistics()?.[this.view()] ?? []);

	infoLines = [
		"Pořadí podle kilometrů ujetých na vodě na akcích daného roku.",
		"Dítě je člen mladší 15 let v době konání akce, mezi vedoucími jsou všichni ostatní včetně instruktorů.",
		"Počítají se jen skončené a nezrušené akce s vyplněnými kilometry na vodě.",
	];

	rowLink = (paddler: SDK.PaddlerResponse) => ["/databaze/clenove", paddler.memberId];

	trackBy = (_: number, paddler: SDK.PaddlerResponse) => paddler.memberId;

	constructor(private api: ApiService) {
		addIcons({ happyOutline, peopleOutline });

		effect(() => {
			const year = this.year();
			if (this.canSeeRanking()) this.loadStatistics(year);
		});
	}

	async loadStatistics(year: number) {
		this.statistics.set(undefined);

		const statistics = await this.api.StatisticsApi.getPaddlersRanking({ year }).then((res) => res.data);

		if (this.year() !== year) return;

		this.statistics.set(statistics);
	}
}

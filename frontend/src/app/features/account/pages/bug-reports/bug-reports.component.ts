import { DatePipe } from "@angular/common";
import { Component, OnInit, computed, signal } from "@angular/core";
import { IonBackButton, IonButtons, IonIcon } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { bugOutline, logoGithub } from "ionicons/icons";
import { ApiService } from "src/app/core/services/api.service";
import { BugReportService } from "src/app/core/services/bug-report.service";
import { Action } from "src/app/shared/components/action-buttons/action-buttons.component";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-bug-reports",
	templateUrl: "./bug-reports.component.html",
	styleUrls: ["./bug-reports.component.scss"],
	imports: [
		DatePipe,
		IonBackButton,
		IonButtons,
		IonIcon,
		PageHeaderComponent,
		PageContentComponent,
		CardComponent,
		CardContentComponent,
	],
})
export class BugReportsComponent implements OnInit {
	bugReports = signal<SDK.BugReportResponseWithLinks[] | undefined>(undefined);

	rows = computed(() =>
		this.bugReports()?.map((bugReport) => ({
			...bugReport,
			released: bugReport.state === "released",
			note: bugReport.releasedVersion ? `nasazeno ve verzi ${bugReport.releasedVersion}` : undefined,
		})),
	);

	actions = computed<Action[]>(() => [
		{
			text: "Nahlásit chybu",
			icon: "bug-outline",
			pinned: true,
			hidden: !this.api.links()?.sendBugReport?.allowed,
			handler: () => this.reportBug(),
		},
	]);

	constructor(
		private api: ApiService,
		private bugReportService: BugReportService,
	) {
		addIcons({ bugOutline, logoGithub });
	}

	ngOnInit() {
		this.loadBugReports();
	}

	async loadBugReports() {
		const bugReports = await this.api.FeedbackApi.listBugReports().then((res) => res.data);
		this.bugReports.set(bugReports);
	}

	async reportBug() {
		await this.bugReportService.reportBug();
		await this.loadBugReports();
	}
}

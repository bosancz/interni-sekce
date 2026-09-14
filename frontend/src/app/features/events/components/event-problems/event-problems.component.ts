import { Component, computed, effect, input, output, signal } from "@angular/core";
import { IonIcon, IonList, IonSkeletonText } from "@ionic/angular/standalone";
import { UntilDestroy } from "@ngneat/until-destroy";
import { addIcons } from "ionicons";
import { alertCircle, ellipse, helpCircle, warning } from "ionicons/icons";
import { HealthSeverities } from "src/app/core/config/health-severity";
import { ApiService } from "src/app/core/services/api.service";
import { ItemComponent } from "src/app/shared/components/item/item.component";
import { SDK } from "src/sdk";

interface HealthSummaryRow {
	memberId: number;
	memberName: string;
	problemName: string;
	severity: SDK.HealthSeverityEnum;
}

@UntilDestroy()
@Component({
	selector: "bo-event-problems",
	templateUrl: "./event-problems.component.html",
	styleUrls: ["./event-problems.component.scss"],
	imports: [IonList, IonSkeletonText, IonIcon, ItemComponent],
})
export class EventProblemsComponent {
	event = input<SDK.EventResponseWithLinks | null | undefined>();
	count = output<number | undefined>();

	readonly severities = HealthSeverities;

	attendees = signal<SDK.EventAttendeeResponseWithLinks[] | undefined>(undefined);

	allergies = computed<HealthSummaryRow[] | undefined>(() => this.buildRows("allergies"));
	problems = computed<HealthSummaryRow[] | undefined>(() => this.buildRows("knownProblems"));

	problemsCount = computed(() => {
		const allergies = this.allergies();
		const problems = this.problems();
		if (allergies === undefined || problems === undefined) return undefined;
		return allergies.length + problems.length;
	});

	constructor(private api: ApiService) {
		addIcons({ ellipse, alertCircle, warning, helpCircle });

		effect(() => {
			this.loadAttendees(this.event());
		});

		effect(() => this.count.emit(this.problemsCount()));
	}

	private async loadAttendees(event?: SDK.EventResponseWithLinks | null) {
		if (!event) {
			this.attendees.set(undefined);
			return;
		}

		const attendees = await this.api.EventsApi.listEventAttendees(event.id).then((res) => res.data);
		this.attendees.set(attendees);
	}

	private buildRows(field: "allergies" | "knownProblems"): HealthSummaryRow[] | undefined {
		const attendees = this.attendees();
		if (attendees === undefined) return undefined;

		const rows: HealthSummaryRow[] = [];

		for (const attendee of attendees) {
			const member = attendee.member;
			if (!member) continue;

			const memberName = member.nickname || member.firstName || member.lastName || "?";

			for (const entry of member[field] ?? []) {
				rows.push({ memberId: member.id, memberName, problemName: entry.name, severity: entry.severity });
			}
		}

		rows.sort(
			(a, b) =>
				this.severities[b.severity].order - this.severities[a.severity].order ||
				a.memberName.localeCompare(b.memberName),
		);

		return rows;
	}
}

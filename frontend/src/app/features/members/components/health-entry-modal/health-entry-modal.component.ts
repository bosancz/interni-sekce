import { AfterViewInit, Component, ElementRef, OnInit, signal, viewChild } from "@angular/core";
import { IonIcon, ModalController } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { alertCircle, checkmarkCircle, ellipse, helpCircle, warning } from "ionicons/icons";
import { DefaultHealthSeverity, HealthSeverities, HealthSeverityOrder } from "src/app/core/config/health-severity";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";
import { SDK } from "src/sdk";

@Component({
	selector: "bo-health-entry-modal",
	templateUrl: "./health-entry-modal.component.html",
	styleUrl: "./health-entry-modal.component.scss",
	imports: [IonIcon, ModalLayoutComponent],
})
export class HealthEntryModalComponent
	extends InputModalComponent<SDK.HealthEntryDto>
	implements OnInit, AfterViewInit
{
	header = "";
	placeholder = "";
	entry?: SDK.HealthEntryDto;

	readonly severities = HealthSeverities;
	readonly severityOrder = HealthSeverityOrder;

	name = signal("");
	severity = signal<SDK.HealthSeverityEnum>(DefaultHealthSeverity);

	private nameInput = viewChild<ElementRef<HTMLInputElement>>("nameInput");

	constructor(modalController: ModalController) {
		super(modalController);
		addIcons({ checkmarkCircle, ellipse, alertCircle, warning, helpCircle });
	}

	ngOnInit(): void {
		this.name.set(this.entry?.name ?? "");
		this.severity.set(this.entry?.severity ?? DefaultHealthSeverity);
	}

	ngAfterViewInit(): void {
		setTimeout(() => this.nameInput()?.nativeElement.focus(), 300);
	}

	save() {
		const name = this.name().trim();
		if (!name) return;
		this.submit.emit({ name, severity: this.severity() });
	}
}

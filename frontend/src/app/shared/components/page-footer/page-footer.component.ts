import { Component, input } from "@angular/core";
import { IonFooter, IonToolbar } from "@ionic/angular/standalone";

@Component({
	selector: "bo-page-footer",
	templateUrl: "./page-footer.component.html",
	styleUrls: ["./page-footer.component.scss"],

	imports: [IonFooter, IonToolbar],
})
export class PageFooterComponent {
	padding = input<boolean | undefined>();
}

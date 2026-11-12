import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from "@angular/core";

@Component({
	selector: "bo-section-header",
	templateUrl: "./section-header.component.html",
	styleUrl: "./section-header.component.scss",
	encapsulation: ViewEncapsulation.None,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionHeaderComponent {
	title = input.required<string>();
}

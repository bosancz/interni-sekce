import { Component, Input, OnInit } from "@angular/core";

@Component({
	selector: "bo-card",
	templateUrl: "./card.component.html",
	styleUrls: ["./card.component.scss"],
	standalone: false,
	host: {
		"[style]": "'--card-color: ' + (color || 'black')",
	},
})
export class CardComponent implements OnInit {
	@Input() title?: string;
	@Input() color?: string;

	constructor() {}

	ngOnInit(): void {}
}

import { Component, OnInit } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";
import { PageHeaderComponent } from "src/app/shared/components/page-header/page-header.component";

@Component({
	selector: "statistics",
	templateUrl: "./statistics.component.html",
	styleUrls: ["./statistics.component.scss"],

	imports: [RouterOutlet, RouterLink, RouterLinkActive, PageHeaderComponent, PageContentComponent],
})
export class StatisticsComponent implements OnInit {
	constructor() {}

	ngOnInit() {}
}

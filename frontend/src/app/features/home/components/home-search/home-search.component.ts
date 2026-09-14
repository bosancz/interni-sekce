import { Component } from "@angular/core";
import { GlobalSearchComponent } from "src/app/core/components/global-search/global-search.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";

@Component({
	selector: "bo-home-search",
	templateUrl: "./home-search.component.html",
	styleUrl: "./home-search.component.scss",

	imports: [PageContentComponent, GlobalSearchComponent],
})
export class HomeSearchComponent {}

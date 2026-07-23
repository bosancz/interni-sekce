import { Component } from "@angular/core";
import { GlobalSearchComponent } from "src/app/core/components/global-search/global-search.component";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";

/**
 * Full-screen global search, reached from the bottom tab bar on small screens. It shows the very
 * same searchbar and results as the header does, only in the page flow instead of a dropdown.
 */
@Component({
	selector: "bo-home-search",
	templateUrl: "./home-search.component.html",
	styleUrl: "./home-search.component.scss",

	imports: [PageContentComponent, GlobalSearchComponent],
})
export class HomeSearchComponent {}

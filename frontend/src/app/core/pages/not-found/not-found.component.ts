import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from "@angular/core";
import { Meta } from "@angular/platform-browser";
import { TitleService } from "src/app/core/services/title.service";
import { PageContentComponent } from "src/app/shared/components/page-content/page-content.component";

@Component({
	selector: "not-found",
	templateUrl: "./not-found.component.html",
	styleUrls: ["./not-found.component.scss"],
	imports: [PageContentComponent],
})
export class NotFoundComponent implements OnInit, OnDestroy {
	url?: string;

	constructor(
		private titleService: TitleService,
		private metaService: Meta,
	) {}

	ngOnInit() {
		this.setNoIndex();

		this.url = location.pathname || location.href;
	}

	ngOnDestroy() {
		this.removeNoIndex();
	}

	setNoIndex() {
		this.metaService.addTag({ name: "googlebot", content: "noindex" });
		this.metaService.addTag({ name: "robots", content: "noindex" });
	}

	removeNoIndex() {
		this.metaService.removeTag('name="googlebot"');
		this.metaService.removeTag('name="robots"');
	}
}

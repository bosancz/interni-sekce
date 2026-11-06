import { Injectable } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { RouterStateSnapshot, TitleStrategy } from "@angular/router";
import { ApiService } from "./api.service";

@Injectable({
	providedIn: "root",
})
export class TitleService extends TitleStrategy {
	private mainTitle: string = "Bošán";
	private routeTitle: string | null = null;
	private pageTitles = new Map<Element, string | null>();
	private activePage?: Element;

	constructor(
		private title: Title,
		private api: ApiService,
	) {
		super();
		this.api.info.subscribe((info) => {
			this.mainTitle = "Bošán" + (info?.environmentTitle ? " " + info.environmentTitle : "");
			this.render();
		});

		document.addEventListener("ionViewWillEnter", (event) => this.onPageEnter(event), true);
	}

	updateTitle(routerState: RouterStateSnapshot) {
		this.routeTitle = this.buildTitle(routerState) ?? null;
		this.render();
	}

	setPageTitle(el: Element, title: string | null) {
		this.pageTitles.delete(el);
		this.pageTitles.set(el, title);
		this.render();
	}

	removePageTitle(el: Element) {
		if (!this.pageTitles.delete(el)) return;
		this.render();
	}

	private onPageEnter(event: Event) {
		const page = event.target;
		if (!(page instanceof Element) || page.parentElement?.localName !== "ion-router-outlet") return;

		this.activePage = page;
		this.render();
	}

	private getPageTitle(): string | null | undefined {
		const page = this.activePage;
		if (!page?.isConnected) return undefined;

		let title: string | null | undefined;
		for (const [el, elTitle] of this.pageTitles) {
			if (page.contains(el)) title = elTitle;
		}
		return title;
	}

	private render() {
		const title = this.getPageTitle() || this.routeTitle;
		this.title.setTitle(title ? `${title} | ${this.mainTitle}` : this.mainTitle);
	}
}

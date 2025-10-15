import { Injectable } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { RouterStateSnapshot, TitleStrategy } from "@angular/router";
import { BackendApi } from "src/sdk/backend.client";

@Injectable({
	providedIn: "root",
})
export class TitleService extends TitleStrategy {
	private mainTitle: string = "Bošán interní";
	private subTitle: string | null = null;

	constructor(
		private title: Title,
		private api: BackendApi,
	) {
		super();
		this.api
			.GET("/api")
			.then((res) => res.data)
			.then((info) => {
				this.mainTitle = "Bošán interní" + (info?.environmentTitle ? " " + info.environmentTitle : "");
				this.setTitle(this.subTitle);
			});
	}

	setTitle(title: string | null) {
		this.subTitle = title;
		this.title.setTitle(title ? `${title} | ${this.mainTitle}` : this.mainTitle);
	}

	updateTitle(routerState: RouterStateSnapshot) {
		const title = this.buildTitle(routerState);

		this.setTitle(title ?? null);
	}
}

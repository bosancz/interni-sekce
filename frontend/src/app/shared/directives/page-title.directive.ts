import { AfterViewInit, Directive, effect, ElementRef, input, OnDestroy } from "@angular/core";
import { TitleService } from "src/app/core/services/title.service";

@Directive({
	selector: "[pageTitle]",
})
export class PageTitleDirective implements AfterViewInit, OnDestroy {
	pageTitle = input.required<string>();

	observer?: MutationObserver;

	constructor(
		private el: ElementRef<HTMLElement>,
		private titleService: TitleService,
	) {
		effect(() => {
			this.updateTitle();
		});
	}

	updateTitle() {
		this.titleService.setTitle(this.pageTitle() || this.el.nativeElement.textContent);
	}

	ngAfterViewInit() {
		this.observer = new MutationObserver((records) => {
			if (records.some((item) => item.type === "characterData")) this.updateTitle();
		});

		this.observer.observe(this.el.nativeElement, { characterData: true, subtree: true });
	}

	ngOnDestroy() {
		this.observer?.disconnect();
		this.titleService.setTitle(null);
	}
}

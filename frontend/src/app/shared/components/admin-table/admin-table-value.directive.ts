import { DestroyRef, Directive, ElementRef, inject } from "@angular/core";

@Directive({ selector: "[adminTableValue]" })
export class AdminTableValueDirective {
	constructor() {
		const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
		const update = () =>
			element.classList.toggle(
				"admin-table-value-filled",
				!!element.textContent?.trim() || !!element.querySelector("img, svg, ion-icon"),
			);
		const observer = new MutationObserver(update);
		observer.observe(element, { childList: true, subtree: true, characterData: true });
		queueMicrotask(update);
		inject(DestroyRef).onDestroy(() => observer.disconnect());
	}
}

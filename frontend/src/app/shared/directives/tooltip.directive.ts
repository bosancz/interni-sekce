import { Directive, ElementRef, HostListener, OnDestroy, input } from "@angular/core";

@Directive({
	selector: "[boTooltip]",
	host: { class: "bo-tooltip" },
})
export class TooltipDirective implements OnDestroy {
	boTooltip = input<string | null | undefined>();
	boTooltipPlacement = input<"top" | "bottom">("top");

	private tooltip?: HTMLElement;
	private readonly hideHandler = () => this.hide();

	constructor(private el: ElementRef<HTMLElement>) {
		blockDisabledClicks();
	}

	@HostListener("mouseenter")
	@HostListener("focusin")
	show() {
		const text = this.boTooltip()?.trim();
		if (!text || this.tooltip) return;

		const tooltip = document.createElement("div");
		tooltip.textContent = text;
		Object.assign(tooltip.style, {
			position: "fixed",
			zIndex: "20000",
			maxWidth: "16rem",
			padding: "0.3rem 0.55rem",
			borderRadius: "0.35rem",
			background: "var(--ion-color-dark, #1f1f1f)",
			color: "var(--ion-color-dark-contrast, #fff)",
			fontSize: "0.8125rem",
			lineHeight: "1.35",
			textAlign: "center",
			boxShadow: "0 2px 8px rgba(0, 0, 0, 0.25)",
			pointerEvents: "none",
		} satisfies Partial<CSSStyleDeclaration>);

		document.body.appendChild(tooltip);
		this.tooltip = tooltip;
		this.position(tooltip);

		window.addEventListener("scroll", this.hideHandler, true);
		window.addEventListener("resize", this.hideHandler);
	}

	@HostListener("mouseleave")
	@HostListener("focusout")
	@HostListener("click")
	hide() {
		this.tooltip?.remove();
		this.tooltip = undefined;

		window.removeEventListener("scroll", this.hideHandler, true);
		window.removeEventListener("resize", this.hideHandler);
	}

	ngOnDestroy() {
		this.hide();
	}

	private position(tooltip: HTMLElement) {
		const gap = 6;
		const host = this.el.nativeElement.getBoundingClientRect();
		const { width, height } = tooltip.getBoundingClientRect();

		const above = host.top - height - gap;
		const below = host.bottom + gap;
		const top = this.boTooltipPlacement() === "bottom" || above < gap ? below : above;

		const left = Math.min(
			Math.max(gap, host.left + host.width / 2 - width / 2),
			Math.max(gap, window.innerWidth - width - gap),
		);

		tooltip.style.top = `${top}px`;
		tooltip.style.left = `${left}px`;
	}
}

function blockDisabledClicks() {
	if (disabledClickGuard) return;
	disabledClickGuard = true;

	document.addEventListener(
		"click",
		(event) => {
			const target = event.target as HTMLElement | null;
			if (!target?.closest?.(".bo-tooltip.button-disabled")) return;

			event.stopImmediatePropagation();
			event.preventDefault();
		},
		true,
	);
}

let disabledClickGuard = false;

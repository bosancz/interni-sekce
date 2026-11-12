import { Component, ElementRef, EventEmitter, OnDestroy, signal, viewChild } from "@angular/core";
import { getElementName, getLightDomElement } from "src/helpers/dom-element";

interface HighlightBox {
	top: number;
	left: number;
	width: number;
	height: number;
	name: string;
}

const BLOCKED_EVENTS = ["pointerdown", "pointerup", "mousedown", "mouseup", "dblclick", "contextmenu", "auxclick"];

@Component({
	selector: "bo-element-picker",
	templateUrl: "./element-picker.component.html",
	styleUrl: "./element-picker.component.scss",
})
export class ElementPickerComponent implements OnDestroy {
	readonly done = new EventEmitter<Element | null>();

	readonly box = signal<HighlightBox | null>(null);

	private readonly bar = viewChild.required<ElementRef<HTMLElement>>("bar");

	private hovered: Element | null = null;

	private readonly onMove = (event: PointerEvent) => {
		if (this.isOnBar(event)) return;
		this.setHovered(getLightDomElement(event.composedPath()));
	};

	private readonly onBlocked = (event: Event) => {
		if (this.isOnBar(event)) return;

		if (event.type === "pointerdown") this.setHovered(getLightDomElement(event.composedPath()));

		event.preventDefault();
		event.stopImmediatePropagation();
	};

	private readonly onClick = (event: MouseEvent) => {
		if (this.isOnBar(event)) return;

		event.preventDefault();
		event.stopImmediatePropagation();

		const element = getLightDomElement(event.composedPath());
		if (element) this.done.emit(element);
	};

	private readonly onKeyDown = (event: KeyboardEvent) => {
		if (event.key !== "Escape") return;

		event.preventDefault();
		event.stopImmediatePropagation();
		this.cancel();
	};

	private readonly onScroll = () => this.setHovered(this.hovered);

	constructor(private readonly host: ElementRef<HTMLElement>) {
		window.addEventListener("pointermove", this.onMove, true);
		window.addEventListener("click", this.onClick, true);
		window.addEventListener("keydown", this.onKeyDown, true);
		window.addEventListener("scroll", this.onScroll, true);
		window.addEventListener("resize", this.onScroll);
		BLOCKED_EVENTS.forEach((type) => window.addEventListener(type, this.onBlocked, true));
		document.body.classList.add("bo-element-picking");
	}

	ngOnDestroy() {
		window.removeEventListener("pointermove", this.onMove, true);
		window.removeEventListener("click", this.onClick, true);
		window.removeEventListener("keydown", this.onKeyDown, true);
		window.removeEventListener("scroll", this.onScroll, true);
		window.removeEventListener("resize", this.onScroll);
		BLOCKED_EVENTS.forEach((type) => window.removeEventListener(type, this.onBlocked, true));
		document.body.classList.remove("bo-element-picking");
	}

	cancel() {
		this.done.emit(null);
	}

	private setHovered(element: Element | null) {
		if (element && this.host.nativeElement.contains(element)) element = null;

		this.hovered = element;

		if (!element) {
			this.box.set(null);
			return;
		}

		const rect = element.getBoundingClientRect();

		this.box.set({
			top: rect.top,
			left: rect.left,
			width: rect.width,
			height: rect.height,
			name: getElementName(element),
		});
	}

	private isOnBar(event: Event) {
		return event.composedPath().includes(this.bar().nativeElement);
	}
}

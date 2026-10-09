import { Directive, ElementRef, HostListener, input, OnDestroy } from "@angular/core";
import { isPhotoPending, waitForImage } from "src/helpers/photo-thumbnails";

const PLACEHOLDER =
	"data:image/svg+xml;utf8," +
	encodeURIComponent(
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80"><rect width="120" height="80" fill="#8882"/><g fill="none" stroke="#8888" stroke-width="2" stroke-linecap="round"><circle cx="60" cy="40" r="10"/><path d="M60 34v6l4 3"/></g></svg>`,
	);

@Directive({
	selector: "img[boPhotoPending]",
})
export class PhotoPendingDirective implements OnDestroy {
	boPhotoPending = input<{ thumbnailsAt?: string | null } | null | undefined>();

	private abort?: AbortController;
	private placeholderSrc?: string;

	constructor(private el: ElementRef<HTMLImageElement>) {}

	@HostListener("error")
	async onError() {
		const img = this.el.nativeElement;
		if (!isPhotoPending(this.boPhotoPending()) || img.src === this.placeholderSrc) return;

		const url = img.src;
		this.abort?.abort();
		const abort = (this.abort = new AbortController());

		img.src = PLACEHOLDER;
		const placeholderSrc = (this.placeholderSrc = img.src);

		const ready = await waitForImage(url, abort.signal);
		if (abort.signal.aborted || img.src !== placeholderSrc) return;

		if (ready) img.src = url;
	}

	ngOnDestroy() {
		this.abort?.abort();
	}
}

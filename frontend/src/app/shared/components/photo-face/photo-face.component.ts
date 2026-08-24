import { NgStyle } from "@angular/common";
import { Component, effect, input } from "@angular/core";
import { DomSanitizer, SafeStyle } from "@angular/platform-browser";

@Component({
	selector: "photo-face",
	templateUrl: "./photo-face.component.html",
	styleUrls: ["./photo-face.component.scss"],

	imports: [NgStyle],
})
export class PhotoFaceComponent {
	src = input.required<string>();
	rectangle = input.required<{ x: number; y: number; height: number; width: number }>();
	size = input.required<number>();

	style: any = {};
	backgroundStyle?: SafeStyle;

	constructor(private sanitizer: DomSanitizer) {
		effect(() => {
			const src = this.src();
			const rectangle = this.rectangle();
			const size = this.size();

			this.style = {
				width: size + "px",
				height: size + "px",
				"border-radius": size / 2 + "px",
				"background-image": "url(" + src + ")",
				"background-size":
					rectangle.width > rectangle.height
						? (size * 1) / rectangle.width + "px auto"
						: "auto " + (size * 1) / rectangle.height + "px",
			};

			this.backgroundStyle = this.sanitizer.bypassSecurityTrustStyle(
				"calc(" +
					rectangle.x * 100 +
					"% - " +
					rectangle.x * size +
					"px) calc(" +
					rectangle.y * 100 +
					"% - " +
					rectangle.y * size +
					"px)",
			);
		});
	}
}

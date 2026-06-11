import { Pipe, PipeTransform } from "@angular/core";
import { Config } from "src/config";

export type PhotoImageSize = "small" | "big" | "original";

@Pipe({
	name: "photoImageUrl",
	standalone: true,
})
export class PhotoImageUrlPipe implements PipeTransform {
	constructor(private config: Config) {}

	transform(photo: { id: number } | undefined | null, size: PhotoImageSize = "big"): string {
		if (!photo) return "";
		return `${this.config.apiRoot}api/photos/${photo.id}/image/${size}`;
	}
}

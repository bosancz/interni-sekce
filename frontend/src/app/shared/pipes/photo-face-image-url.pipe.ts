import { Pipe, PipeTransform } from "@angular/core";
import { Config } from "src/config";

@Pipe({
	name: "photoFaceImageUrl",
	standalone: true,
})
export class PhotoFaceImageUrlPipe implements PipeTransform {
	constructor(private config: Config) {}

	transform(face: { id: number; photoId: number } | undefined | null): string {
		if (!face) return "";
		return `${this.config.apiRoot}api/photos/${face.photoId}/faces/${face.id}/image`;
	}
}

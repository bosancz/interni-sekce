import { Pipe, PipeTransform } from "@angular/core";
import { fixTypography } from "src/helpers/typography";

@Pipe({
	name: "typography",
})
export class TypographyPipe implements PipeTransform {
	transform(value: string | null | undefined): string {
		return fixTypography(value) ?? "";
	}
}

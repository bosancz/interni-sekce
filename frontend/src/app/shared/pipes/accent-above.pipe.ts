import { Pipe, PipeTransform } from "@angular/core";
import { hasAccentAbove } from "src/helpers/initials";

@Pipe({
	name: "accentAbove",
})
export class AccentAbovePipe implements PipeTransform {
	transform(text: string | null | undefined): boolean {
		return hasAccentAbove(text);
	}
}

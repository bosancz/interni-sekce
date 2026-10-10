import { Pipe, PipeTransform } from "@angular/core";
import { Config } from "src/config";

@Pipe({
	name: "groupProfilePhotoUrl",
	standalone: true,
})
export class GroupProfilePhotoUrlPipe implements PipeTransform {
	constructor(private config: Config) {}

	transform(group: { id: number; profilePhotoUpdatedAt?: string | null } | undefined | null): string | null {
		if (!group?.profilePhotoUpdatedAt) return null;
		const version = new Date(group.profilePhotoUpdatedAt).getTime();
		return `${this.config.apiRoot}api/groups/${group.id}/profile-photo?v=${version}`;
	}
}

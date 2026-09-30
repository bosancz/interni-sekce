import { Pipe, PipeTransform } from "@angular/core";
import { Config } from "src/config";

@Pipe({
	name: "memberProfilePhotoUrl",
	standalone: true,
})
export class MemberProfilePhotoUrlPipe implements PipeTransform {
	constructor(private config: Config) {}

	transform(member: { id: number; profilePhotoUpdatedAt?: string | null } | undefined | null): string | null {
		if (!member?.profilePhotoUpdatedAt) return null;
		const version = new Date(member.profilePhotoUpdatedAt).getTime();
		return `${this.config.apiRoot}api/members/${member.id}/profile-photo?v=${version}`;
	}
}

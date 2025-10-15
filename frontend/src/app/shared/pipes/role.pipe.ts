import { Pipe, PipeTransform } from "@angular/core";
import { MemberRoleMetadata, MemberRoles } from "src/app/config/member-roles";
import { BackendApiTypes } from "src/sdk/backend.client";

type RolePipeProperty = "code";

@Pipe({
	name: "role",
	pure: false,
	standalone: false,
})
export class RolePipe implements PipeTransform {
	roles = MemberRoles;

	defaultProperties: Required<MemberRoleMetadata> = {
		genitiv: "",
		code: "?",
		title: "",
	};

	constructor() {}

	transform(roleId: BackendApiTypes.MemberRolesEnum | undefined, property: RolePipeProperty): string {
		if (!roleId) return this.defaultProperties[property];
		if (!(roleId in this.roles)) return this.defaultProperties[property];

		switch (property) {
			case "code":
				return this.roles[roleId][property] ?? "";

			default:
				return "?";
		}
	}
}

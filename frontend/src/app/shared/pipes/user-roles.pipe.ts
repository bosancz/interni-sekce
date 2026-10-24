import { Pipe, PipeTransform } from "@angular/core";
import { getAssignedRoles, getShownRoles } from "src/app/core/config/user-roles";
import { SDK } from "src/sdk";

@Pipe({
	name: "userRoles",
})
export class UserRolesPipe implements PipeTransform {
	transform(roles: SDK.UserRolesEnum[] | null | undefined, filter: "assigned"): SDK.UserSavedRolesEnum[];
	transform(roles: SDK.UserRolesEnum[] | null | undefined, filter: "shown"): SDK.UserRolesEnum[];
	transform(roles: SDK.UserRolesEnum[] | null | undefined, filter: "assigned" | "shown"): SDK.UserRolesEnum[] {
		return filter === "assigned" ? getAssignedRoles(roles) : getShownRoles(roles);
	}
}

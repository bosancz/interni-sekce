import { Pipe, PipeTransform } from "@angular/core";
import { getDefaultContact } from "src/helpers/member-contacts";
import { SDK } from "src/sdk";

@Pipe({
	name: "defaultContact",
})
export class DefaultContactPipe implements PipeTransform {
	transform(contacts?: SDK.MemberContact[] | null): SDK.MemberContact | undefined {
		return getDefaultContact(contacts);
	}
}

import { Pipe, PipeTransform } from "@angular/core";
import { SDK } from "src/sdk";

@Pipe({
	name: "defaultContact",
})
export class DefaultContactPipe implements PipeTransform {
	transform(contacts?: SDK.MemberContact[] | null): SDK.MemberContact | undefined {
		if (!contacts?.length) return undefined;
		return contacts.find((contact) => contact.isDefault) ?? contacts[0];
	}
}

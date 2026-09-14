import { Permission } from "src/access-control/schema/route-acl";
import { RootResponse } from "src/api/root/dto/root-response";
import { PaymentSettingsResponse } from "../dto/payment-settings.dto";

/**
 * Who may see the club's bank account. Same audience as the members database itself
 * (`vedouci`), since the settings are only ever shown next to a member's payment card.
 */
export const PaymentSettingsReadPermission = new Permission<void>({
	linkTo: RootResponse,
	contains: PaymentSettingsResponse,

	allowed: {
		vedouci: true,
	},
});

/**
 * Who may change the bank account and the fee. Reserved for admins — the same audience the
 * treasurer view as a whole is meant for, and the link the frontend gates that page on.
 */
export const PaymentSettingsUpdatePermission = new Permission<void>({
	linkTo: RootResponse,

	allowed: {
		admin: true,
	},
});

import { Routes } from "@angular/router";

import { linkGuard } from "src/app/core/guards/link.guard";

import { AdminHomeComponent } from "./pages/admin-home/admin-home.component";
import { PaymentSettingsComponent } from "./pages/payment-settings/payment-settings.component";
import { TreasurerListComponent } from "./pages/treasurer-list/treasurer-list.component";
import { UsersCreateComponent } from "./pages/users-create/users-create.component";
import { UsersEditComponent } from "./pages/users-edit/users-edit.component";
import { UsersListComponent } from "./pages/users-list/users-list.component";
import { UsersViewComponent } from "./pages/users-view/users-view.component";

// The user-management pages are gated on the `listUsers` link so that someone who can reach `/admin`
// only for the program section cannot open them by typing the URL.
const canAccessUsers = [linkGuard("listUsers")];

// The treasurer view records the membership fees and the payment settings hold the club's bank
// account, so both are admin-only. `updatePaymentSettings` is the root link the backend grants to
// admins alone, so it is what they are gated on.
const canAccessTreasurer = [linkGuard("updatePaymentSettings")];

export const adminRoutes: Routes = [
	{ path: "", component: AdminHomeComponent },

	{ path: "pokladna", title: "Pokladna", component: TreasurerListComponent, canMatch: canAccessTreasurer },
	{
		path: "platebni-udaje",
		title: "Platební údaje",
		component: PaymentSettingsComponent,
		canMatch: canAccessTreasurer,
	},

	{ path: "uzivatele", component: UsersListComponent, canMatch: canAccessUsers },
	{ path: "uzivatele/vytvorit", component: UsersCreateComponent, canMatch: canAccessUsers },
	{ path: "uzivatele/:user", component: UsersViewComponent, canMatch: canAccessUsers },
	{ path: "uzivatele/:user/upravit", component: UsersEditComponent, canMatch: canAccessUsers },
];

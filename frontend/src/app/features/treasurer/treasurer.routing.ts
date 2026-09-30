import { Routes } from "@angular/router";

import { PaymentSettingsComponent } from "./pages/payment-settings/payment-settings.component";
import { TreasurerListComponent } from "./pages/treasurer-list/treasurer-list.component";

export const treasurerRoutes: Routes = [
	{ path: "", component: TreasurerListComponent },
	{ path: "platebni-udaje", title: "Platební údaje", component: PaymentSettingsComponent },
];

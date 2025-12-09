import { Component } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { map } from "rxjs";
import { ApiService } from "src/app/services/api.service";

@Component({
	selector: "bo-version",
	standalone: false,
	templateUrl: "./version.component.html",
	styleUrl: "./version.component.scss",
})
export class VersionComponent {
	version = toSignal(this.api.info.pipe(map((info) => info.version)));
	environment = toSignal(this.api.info.pipe(map((info) => info.environmentTitle)));

	constructor(private readonly api: ApiService) {}
}

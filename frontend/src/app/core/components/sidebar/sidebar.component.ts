import { Component, EventEmitter, OnInit, Output } from "@angular/core";

@Component({
	selector: "bo-sidebar",
	templateUrl: "./sidebar.component.html",
	styleUrls: ["./sidebar.component.scss"],
	standalone: false,
})
export class SidebarComponent implements OnInit {
	@Output() close = new EventEmitter();

	environment?: string;
	version?: string;

	constructor(private api: BackendApi) {}

	ngOnInit(): void {
		this.loadEnvironment();
	}

	private async loadEnvironment() {
		const apiInfo = await this.api.RootApi.getApiInfo().then((res) => res.data);
		this.environment = apiInfo.environmentTitle;
		this.version = apiInfo.version;
	}
}

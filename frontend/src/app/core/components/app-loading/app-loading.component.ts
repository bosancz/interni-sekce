import { Component } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { map, timer } from "rxjs";

@Component({
	selector: "bo-app-loading",
	templateUrl: "./app-loading.component.html",
	styleUrls: ["./app-loading.component.scss"],
})
export class AppLoadingComponent {
	ellipsis = toSignal(timer(0, 1000).pipe(map((i) => ".".repeat(i%4))));
}

import { ApplicationRef, createComponent, EnvironmentInjector, Injectable } from "@angular/core";
import { ElementPickerComponent } from "../components/element-picker/element-picker.component";

@Injectable({
	providedIn: "root",
})
export class ElementPickerService {
	constructor(
		private appRef: ApplicationRef,
		private injector: EnvironmentInjector,
	) {}

	pick(): Promise<Element | null> {
		return new Promise((resolve) => {
			const ref = createComponent(ElementPickerComponent, { environmentInjector: this.injector });

			this.appRef.attachView(ref.hostView);
			document.body.appendChild(ref.location.nativeElement);

			ref.instance.done.subscribe((element) => {
				this.appRef.detachView(ref.hostView);
				ref.destroy();
				resolve(element);
			});
		});
	}
}

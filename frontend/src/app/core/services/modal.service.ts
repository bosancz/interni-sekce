import { EventEmitter, Injectable, TemplateRef, Type } from "@angular/core";
import { AlertController, ModalController, ModalOptions } from "@ionic/angular/standalone";
import { ComponentProps, TextFieldTypes } from "@ionic/core";
import { ModalTemplateComponent } from "../../shared/components/modal-template/modal-template.component";

// overlays we can present, back-close and dismiss uniformly
type DismissableOverlay = HTMLIonModalElement | HTMLIonAlertElement;

interface BaseModalOptions {
	header?: string;
	buttonText?: string;
}

interface DeleteConfirmationModalOptions extends BaseModalOptions {}

interface InputModalOptions<D extends Record<string, any>> extends BaseModalOptions {
	inputs: { [K in keyof D]: InputModalInput<D[K]> };
}

export interface InputModalInput<T> {
	name?: string;
	type?: T extends number
		? "number"
		: T extends boolean
			? "checkbox"
			: Exclude<TextFieldTypes, "number"> | "textarea";
	placeholder?: string;
	value?: T;
}

interface SelectModalOptions<D> extends BaseModalOptions {
	values: { label: string; value: D }[];
	value?: D;
}

interface MultiSelectModalOptions<D> extends BaseModalOptions {
	values: { label: string; value: D }[];
	value?: D[];
}

export class InputModalComponent<D = any> {
	submit = new EventEmitter<D>();
	close = new EventEmitter<void>();

	constructor(modalCtrl: ModalController) {
		this.submit.subscribe((data) => modalCtrl.dismiss(data));
		this.close.subscribe(() => modalCtrl.dismiss(null));
	}
}

type ModalComponentData<C extends InputModalComponent> = C extends { submit: EventEmitter<infer D> } ? D : never;

@Injectable({
	providedIn: "root",
})
export class ModalService {
	// overlays (modals + alerts) kept open by a synthetic history entry, top-most last
	private backStack: DismissableOverlay[] = [];
	private popstateListenerBound = false;
	// set right before we pop our own synthetic entry, so the resulting popstate
	// (from closing an overlay by button/submit) is not treated as a user back-press
	private suppressPopstate = false;

	constructor(
		private alertController: AlertController,
		private modalController: ModalController,
	) {}

	/**
	 * Creates a modal, presents it with browser-back-to-close wired up, and returns
	 * the modal handle. Use this for modals that need the element itself (e.g. to
	 * dismiss them externally); prefer {@link componentModal} when you only need the
	 * dismiss result.
	 */
	async modal<C>(
		component: Type<C>,
		componentProps?: ComponentProps<C>,
		options: Omit<ModalOptions<Type<C>>, "component" | "componentProps"> = {},
	): Promise<HTMLIonModalElement> {
		const modal = await this.modalController.create({ component, componentProps, ...options });
		await this.presentWithBackClose(modal);
		return modal;
	}

	/**
	 * Presents an overlay (modal or alert) and wires the browser back button to close
	 * it with no data (the same result as cancelling). On present we push a synthetic
	 * history entry pointing at the current URL; a back-press then consumes that entry
	 * — closing the overlay without navigating the page. When the overlay is instead
	 * closed from within (button/submit/backdrop) we consume the same entry ourselves
	 * so the history stays balanced and the page never moves.
	 */
	private async presentWithBackClose(overlay: DismissableOverlay) {
		this.ensurePopstateListener();

		// URL at the moment we push the synthetic entry, so we can tell on close whether a
		// control inside the overlay moved the page in the meantime.
		const urlAtPresent = window.location.href;
		history.pushState(history.state, "");
		this.backStack.push(overlay);

		overlay.onDidDismiss().then(() => {
			const index = this.backStack.indexOf(overlay);
			if (index === -1) return; // already removed by the back-navigation path

			// closed from within: drop the synthetic entry we added on present
			this.backStack.splice(index, 1);

			// If the overlay wrote to the URL while it was open (e.g. the immediate filter
			// modal saving the selected filters to the query params with `replaceUrl`), our
			// synthetic entry has been overwritten with that new URL and the entry beneath it
			// still holds the pre-open URL. Calling history.back() here would navigate to that
			// stale URL and silently revert the change (issue #293). Only balance the history
			// when the page hasn't moved; otherwise keep the new URL and leave the extra entry,
			// so the browser back button simply undoes the filter change.
			if (window.location.href === urlAtPresent) {
				this.suppressPopstate = true;
				history.back();
			}
		});

		await overlay.present();
	}

	private ensurePopstateListener() {
		if (this.popstateListenerBound) return;
		this.popstateListenerBound = true;

		window.addEventListener("popstate", () => {
			if (this.suppressPopstate) {
				this.suppressPopstate = false;
				return;
			}

			// user pressed back: close the top-most overlay with no data
			this.backStack.pop()?.dismiss();
		});
	}

	async deleteConfirmationModal(message: string, options: DeleteConfirmationModalOptions = {}) {
		return new Promise<boolean>(async (resolve, reject) => {
			const alert = await this.alertController.create({
				header: options.header ?? "Opravdu smazat?",
				message,
				buttons: [
					{
						text: "Zrušit",
						role: "cancel",
						handler: () => resolve(false),
					},
					{
						text: options.buttonText ?? "Smazat",
						role: "destructive",
						handler: () => resolve(true),
					},
				],
			});

			// back / backdrop dismissal counts as cancel
			alert.onDidDismiss().then(() => resolve(false));
			await this.presentWithBackClose(alert);
		});
	}

	async inputModal<D extends Record<string, any>>(options: InputModalOptions<D>) {
		return new Promise<D | null>(async (resolve, reject) => {
			const alert = await this.alertController.create({
				header: options.header,
				inputs: Object.entries(options.inputs).map(([name, input]) => ({ ...input, name })),
				buttons: [
					{
						text: "Zrušit",
						role: "cancel",
					},
					{
						text: options.buttonText ?? "Uložit",
						handler: (data) => resolve(data),
					},
				],
			});

			// back / backdrop dismissal counts as cancel
			alert.onDidDismiss().then(() => resolve(null));
			await this.presentWithBackClose(alert);
		});
	}

	async wideInputModal<D extends Record<string, any>>(options: InputModalOptions<D>) {
		return new Promise<D | null>(async (resolve, reject) => {
			const alert = await this.alertController.create({
				header: options.header,
				cssClass: "alert-wide", // <--- Automatically applies the wide style
				inputs: Object.entries(options.inputs).map(([name, input]) => ({ ...input, name })),
				buttons: [
					{
						text: "Zrušit",
						role: "cancel",
					},
					{
						text: options.buttonText ?? "Uložit",
						handler: (data) => resolve(data),
					},
				],
			});

			// back / backdrop dismissal counts as cancel
			alert.onDidDismiss().then(() => resolve(null));
			await this.presentWithBackClose(alert);
		});
	}

	async selectModal<D>(options: SelectModalOptions<D>) {
		return new Promise<D | null>(async (resolve, reject) => {
			const alert = await this.alertController.create({
				header: options.header,
				inputs: options.values.map((item) => ({
					...item,
					type: "radio",
					checked: item.value === options.value,
				})),
				buttons: [
					{
						text: "Zrušit",
						role: "cancel",
					},
					{
						text: options.buttonText ?? "Vybrat",
						handler: (data) => resolve(data),
					},
				],
			});

			// back / backdrop dismissal counts as cancel
			alert.onDidDismiss().then(() => resolve(null));
			await this.presentWithBackClose(alert);
		});
	}

	async multiSelectModal<D>(options: MultiSelectModalOptions<D>) {
		return new Promise<D[] | null>(async (resolve, reject) => {
			const alert = await this.alertController.create({
				header: options.header,
				inputs: options.values.map((item) => ({
					...item,
					type: "checkbox",
					checked: options.value?.includes(item.value),
				})),
				buttons: [
					{
						text: "Zrušit",
						role: "cancel",
					},
					{
						text: options.buttonText ?? "Uložit",
						handler: (data) => resolve(data),
					},
				],
			});

			// back / backdrop dismissal counts as cancel
			alert.onDidDismiss().then(() => resolve(null));
			await this.presentWithBackClose(alert);
		});
	}

	async componentModal<C extends InputModalComponent>(
		component: Type<C>,
		componentProps?: ComponentProps<C>,
		options: Omit<ModalOptions<Type<C>>, "component" | "componentProps"> = {},
	) {
		const classes = ["dialog"];

		if (options.cssClass)
			Array.isArray(options.cssClass) ? classes.push(...options.cssClass) : classes.push(options.cssClass);

		return new Promise<ModalComponentData<C> | null>(async (resolve, reject) => {
			const modal = await this.modalController.create({
				component,
				componentProps,
				...options,

				cssClass: classes.join(" "),
			});

			modal.onWillDismiss().then((ev) => resolve(ev.data ?? null));

			await this.presentWithBackClose(modal);
		});
	}

	async templateModal(template: TemplateRef<any>) {
		return new Promise<void>(async (resolve, reject) => {
			const modal = await this.modalController.create({
				component: ModalTemplateComponent,
				componentProps: { template },
				cssClass: "dialog",
			});

			modal.onWillDismiss().then(() => resolve());

			await this.presentWithBackClose(modal);
		});
	}
}

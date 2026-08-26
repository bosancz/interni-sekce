import { EventEmitter, Injectable, TemplateRef, Type } from "@angular/core";
import { NavigationCancel, NavigationEnd, NavigationSkipped, Router } from "@angular/router";
import { AlertController, ModalController, ModalOptions } from "@ionic/angular/standalone";
import { ComponentProps, TextFieldTypes } from "@ionic/core";
import { firstValueFrom } from "rxjs";
import { filter, take } from "rxjs/operators";
import { ModalTemplateComponent } from "../../shared/components/modal-template/modal-template.component";

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
	private backStack: DismissableOverlay[] = [];
	private popstateListenerBound = false;
	private suppressPopstate = false;

	constructor(
		private alertController: AlertController,
		private modalController: ModalController,
		private router: Router,
	) {}

	async modal<C>(
		component: Type<C>,
		componentProps?: ComponentProps<C>,
		options: Omit<ModalOptions<Type<C>>, "component" | "componentProps"> = {},
	): Promise<HTMLIonModalElement> {
		const modal = await this.modalController.create({ component, componentProps, ...options });
		await this.presentWithBackClose(modal);
		return modal;
	}

	private async presentWithBackClose(overlay: DismissableOverlay) {
		this.ensurePopstateListener();

		history.pushState(history.state, "");
		this.backStack.push(overlay);

		overlay.onDidDismiss().then(() => {
			const index = this.backStack.indexOf(overlay);
			if (index === -1) return;

			this.backStack.splice(index, 1);
			this.suppressPopstate = true;
			history.back();
		});

		await overlay.present();
	}

	private async waitForBackCloseToSettle(overlay: DismissableOverlay): Promise<void> {
		await overlay.onDidDismiss();
		const settled = firstValueFrom(
			this.router.events.pipe(
				filter(
					(event) =>
						event instanceof NavigationEnd ||
						event instanceof NavigationSkipped ||
						event instanceof NavigationCancel,
				),
				take(1),
			),
		).then(() => undefined);
		const fallback = new Promise<void>((resolve) => setTimeout(resolve, 700));
		await Promise.race([settled, fallback]);
	}

	private ensurePopstateListener() {
		if (this.popstateListenerBound) return;
		this.popstateListenerBound = true;

		window.addEventListener("popstate", () => {
			if (this.suppressPopstate) {
				this.suppressPopstate = false;
				return;
			}

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

			alert.onDidDismiss().then(() => resolve(null));
			await this.presentWithBackClose(alert);
		});
	}

	async wideInputModal<D extends Record<string, any>>(options: InputModalOptions<D>) {
		return new Promise<D | null>(async (resolve, reject) => {
			const alert = await this.alertController.create({
				header: options.header,
				cssClass: "alert-wide",
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

			const data = modal.onWillDismiss().then((ev) => ev.data ?? null);

			await this.presentWithBackClose(modal);

			await this.waitForBackCloseToSettle(modal);
			resolve(await data);
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

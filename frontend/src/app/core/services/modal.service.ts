import { EventEmitter, Injectable, TemplateRef, Type } from "@angular/core";
import { NavigationCancel, NavigationEnd, NavigationExtras, NavigationSkipped, Router } from "@angular/router";
import { ModalController, ModalOptions } from "@ionic/angular/standalone";
import { ComponentProps } from "@ionic/core";
import { firstValueFrom } from "rxjs";
import { filter, take } from "rxjs/operators";
import {
	BrandDialogComponent,
	BrandDialogInput,
	BrandDialogInputType,
	BrandDialogOption,
} from "../../shared/components/brand-dialog/brand-dialog.component";
import { ModalTemplateComponent } from "../../shared/components/modal-template/modal-template.component";
import { InputModalComponent } from "./input-modal";

type DismissableOverlay = HTMLIonModalElement;

interface BaseModalOptions {
	header?: string;
	buttonText?: string;
}

interface DeleteConfirmationModalOptions extends BaseModalOptions {}

interface InputModalOptions<D extends Record<string, any>> extends BaseModalOptions {
	message?: string;
	large?: boolean;
	inputs: { [K in keyof D]: InputModalInput<D[K]> };
}

export interface InputModalInput<T> {
	label?: string;
	type?: T extends number ? "number" : Exclude<BrandDialogInputType, "number">;
	placeholder?: string;
	value?: T;
	required?: boolean;
	autocapitalize?: string;
}

interface SelectModalOptions<D> extends BaseModalOptions {
	message?: string;
	values: BrandDialogOption<D>[];
	value?: D;
}

interface MultiSelectModalOptions<D> extends BaseModalOptions {
	message?: string;
	values: BrandDialogOption<D>[];
	value?: D[];
}

export { InputModalComponent };

type ModalComponentData<C extends InputModalComponent> = C extends { submit: EventEmitter<infer D> } ? D : never;

@Injectable({
	providedIn: "root",
})
export class ModalService {
	private backStack: DismissableOverlay[] = [];
	private popstateListenerBound = false;
	private suppressPopstate = false;

	constructor(
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

	async dismissAndNavigate(overlay: DismissableOverlay, commands: any[], extras?: NavigationExtras) {
		const settled = this.waitForBackCloseToSettle(overlay);
		await overlay.dismiss();
		await settled;
		return this.router.navigate(commands, extras);
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

	async alertModal(message: string, options: BaseModalOptions = {}) {
		await this.dialog({
			header: options.header,
			message,
			cancelText: null,
			confirmText: options.buttonText ?? "Rozumím",
		});
	}

	async confirmationModal(message: string, options: BaseModalOptions = {}) {
		const result = await this.dialog({
			header: options.header,
			message,
			confirmText: options.buttonText ?? "Pokračovat",
		});
		return result === true;
	}

	async deleteConfirmationModal(message: string, options: DeleteConfirmationModalOptions = {}) {
		const result = await this.dialog({
			header: options.header ?? "Opravdu smazat?",
			message,
			confirmText: options.buttonText ?? "Smazat",
			destructive: true,
		});
		return result === true;
	}

	async inputModal<D extends Record<string, any>>(options: InputModalOptions<D>): Promise<D | null> {
		const inputs: BrandDialogInput[] = Object.entries(options.inputs).map(([name, input]) => ({
			...(input as InputModalInput<any>),
			name,
		}));

		return this.dialog({
			header: options.header,
			message: options.message,
			inputs,
			large: options.large,
			confirmText: options.buttonText ?? "Uložit",
		});
	}

	async selectModal<D>(options: SelectModalOptions<D>): Promise<D | null> {
		return this.dialog({
			header: options.header,
			message: options.message,
			options: options.values,
			selected: options.value,
			confirmText: options.buttonText ?? "Vybrat",
		});
	}

	async multiSelectModal<D>(options: MultiSelectModalOptions<D>): Promise<D[] | null> {
		return this.dialog({
			header: options.header,
			message: options.message,
			options: options.values,
			multiple: true,
			selected: options.value ?? [],
			confirmText: options.buttonText ?? "Uložit",
		});
	}

	async statusNoteModal(header: string): Promise<string | null> {
		const data = await this.inputModal<{ note: string }>({
			header,
			message: "Můžeš nechat prázdné.",
			inputs: { note: { type: "textarea" } },
			buttonText: "Pokračovat",
		});
		return data ? data.note : null;
	}

	private dialog(props: ComponentProps<BrandDialogComponent>) {
		return this.componentModal(BrandDialogComponent, props, { cssClass: "dialog-brand" });
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

import { EventEmitter, Injectable, TemplateRef } from "@angular/core";
import { AlertController, ModalController, ModalOptions } from "@ionic/angular";
import { ComponentProps, TextFieldTypes } from "@ionic/core";
import { ModalTemplateComponent } from "../shared/components/modal-template/modal-template.component";

interface BaseModalOptions {
  header?: string;
  buttonText?: string;
}

interface DeleteConfirmationModalOptions extends BaseModalOptions {}

interface InputModalOptions<D extends Record<string, any>> extends BaseModalOptions {
  inputs: { [K in keyof D]: InputModalInput<D[K]> };
}

export interface InputModalInput<T> {
  type?: T extends number ? "number" : T extends boolean ? "checkbox" : Exclude<TextFieldTypes, "number"> | "textarea";
  placeholder?: string;
  value?: T;
}

interface SelectModalOptions<D> extends BaseModalOptions {
  values: { label: string; value: D }[];
  value?: D;
}

export class ModalComponent<D = any> {
  submit = new EventEmitter<D>();
  close = new EventEmitter<void>();

  constructor(private modalCtrl: ModalController) {
    this.submit.subscribe((data) => this.modalCtrl.dismiss(data));
    this.close.subscribe(() => this.modalCtrl.dismiss(null));
  }
}

type ModalComponentRef = { new (...args: any): ModalComponent };

type ModalComponentData<C extends ModalComponentRef> =
  InstanceType<C> extends { submit: EventEmitter<infer D> } ? D : never;

@Injectable({
  providedIn: "root",
})
export class ModalService {
  constructor(
    private alertController: AlertController,
    private modalController: ModalController,
  ) {}

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

      await alert.present();
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

      await alert.present();
    });
  }

  async selectModal<D>(options: SelectModalOptions<D>) {
    return new Promise<D | null>(async (resolve, reject) => {
      const alert = await this.alertController.create({
        header: options.header,
        inputs: options.values.map((item) => ({ ...item, type: "radio", checked: item.value === options.value })),
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

      await alert.present();
    });
  }

  async componentModal<C extends ModalComponentRef>(
    component: C,
    componentProps?: ComponentProps<C>,
    options: Omit<ModalOptions<C>, "component" | "componentProps"> = {},
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

      await modal.present();
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

      await modal.present();
    });
  }
}

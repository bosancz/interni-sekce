import { Injectable } from "@angular/core";
import { AlertController } from "@ionic/angular";
import { TextFieldTypes } from "@ionic/core";

interface BaseModalOptions {
  header?: string;
  buttonText?: string;
}

interface DeleteConfirmationModalOptions extends BaseModalOptions {}

interface InputModalOptions<D extends Record<string, any>> extends BaseModalOptions {
  inputs: { [K in keyof D]: InputModalInput<D[K]> };
}

interface InputModalInput<T> {
  type?: T extends number ? "number" : T extends boolean ? "checkbox" : Exclude<TextFieldTypes, "number"> | "textarea";
  placeholder?: string;
  value?: T;
}

interface SelectModalOptions<D> extends BaseModalOptions {
  values: { label: string; value: D }[];
  value?: D;
}

@Injectable({
  providedIn: "root",
})
export class ModalService {
  constructor(private alertController: AlertController) {}

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
}

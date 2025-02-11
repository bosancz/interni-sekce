import { Component, OnInit } from "@angular/core";
import { AlertController } from "@ionic/angular";
import { ApiService } from "src/app/services/api.service";
import { ToastService } from "src/app/services/toast.service";
import { SDK } from "src/sdk";

@Component({
  selector: "bo-account-credentials",
  templateUrl: "./account-credentials.component.html",
  styleUrls: ["./account-credentials.component.scss"],
  standalone: false,
})
export class AccountCredentialsComponent implements OnInit {
  user?: SDK.UserResponseWithLinks;

  constructor(
    private api: ApiService,
    private toastService: ToastService,
    private alertController: AlertController,
  ) {}

  ngOnInit() {
    this.loadUser();
  }

  async loadUser() {
    this.user = await this.api.AccountApi.getMe().then((res) => res.data);
  }

  async updateCredentials(credentials: { login: string; password: string }) {
    if (!this.user) return;

    await this.api.UsersApi.setUserPassword(this.user.id, credentials);

    this.toastService.toast("Uloženo.");
  }

  async openChangeCredentials() {
    const alert = await this.alertController.create({
      header: "Změna hesla",
      inputs: [
        {
          name: "login",
          type: "text",
          placeholder: "Login: bilbo",
          value: this.user?.login,
        },
        {
          name: "password",
          type: "password",
          placeholder: "Heslo: rekni_pritel_a_vejdi",
          attributes: {
            minlength: 8,
          },
        },
      ],
      buttons: [
        {
          text: "Zrušit",
          role: "cancel",
          cssClass: "secondary",
        },
        {
          text: "Změnit",
          handler: (credentials) => this.updateCredentials(credentials),
        },
      ],
    });

    await alert.present();
  }

  async saveCredentials() {}
}

import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

import { ApiService } from "src/app/services/api.service";

import axios from "axios";
import { UserResponseWithLinks } from "../api";
import { ToastService } from "./toast.service";
/**
 * Service to save user information and commnicate user data with server
 */
@Injectable({
  providedIn: "root",
})
export class UserService {
  user = new BehaviorSubject<UserResponseWithLinks | null | undefined>(undefined);

  constructor(private api: ApiService, private toastService: ToastService) {
    this.loadUser();
  }

  async loadUser() {
    try {
      const user = await this.api.account.getMe().then((res) => res.data);
      this.user.next(user);
      return user;
    } catch (err) {
      if (axios.isAxiosError(err) && [404, 401, 403].includes(err.response?.status!)) {
        this.toastService.toast("Přihlášení na tomto zařízení vypršelo. Přihlaš se prosím znovu.");
        this.user.next(null);
      } else if (axios.isAxiosError(err)) {
        this.toastService.toast(`Nepodařilo se načíst uživatele: ${err.response?.data.message}`, {
          color: "danger",
          duration: 0,
          buttons: [
            {
              text: "Zkusit znovu",
              handler: () => {
                this.loadUser();
              },
            },
          ],
        });
        throw err;
      } else {
        this.toastService.toast(`Nepodařilo se načíst uživatele. Jste připojeni k internetu?`, {
          color: "danger",
          duration: 0,
          buttons: [
            {
              text: "Zkusit znovu",
              handler: () => {
                this.loadUser();
              },
            },
          ],
        });
        throw err;
      }
    }
  }
}

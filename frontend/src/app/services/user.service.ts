import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

import { ApiService } from "src/app/services/api.service";

import axios from "axios";
import { UserResponseWithLinks } from "../api";
/**
 * Service to save user information and commnicate user data with server
 */
@Injectable({
  providedIn: "root",
})
export class UserService {
  user = new BehaviorSubject<UserResponseWithLinks | null | undefined>(undefined);

  constructor(private api: ApiService) {
    this.loadUser();
  }

  async loadUser() {
    try {
      const user = await this.api.account.getMe().then((res) => res.data);
      this.user.next(user);
      return user;
    } catch (err) {
      if (axios.isAxiosError(err) && [404, 401, 403].includes(err.response?.status!)) this.user.next(null);
      else throw err;
    }
  }
}

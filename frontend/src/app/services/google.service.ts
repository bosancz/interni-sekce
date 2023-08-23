import { Injectable } from "@angular/core";
import { firstValueFrom } from "rxjs";
import { ApiService } from "./api.service";

export class GoogleError extends Error {
  name: string = "GoogleError"; // when transpiled to ES5 cant test if instanceof GoogleError

  description?: string;
}

@Injectable({
  providedIn: "root",
})
export class GoogleService {
  constructor(private api: ApiService) {}

  async signIn() {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.onload = () => resolve();
      script.onerror = (err) => reject(err);
      document.body.appendChild(script);
    });

    const client_id = await firstValueFrom(this.api.cache.apiInfo).then((info) => info?.googleClientId);
    if (!client_id) throw new Error("Client ID not provided by API");

    const response = await new Promise<google.accounts.oauth2.CodeResponse>((resolve, reject) => {
      const client = google.accounts.oauth2.initCodeClient({
        client_id,
        scope: "email",
        ux_mode: "popup",
        callback: resolve,
      });

      client.requestCode();
    });

    console.log(response);

    return response.code;
  }
}

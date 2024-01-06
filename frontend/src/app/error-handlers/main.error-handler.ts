import { HttpErrorResponse } from "@angular/common/http";
import { ErrorHandler, Injectable, Injector } from "@angular/core";
import { NavController } from "@ionic/angular";
import { ToastService } from "src/app/services/toast.service";

@Injectable()
export class MainErrorHandler implements ErrorHandler {
  constructor(private injector: Injector) {}

  handleError(err: any) {
    const navController = this.injector.get(NavController);
    const toastService = this.injector.get(ToastService);

    if (err.promise && err.rejection) err = err.rejection;

    var propagateError = true;

    if (err instanceof HttpErrorResponse) {
      if (!navigator.onLine) {
        propagateError = false;
        toastService.toast("Akci se nepodařilo dokončit - jsi bez internetu.");
      } else if (err.status === 401) {
        propagateError = false;
        const return_url = window.location.pathname;
        navController.navigateForward("/login", { queryParams: { return_url } });
      } else if (err.status === 403) {
        propagateError = false;
        toastService.toast("K akci nemáš oprávnění.");
      }
    } else if (err.name === "GoogleError") {
      if (err.message === "idpiframe_initialization_failed") {
        propagateError = false;
      }
    }

    console.error("Error", err);

    if (propagateError) {
      // TODO: open modal or page to propagate error to the user and enable reporting
    }
  }
}

import { Component, OnInit } from "@angular/core";
import { SwPush } from "@angular/service-worker";
import { UserResponseWithLinks } from "src/app/api";

import { ApiService } from "src/app/services/api.service";
import { ToastService } from "src/app/services/toast.service";

declare const Notification: any;

@Component({
  selector: "bo-account-notifications",
  templateUrl: "./account-notifications.component.html",
  styleUrls: ["./account-notifications.component.scss"],
})
export class AccountNotificationsComponent implements OnInit {
  user?: UserResponseWithLinks;

  notifications = [
    { id: "new-event", name: "Nová událost" },
    { id: "new-gallery", name: "Nová galerie" },
    { id: "changed-event", name: "Změna události" },
    { id: "received-payment", name: "Přijatá platba" },
  ];

  userNotifications: { [id: string]: any } = {};

  systemNotificationStatus: string = "default";

  constructor(private api: ApiService, public swPush: SwPush, private toastService: ToastService) {}

  ngOnInit() {
    this.loadUser();
    this.updateSystemNotificationStatus();
  }

  async loadUser() {
    this.user = await this.api.account.getMe().then((res) => res.data);
    this.updateNotifications();
  }

  async subscribe() {
    // TODO: notifications
    // const vapidPublicKey = await this.api.getAsText("notifications:key");
    // try {
    //   const subscription = await this.swPush.requestSubscription({
    //     serverPublicKey: vapidPublicKey,
    //   });
    //   await this.api.post("user:subscriptions", subscription);
    //   this.toastService.toast("Notifikace byly zapnuty.");
    // } catch (err) {
    //   this.toastService.toast("Nepodařilo se nastavit notifikace.");
    // }
  }

  async unsubscribe() {
    await this.swPush.unsubscribe();
    this.toastService.toast("Notifikace byly vypnuty.");
  }

  updateNotifications() {
    this.userNotifications = {};

    // this.notifications.forEach(notification => {
    //   this.userNotifications[notification.id] = {
    //     email: notification.id in this.user?.notifications && !!this.user?.notifications[notification.id].email,
    //     system: notification.id in this.user?.notifications && !!this.user?.notifications[notification.id].system
    //   };

    // });
  }

  updateSystemNotificationStatus() {
    this.systemNotificationStatus = (Notification && Notification.permission) || "unavailable";
  }

  async requestNotificationPermission() {
    const permission = await Notification.requestPermission();
    this.systemNotificationStatus = permission;
  }
}

import { Component, OnInit, Inject } from '@angular/core';
import { SwUpdate } from "@angular/service-worker";
import { Observable } from 'rxjs';

import { RuntimeService } from "app/core/services/runtime.service";
import { LayoutService } from "app/core/services/layout.service";
import { OnlineService } from "app/core/services/online.service";
import { ToastService, Toast } from "app/core/services/toast.service";


@Component({
  selector: 'bosan-app',
  templateUrl: "app.component.html",
  styleUrls: ["app.component.scss"]
})
export class AppComponent implements OnInit {

  toasts:Toast[] = [];
  
  constructor(
    runtime:RuntimeService,
    private toastService:ToastService,
    public onlineService:OnlineService,
    public layoutService:LayoutService,
    public swUpdate:SwUpdate
  ){
    runtime.init();
  }

  ngOnInit(){
    this.toastService.toasts.subscribe((toast:Toast) => {
      this.toasts.push(toast);
      setTimeout(() => this.toasts.shift(),2000);
    });
  }

  clearToasts(){
    this.toasts = [];
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from "@angular/router";

import { DataService } from "app/services/data.service";
import { ToastService } from "app/services/toast.service";
import { MenuService } from "app/services/menu.service";
import { TitleService } from "app/services/title.service";

import { Contact } from "app/schema/contact";

@Component({
  selector: 'about-view',
  templateUrl: "about-view.component.html",
  styleUrls: ["about-view.component.css"]
})
export class AboutViewComponent implements OnInit, OnDestroy {
  
  contacts:Contact[] = [];
  
  mapUrl:string;

  constructor(private dataService:DataService, private toastService:ToastService, private menuService:MenuService, private router:Router, private titleService:TitleService) {
    this.menuService.transparent = true;
  }

  ngOnInit() {
    
    this.titleService.setTitle("O nás");
    
    this.loadConfig();
  }
  
  async loadConfig(){
    let config = await this.dataService.getConfig();
    this.contacts = config.contacts.leaders;
    this.mapUrl = config.general.homeMapUrl;
  }

  ngOnDestroy(){
    this.menuService.transparent = false;
  }
  
  slideDown(){
    console.log("test");
  }

}

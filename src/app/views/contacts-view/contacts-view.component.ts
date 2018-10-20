import { Component, OnInit } from '@angular/core';

import { TitleService } from "app/services/title.service";
import { DataService } from "app/services/data.service";

import { Contact } from "app/schema/contact";

@Component({
  selector: 'contacts-view',
  templateUrl: './contacts-view.component.html',
  styleUrls: ['./contacts-view.component.css']
})
export class ContactsViewComponent implements OnInit {

  contacts:any = {};
  
  mapUrl:string;
  
  constructor(private titleService:TitleService, private dataService:DataService) { }

  ngOnInit() {
    this.titleService.setTitle("Kontakty");
    this.loadConfig();
  }

  async loadConfig(){
    let config = await this.dataService.getConfig();
    this.contacts = config.contacts;
    this.mapUrl = config.general.homeMapUrl;
  }

}

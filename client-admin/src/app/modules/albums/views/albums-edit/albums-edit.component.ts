import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { AlbumsService } from '../../albums.service';

import { Album, Photo } from 'app/schema/album';
import { ToastService } from 'app/core/services/toast.service';
import { ApiService } from 'app/core/services/api.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Action } from 'app/shared/components/action-buttons/action-buttons.component';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { formatDate } from '@angular/common';
import { Event } from 'app/schema/event';
import { NgForm } from '@angular/forms';

@UntilDestroy()
@Component({
  selector: 'albums-edit',
  templateUrl: './albums-edit.component.html',
  styleUrls: ['./albums-edit.component.scss']
})
export class AlbumsEditComponent {

  album?: Album<Photo, string>;

  actions: Action[] = [
    {
      text: "Uložit",
      handler: () => this.saveAlbum()
    }
  ];

  @ViewChild("albumForm") albumForm!: NgForm;

  constructor(
    public albumsService: AlbumsService,
    private route: ActivatedRoute,
    private router: Router,
    private toastService: ToastService,
    private api: ApiService
  ) { }

  ngOnInit() {
    this.route.params
      .pipe(untilDestroyed(this))
      .subscribe(params => {
        this.albumsService.loadAlbum(params.album);
      });

    this.albumsService.album$
      .pipe(untilDestroyed(this))
      .subscribe(album => {
        this.album = album;
      });
  }

  ngOnDestroy() {
  }
  async searchEvents(value: string): Promise<Event[]> {
    return value ? this.api.get<Event[]>("events:search", { search: value }) : [];
  }

  getEventString(event: Event): string {
    if (!event) return "";
    return event.name + " (" + formatDate(event.dateFrom, 'd. M. y', "cs") + " ~ " + formatDate(event.dateTill, 'd. M. y', "cs") + ")";
  }

  async saveAlbum() {

    if (!this.album) return;

    if (this.albumForm.invalid) {
      this.toastService.toast("Nelze uložit, zkontrolujte údaje.");
      return;
    }

    let albumData = this.albumForm.value;

    await this.albumsService.updateAlbum(this.album._id, albumData);

    this.toastService.toast("Uloženo.");
  }

  test(event: any) {
    console.log(event);
  }

}

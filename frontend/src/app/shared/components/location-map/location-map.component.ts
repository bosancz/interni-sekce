import {
	AfterViewInit,
	Component,
	effect,
	ElementRef,
	inject,
	input,
	OnDestroy,
	viewChild,
} from "@angular/core";
import * as L from "leaflet";
import { ApiService } from "src/app/core/services/api.service";

@Component({
	selector: "bo-location-map",
	templateUrl: "./location-map.component.html",
	styleUrls: ["./location-map.component.scss"],
})
export class LocationMapComponent implements AfterViewInit, OnDestroy {
	coordinates = input.required<{ lat: number; lng: number }>();
	zoom = input<number>(13);

	private api = inject(ApiService);
	private mapEl = viewChild.required<ElementRef<HTMLElement>>("mapEl");
	private map?: L.Map;
	private marker?: L.Marker;
	private mapyCzApiKey = "";

	constructor() {
		effect(() => {
			const c = this.coordinates();
			if (this.map && c) {
				this.map.setView([c.lat, c.lng], this.zoom());
				if (this.marker) this.marker.setLatLng([c.lat, c.lng]);
				else this.marker = L.marker([c.lat, c.lng]).addTo(this.map);
			}
		});
	}

	async ngAfterViewInit() {
		try {
			const rootInfo = await this.api.RootApi.getApiInfo();
			this.mapyCzApiKey = rootInfo.data.mapyCzApiKey || "";
		} catch (error) {
			console.error("Failed to load Mapy.cz API key:", error);
		}

		const c = this.coordinates();
		this.map = L.map(this.mapEl().nativeElement, {
			zoomControl: false,
			attributionControl: false,
			dragging: false,
			scrollWheelZoom: false,
			doubleClickZoom: false,
			touchZoom: false,
			boxZoom: false,
			keyboard: false,
		}).setView([c.lat, c.lng], this.zoom());

		L.tileLayer(`https://api.mapy.cz/v1/maptiles/outdoor/256/{z}/{x}/{y}?apikey=${this.mapyCzApiKey}`, {
			maxZoom: 19,
		}).addTo(this.map);

		this.marker = L.marker([c.lat, c.lng]).addTo(this.map);
	}

	ngOnDestroy() {
		this.map?.remove();
	}
}

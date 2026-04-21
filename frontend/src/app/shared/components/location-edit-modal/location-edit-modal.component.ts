import { CommonModule } from "@angular/common";
import { Component, input, OnInit, AfterViewInit, OnDestroy, inject } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import {
	IonButton,
	IonButtons,
	IonInput,
	IonItem,
	IonLabel,
	IonList,
	IonSegment,
	IonSegmentButton,
	IonIcon,
	ModalController,
} from "@ionic/angular/standalone";
import * as L from "leaflet";
import { AbstractModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";
import { ApiService } from "src/app/core/services/api.service";

export interface LocationData {
	place: string | null;
	placeCoordinates: { lat: number; lng: number } | null;
}

@Component({
	selector: "bo-location-edit-modal",
	templateUrl: "./location-edit-modal.component.html",
	styleUrls: ["./location-edit-modal.component.scss"],
	imports: [
		CommonModule,
		ReactiveFormsModule,
		IonList,
		IonItem,
		IonInput,
		IonButtons,
		IonButton,
		IonLabel,
		IonSegment,
		IonSegmentButton,
		IonIcon,
		ModalLayoutComponent,
	],
})
export class LocationEditModalComponent extends AbstractModalComponent<LocationData> implements OnInit, AfterViewInit, OnDestroy {
	data = input<LocationData>({ place: null, placeCoordinates: null });

	private api = inject(ApiService);
	private map?: L.Map;
	private marker?: L.Marker;
	private mapyCzApiKey = "";

	inputMode: "text" | "map" = "text";

	form = new FormGroup({
		place: new FormControl<string | null>(null),
	});

	constructor(modalController: ModalController) {
		super(modalController);
	}

	async ngOnInit() {
		const locationData = this.data();
		this.form.patchValue({
			place: locationData.place,
		});

		// Load Mapy.cz API key from root endpoint
		try {
			const rootInfo = await this.api.RootApi.getApiInfo();
			this.mapyCzApiKey = rootInfo.mapyCzApiKey || "";
		} catch (error) {
			console.error("Failed to load Mapy.cz API key:", error);
		}
	}

	ngAfterViewInit() {
		// Initialize map when in map mode
		if (this.inputMode === "map") {
			setTimeout(() => this.initMap(), 100);
		}
	}

	ngOnDestroy() {
		if (this.map) {
			this.map.remove();
		}
	}

	onModeChange(event: any) {
		this.inputMode = event.detail.value;
		if (this.inputMode === "map") {
			setTimeout(() => this.initMap(), 100);
		}
	}

	private initMap() {
		if (this.map) return; // Already initialized

		const locationData = this.data();
		const defaultCenter: L.LatLngExpression = locationData.placeCoordinates
			? [locationData.placeCoordinates.lat, locationData.placeCoordinates.lng]
			: [49.8175, 15.473]; // Center of Czech Republic

		this.map = L.map("location-map").setView(defaultCenter, locationData.placeCoordinates ? 13 : 7);

		// Use Mapy.cz tourist map as base layer
		// Reference: https://api.mapy.cz/view?page=tiles
		const mapyCzTileLayer = L.tileLayer(
			`https://api.mapy.cz/v1/maptiles/outdoor/256/{z}/{x}/{y}?apikey=${this.mapyCzApiKey}`,
			{
				attribution: '&copy; <a href="https://www.mapy.cz/">Mapy.cz</a>',
				maxZoom: 19,
			}
		);

		mapyCzTileLayer.addTo(this.map);

		// Add marker if coordinates exist
		if (locationData.placeCoordinates) {
			this.marker = L.marker([locationData.placeCoordinates.lat, locationData.placeCoordinates.lng]).addTo(this.map);
		}

		// Add click handler to map
		this.map.on("click", (e: L.LeafletMouseEvent) => {
			const { lat, lng } = e.latlng;

			// Update or create marker
			if (this.marker) {
				this.marker.setLatLng([lat, lng]);
			} else {
				this.marker = L.marker([lat, lng]).addTo(this.map!);
			}

			// Reverse geocode to get place name
			this.reverseGeocode(lat, lng);
		});
	}

	private async reverseGeocode(lat: number, lng: number) {
		try {
			// Use Mapy.cz Geocoding API
			// Reference: https://api.mapy.cz/view?page=geocode
			const response = await fetch(
				`https://api.mapy.cz/v1/geocode/reverse?lat=${lat}&lon=${lng}&lang=cs&apikey=${this.mapyCzApiKey}`
			);

			if (response.ok) {
				const data = await response.json();
				// Extract place name from response
				if (data.items && data.items.length > 0) {
					const placeName = data.items[0].name || data.items[0].label;
					// Only update place field if it's empty
					if (!this.form.value.place) {
						this.form.patchValue({ place: placeName });
					}
				}
			}
		} catch (error) {
			console.error("Reverse geocoding failed:", error);
		}
	}

	async searchLocation() {
		const query = this.form.value.place;
		if (!query) return;

		try {
			// Use Mapy.cz Suggest API for location search
			// Reference: https://api.mapy.cz/view?page=suggest
			const response = await fetch(
				`https://api.mapy.cz/v1/suggest?lang=cs&limit=1&type=regional&query=${encodeURIComponent(query)}&apikey=${this.mapyCzApiKey}`
			);

			if (response.ok) {
				const data = await response.json();
				if (data.items && data.items.length > 0) {
					const result = data.items[0];
					const lat = result.position.lat;
					const lng = result.position.lon;

					// Update map view and marker
					if (this.map) {
						this.map.setView([lat, lng], 13);

						if (this.marker) {
							this.marker.setLatLng([lat, lng]);
						} else {
							this.marker = L.marker([lat, lng]).addTo(this.map);
						}
					}
				}
			}
		} catch (error) {
			console.error("Location search failed:", error);
		}
	}

	saveLocation() {
		const place = this.form.value.place || null;
		let placeCoordinates: { lat: number; lng: number } | null = null;

		// Get coordinates from marker if in map mode
		if (this.inputMode === "map" && this.marker) {
			const latLng = this.marker.getLatLng();
			placeCoordinates = { lat: latLng.lat, lng: latLng.lng };
		}

		this.submit.emit({ place, placeCoordinates });
	}
}

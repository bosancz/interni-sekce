import { CommonModule } from "@angular/common";
import { AfterViewInit, Component, ElementRef, inject, OnDestroy, OnInit, signal } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import {
	IonButton,
	IonButtons,
	IonIcon,
	IonInput,
	IonItem,
	IonLabel,
	IonList,
	IonToggle,
	ModalController,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { close, search, searchOutline } from "ionicons/icons";
import * as L from "leaflet";
import { debounceTime, Subscription } from "rxjs";
import { ApiService } from "src/app/core/services/api.service";
import { InputModalComponent } from "src/app/core/services/modal.service";
import { ModalLayoutComponent } from "src/app/shared/components/modal-layout/modal-layout.component";

export interface LocationData {
	place: string | undefined;
	placeCoordinates: { lat: number; lng: number } | undefined;
}

const leafletIconUrls: Record<string, string> = {
	icon: "/assets/leaflet/marker-icon.png",
	iconRetina: "/assets/leaflet/marker-icon-2x.png",
	shadow: "/assets/leaflet/marker-shadow.png",
};
(L.Icon.Default.prototype as any)._getIconUrl = function (name: string) {
	return leafletIconUrls[name] ?? "";
};

addIcons({ search, "search-outline": searchOutline, close });

@Component({
	selector: "bo-location-edit-modal",
	templateUrl: "./location-edit-modal.component.html",
	styleUrls: ["./location-edit-modal.component.scss"],
	imports: [
		CommonModule,
		ReactiveFormsModule,
		IonItem,
		IonInput,
		IonButtons,
		IonButton,
		IonIcon,
		IonList,
		IonLabel,
		IonToggle,
		ModalLayoutComponent,
	],
})
export class LocationEditModalComponent
	extends InputModalComponent<LocationData>
	implements OnInit, AfterViewInit, OnDestroy
{
	data: LocationData = { place: undefined, placeCoordinates: undefined };
	header: string = "Místo";

	private api = inject(ApiService);
	private hostEl = inject(ElementRef<HTMLElement>);
	private map?: L.Map;
	private marker?: L.Marker;
	private mapyCzApiKey = "";
	private apiKeyReady!: Promise<void>;
	private resizeObserver?: ResizeObserver;
	private placeChangesSub?: Subscription;
	private suppressNextSearch = false;

	form = new FormGroup({
		place: new FormControl<string | null>(null),
	});

	searchResults = signal<{ name: string; label: string; lat: number; lng: number }[]>([]);
	selectedCoords = signal<{ lat: number; lng: number } | undefined>(undefined);
	searchEnabled = signal(true);

	constructor(modalController: ModalController) {
		super(modalController);
	}

	async ngOnInit() {
		this.form.patchValue({
			place: this.data.place,
		});

		this.placeChangesSub = this.form.controls.place.valueChanges.pipe(debounceTime(300)).subscribe(() => {
			if (this.suppressNextSearch) {
				this.suppressNextSearch = false;
				return;
			}
			if (!this.searchEnabled()) return;
			this.searchLocation();
		});

		this.apiKeyReady = this.api.RootApi.getApiInfo()
			.then((rootInfo) => {
				this.mapyCzApiKey = rootInfo.data.mapyCzApiKey || "";
			})
			.catch((error) => {
				console.error("Failed to load Mapy.cz API key:", error);
			});

		await this.apiKeyReady;
	}

	ngAfterViewInit() {
		const ionModal = this.hostEl.nativeElement.closest("ion-modal");
		const presented = ionModal
			? new Promise<void>((resolve) =>
					ionModal.addEventListener("ionModalDidPresent", () => resolve(), { once: true }),
				)
			: Promise.resolve();

		Promise.all([presented, this.apiKeyReady]).then(() => this.initMap());
	}

	ngOnDestroy() {
		this.placeChangesSub?.unsubscribe();
		this.resizeObserver?.disconnect();
		if (this.map) {
			this.map.remove();
		}
	}

	private initMap() {
		if (this.map) return;

		const defaultCenter: L.LatLngExpression = this.data.placeCoordinates
			? [this.data.placeCoordinates.lat, this.data.placeCoordinates.lng]
			: [49.8175, 15.473];

		this.map = L.map("location-map").setView(defaultCenter, this.data.placeCoordinates ? 13 : 7);

		const mapyCzTileLayer = L.tileLayer(
			`https://api.mapy.cz/v1/maptiles/outdoor/256/{z}/{x}/{y}?apikey=${this.mapyCzApiKey}`,
			{
				attribution: '&copy; <a href="https://www.mapy.cz/">Mapy.cz</a>',
				maxZoom: 19,
			},
		);

		mapyCzTileLayer.addTo(this.map);

		const mapEl = document.getElementById("location-map");
		if (mapEl) {
			this.resizeObserver = new ResizeObserver(() => this.map?.invalidateSize());
			this.resizeObserver.observe(mapEl);
		}

		if (this.data.placeCoordinates) {
			this.marker = L.marker([this.data.placeCoordinates.lat, this.data.placeCoordinates.lng]).addTo(this.map);
			this.selectedCoords.set({ ...this.data.placeCoordinates });
		}

		this.map.on("click", (e: L.LeafletMouseEvent) => {
			const { lat, lng } = e.latlng;

			if (this.marker) {
				this.marker.setLatLng([lat, lng]);
			} else {
				this.marker = L.marker([lat, lng]).addTo(this.map!);
			}
			this.selectedCoords.set({ lat, lng });

			this.reverseGeocode(lat, lng);
		});
	}

	private async reverseGeocode(lat: number, lng: number) {
		try {
			const response = await fetch(
				`https://api.mapy.cz/v1/geocode/reverse?lat=${lat}&lon=${lng}&lang=cs&apikey=${this.mapyCzApiKey}`,
			);

			if (response.ok) {
				const data = await response.json();
				if (data.items && data.items.length > 0) {
					const placeName = data.items[0].name || data.items[0].label;
					if (!this.form.value.place) {
						this.suppressNextSearch = true;
						this.form.patchValue({ place: placeName });
					}
				}
			}
		} catch (error) {
			console.error("Reverse geocoding failed:", error);
		}
	}

	onSearchEnabledChange(enabled: boolean) {
		this.searchEnabled.set(enabled);
		if (enabled) {
			if (this.form.value.place) {
				this.searchLocation();
			}
		} else {
			this.searchResults.set([]);
		}
	}

	async searchLocation() {
		const query = this.form.value.place;
		if (!query) {
			this.searchResults.set([]);
			return;
		}

		try {
			const response = await fetch(
				`https://api.mapy.cz/v1/suggest?lang=cs&limit=5&type=regional&query=${encodeURIComponent(query)}&apikey=${this.mapyCzApiKey}`,
			);

			if (response.ok) {
				const data = await response.json();
				const items = (data.items ?? []).map((item: any) => ({
					name: item.name ?? item.label,
					label: item.label ?? item.name,
					lat: item.position.lat,
					lng: item.position.lon,
				}));
				this.searchResults.set(items);
			}
		} catch (error) {
			console.error("Location search failed:", error);
		}
	}

	selectSearchResult(result: { name: string; lat: number; lng: number }) {
		this.suppressNextSearch = true;
		this.form.patchValue({ place: result.name });
		this.searchResults.set([]);

		if (this.map) {
			this.map.setView([result.lat, result.lng], 13);

			if (this.marker) {
				this.marker.setLatLng([result.lat, result.lng]);
			} else {
				this.marker = L.marker([result.lat, result.lng]).addTo(this.map);
			}
			this.selectedCoords.set({ lat: result.lat, lng: result.lng });
		}
	}

	clearSelectedLocation() {
		if (this.marker) {
			this.marker.remove();
			this.marker = undefined;
		}
		this.selectedCoords.set(undefined);
	}

	saveLocation() {
		const place = this.form.value.place || undefined;
		let placeCoordinates: { lat: number; lng: number } | undefined = undefined;

		if (this.marker) {
			const latLng = this.marker.getLatLng();
			placeCoordinates = { lat: latLng.lat, lng: latLng.lng };
		}

		this.submit.emit({ place, placeCoordinates });
	}
}

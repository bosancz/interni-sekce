import { AsyncPipe, DatePipe } from "@angular/common";
import { Component, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { Router, RouterLink } from "@angular/router";
import {
	IonButton,
	IonButtons,
	IonHeader,
	IonIcon,
	IonItem,
	IonLabel,
	IonList,
	IonListHeader,
	IonSearchbar,
	IonToolbar,
	PopoverController,
} from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { searchSharp } from "ionicons/icons";
import { Subject, map } from "rxjs";
import { AccountMenuModalComponent } from "src/app/core/components/account-menu-modal/account-menu-modal.component";
import { ApiService } from "src/app/core/services/api.service";
import { GlobalSearchService } from "src/app/core/services/global-search.service";
import { PlatformService } from "src/app/core/services/platform.service";
import { UserService } from "src/app/core/services/user.service";
import { AvatarComponent } from "src/app/shared/components/avatar/avatar.component";
import { GroupPipe } from "src/app/shared/pipes/group.pipe";
import { MemberPipe } from "src/app/shared/pipes/member.pipe";

@Component({
	selector: "bo-header",
	templateUrl: "./header.component.html",
	styleUrl: "./header.component.scss",
	imports: [
		AvatarComponent,
		RouterLink,
		IonSearchbar,
		IonHeader,
		IonToolbar,
		IonButtons,
		IonButton,
		IonIcon,
		IonList,
		IonListHeader,
		IonItem,
		IonLabel,
		MemberPipe,
		GroupPipe,
		AsyncPipe,
		DatePipe,
	],
})
export class HeaderComponent {
	showSearch = signal(false);

	user = this.userService.user;

	isLg = toSignal(this.platformService.isLg);

	environment = toSignal(this.api.info.pipe(map((info) => info.environmentTitle || "")));

	private searchQuery$ = new Subject<string>();

	searchResults = toSignal(this.globalSearch.createSearchStream(this.searchQuery$.asObservable()));

	searching = signal(false);

	resultsOpen = signal(false);

	constructor(
		private readonly api: ApiService,
		private readonly userService: UserService,
		public readonly popoverController: PopoverController,
		private readonly platformService: PlatformService,
		private readonly globalSearch: GlobalSearchService,
		private readonly router: Router,
	) {
		addIcons({ searchSharp });
	}

	onSearchInput(value: string | null | undefined) {
		const query = (value || "").trim();
		this.searching.set(!!query);
		this.resultsOpen.set(!!query);
		this.searchQuery$.next(value || "");
	}

	onSearchFocus() {
		const results = this.searchResults();
		if (results && results.query) this.resultsOpen.set(true);
	}

	// Delay closing the dropdown on blur so that click events on result items
	// are processed before the dropdown disappears.
	private static readonly BLUR_CLOSE_DELAY_MS = 200;

	onSearchBlur() {
		setTimeout(() => {
			this.resultsOpen.set(false);
			if (!this.isLg()) this.showSearch.set(false);
		}, HeaderComponent.BLUR_CLOSE_DELAY_MS);
	}

	onSearchClear() {
		this.searchQuery$.next("");
		this.searching.set(false);
		this.resultsOpen.set(false);
		this.showSearch.set(false);
	}

	async navigate(commands: unknown[]) {
		this.resultsOpen.set(false);
		this.showSearch.set(false);
		await this.router.navigate(commands);
	}

	hasResults(): boolean {
		const r = this.searchResults();
		return !!r && (r.members.length > 0 || r.events.length > 0 || r.albums.length > 0);
	}

	async openAccountMenu(e: Event) {
		const popover = await this.popoverController.create({
			translucent: true,
			component: AccountMenuModalComponent,
			event: e,
		});

		await popover.present();
	}
}


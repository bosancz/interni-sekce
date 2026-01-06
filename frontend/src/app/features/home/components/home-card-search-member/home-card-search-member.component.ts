import { Component, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { IonItem, IonLabel, IonList, IonSearchbar } from "@ionic/angular/standalone";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { Subject, debounceTime, tap } from "rxjs";
import { ApiService } from "src/app/services/api.service";
import { CardContentComponent } from "src/app/shared/components/card-content/card-content.component";
import { CardComponent } from "src/app/shared/components/card/card.component";
import { GroupPipe } from "src/app/shared/pipes/group.pipe";
import { MemberPipe } from "src/app/shared/pipes/member.pipe";
import { SDK } from "src/sdk";

@UntilDestroy()
@Component({
	selector: "bo-home-card-search-member",
	
	templateUrl: "./home-card-search-member.component.html",
	styleUrl: "./home-card-search-member.component.scss",
	imports: [
		FormsModule,
		RouterLink,
		IonSearchbar,
		IonList,
		IonItem,
		IonLabel,
		CardComponent,
		CardContentComponent,
		GroupPipe,
		MemberPipe,
	],
})
export class HomeCardSearchMemberComponent {
	searchString = new Subject<string>();

	members = signal<SDK.MemberResponse[] | undefined>(undefined);

	searching = signal(false);

	constructor(private api: ApiService) {}

	ngOnInit(): void {
		this.searchString
			.pipe(untilDestroyed(this))
			.pipe(tap((searchString) => this.searching.set(!!searchString)))
			.pipe(debounceTime(500))
			.subscribe((searchString) => this.loadMembers(searchString));
	}

	async loadMembers(searchString: string) {
		if (searchString) {
			const members = await this.api.MembersApi.listMembers({ search: searchString }).then((res) => res.data);
			this.members.set(members);
			this.searching.set(false);
		} else {
			this.clearMembers();
		}
	}

	clearMembers() {
		this.members.set(undefined);
	}
}

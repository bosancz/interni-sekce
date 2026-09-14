import { Component, computed, inject, input, output } from "@angular/core";
import { AlertController, IonChip, IonIcon } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { addOutline } from "ionicons/icons";

@Component({
	selector: "bo-photo-tags-editor",
	templateUrl: "./photo-tags-editor.component.html",
	styleUrls: ["./photo-tags-editor.component.scss"],

	imports: [IonChip, IonIcon],
})
export class PhotoTagsEditorComponent {
	tags = input<string[] | null>(null);
	albumTags = input<string[]>([]);
	disabled = input<boolean>(false);

	tagsChange = output<string[]>();

	private alertController = inject(AlertController);

	availableTags = computed(() => {
		const seen = new Set<string>();
		const result: string[] = [];
		for (const tag of [...this.albumTags(), ...(this.tags() ?? [])]) {
			if (seen.has(tag)) continue;
			seen.add(tag);
			result.push(tag);
		}
		return result;
	});

	constructor() {
		addIcons({ addOutline });
	}

	hasTag(tag: string) {
		return (this.tags() ?? []).includes(tag);
	}

	toggleTag(tag: string) {
		if (this.disabled()) return;

		const tags = this.tags() ?? [];
		const next = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
		this.tagsChange.emit(next);
	}

	async addTag() {
		if (this.disabled()) return;

		const alert = await this.alertController.create({
			header: "Nový štítek",
			inputs: [{ name: "tag", type: "text", placeholder: "Název štítku" }],
			buttons: [
				{ text: "Zrušit", role: "cancel" },
				{
					text: "Přidat",
					handler: (value: { tag: string }) => {
						this.commitNewTag(value.tag);
					},
				},
			],
		});

		await alert.present();
	}

	private commitNewTag(raw: string | undefined | null) {
		let tag = (raw ?? "").trim().replace(/\s+/g, " ");
		if (tag.startsWith("#")) tag = tag.slice(1).trim();
		if (!tag) return;

		const tags = this.tags() ?? [];
		if (tags.includes(tag)) return;

		this.tagsChange.emit([...tags, tag]);
	}
}

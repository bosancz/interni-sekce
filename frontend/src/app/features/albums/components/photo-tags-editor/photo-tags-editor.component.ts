import { Component, computed, inject, input, output } from "@angular/core";
import { AlertController, IonChip, IonIcon } from "@ionic/angular/standalone";
import { addIcons } from "ionicons";
import { addOutline } from "ionicons/icons";

/**
 * Presentational editor for a single photo's tags. It offers the album's existing tag
 * vocabulary (`albumTags`) as toggleable chips — a chip is highlighted when the photo
 * carries that tag — plus a "+" chip that prompts for a brand-new tag. Every change is
 * emitted through `tagsChange`; the component keeps no state of its own, so the parent
 * owns persistence (see PhotosEditComponent.saveTags).
 */
@Component({
	selector: "bo-photo-tags-editor",
	templateUrl: "./photo-tags-editor.component.html",
	styleUrls: ["./photo-tags-editor.component.scss"],

	imports: [IonChip, IonIcon],
})
export class PhotoTagsEditorComponent {
	// tags currently on the photo
	tags = input<string[]>([]);
	// every tag used anywhere in the album, offered as ready-made toggles
	albumTags = input<string[]>([]);
	disabled = input<boolean>(false);

	tagsChange = output<string[]>();

	private alertController = inject(AlertController);

	// the album vocabulary plus any tag already on this photo, de-duplicated and
	// kept in a stable order so chips don't jump around as tags are toggled
	availableTags = computed(() => {
		const seen = new Set<string>();
		const result: string[] = [];
		for (const tag of [...this.albumTags(), ...this.tags()]) {
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
		return this.tags().includes(tag);
	}

	toggleTag(tag: string) {
		if (this.disabled()) return;

		const tags = this.tags();
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
		// normalize: trim, drop a leading "#", collapse inner whitespace
		let tag = (raw ?? "").trim().replace(/\s+/g, " ");
		if (tag.startsWith("#")) tag = tag.slice(1).trim();
		if (!tag) return;

		// a tag already on the photo is a no-op; one that only exists elsewhere in the
		// album (or is brand new) gets added
		if (this.tags().includes(tag)) return;

		this.tagsChange.emit([...this.tags(), tag]);
	}
}

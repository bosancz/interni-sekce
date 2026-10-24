import { Component, computed, inject, input, output } from "@angular/core";
import { IonChip, IonIcon } from "@ionic/angular/standalone";
import { ModalService } from "src/app/core/services/modal.service";
import { addIcons } from "ionicons";
import { addOutline, checkmarkOutline } from "ionicons/icons";

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

	private modalService = inject(ModalService);

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
		addIcons({ addOutline, checkmarkOutline });
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

		const value = await this.modalService.inputModal<{ tag: string }>({
			header: "Nový štítek",
			inputs: { tag: { type: "text", placeholder: "Název štítku", required: true } },
			buttonText: "Přidat",
		});
		if (value) this.commitNewTag(value.tag);
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

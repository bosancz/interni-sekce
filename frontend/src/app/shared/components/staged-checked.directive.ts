import { Directive, ElementRef, Renderer2, computed, effect, forwardRef, inject, input, output, signal } from "@angular/core";
import { STAGED_CONTROL, StagedControl } from "./staged-control";

/**
 * Makes a checked control (`ion-toggle` / `ion-checkbox`) participate in the filter modal's staging
 * (see {@link StagedControl}) without changing the surrounding markup. Bind through it instead of the
 * element's own `checked` / `ionChange`:
 *
 *   <ion-toggle [boStagedChecked]="showInactive()" (boStagedCheckedChange)="setFilterParam('active', $event ? 'all' : null)">
 *
 * Inline it toggles immediately; inside the mobile filter modal `<bo-filter>` holds the change in a
 * draft and only emits `boStagedCheckedChange` when the user confirms with "Hotovo".
 */
@Directive({
	selector: "ion-toggle[boStagedChecked], ion-checkbox[boStagedChecked]",
	providers: [{ provide: STAGED_CONTROL, useExisting: forwardRef(() => StagedCheckedDirective) }],
})
export class StagedCheckedDirective implements StagedControl {
	boStagedChecked = input<boolean>(false);
	boStagedCheckedChange = output<boolean>();

	// While staging, toggles write here instead of emitting; null means "not staging".
	private draft = signal<boolean | null>(null);

	private effective = computed<boolean>(() => this.draft() ?? this.boStagedChecked());

	constructor() {
		const el = inject(ElementRef).nativeElement as HTMLElement;
		const renderer = inject(Renderer2);
		// Drive the element's own `checked` from the effective value, so the draft shows while staging.
		effect(() => renderer.setProperty(el, "checked", this.effective()));

		renderer.listen(el, "ionChange", (event: CustomEvent<{ checked: boolean }>) => {
			const value = !!event.detail?.checked;
			if (value === this.effective()) return; // ignore echoes from our own programmatic writes
			if (this.draft() === null) this.boStagedCheckedChange.emit(value);
			else this.draft.set(value);
		});
	}

	// --- staging, driven by the parent <bo-filter> around the mobile filter modal ---

	beginStaging() {
		if (this.draft() === null) this.draft.set(this.boStagedChecked());
	}

	commit() {
		const draft = this.draft();
		this.draft.set(null);
		if (draft !== null && draft !== this.boStagedChecked()) this.boStagedCheckedChange.emit(draft);
	}

	cancel() {
		this.draft.set(null);
	}
}

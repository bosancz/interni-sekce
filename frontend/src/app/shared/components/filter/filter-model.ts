import { Injectable, signal } from "@angular/core";
import { Observable, Subject } from "rxjs";

export type FilterValues = Record<string, unknown>;

/**
 * The wrapper model behind `<bo-filter>`: a single source of truth for a page's whole filter.
 *
 * The individual controls (pills, sort select, toggles) stay dumb — they read their value from here
 * by name and report changes back. The page feeds in the committed values and applies whatever the
 * model emits:
 *
 * - **inline / desktop** — a change applies immediately: `apply$` fires with the full filter.
 * - **mobile modal** — `<bo-filter>` calls {@link begin} on open; changes only build a draft (so the
 *   list behind the modal is untouched) and are emitted as one filter on {@link commit} ("Hotovo"),
 *   or dropped on {@link cancel}.
 *
 * Provided per page (`providers: [FilterModel]`) so it is shared with the controls through the
 * element injector — which, unlike a content query, reaches the controls even though they render
 * into the modal through an `ngTemplateOutlet`.
 */
@Injectable()
export class FilterModel {
	private committed = signal<FilterValues>({});
	// Draft while a modal is staging; null means "apply immediately".
	private draft = signal<FilterValues | null>(null);

	private applySubject = new Subject<FilterValues>();
	/** Fires the full filter to apply — on every change when live, once on commit when staging. */
	readonly apply$: Observable<FilterValues> = this.applySubject.asObservable();

	get staging(): boolean {
		return this.draft() !== null;
	}

	/** The page feeds the committed filter (from the URL or its own state) whenever it changes. */
	setCommitted(values: FilterValues): void {
		this.committed.set(values);
	}

	/** The value a control should display for `name`: the draft while staging, else the committed one. */
	value(name: string): unknown {
		return (this.draft() ?? this.committed())[name];
	}

	set(name: string, value: unknown): void {
		this.patch({ [name]: value });
	}

	patch(values: FilterValues): void {
		const draft = this.draft();
		if (draft !== null) {
			this.draft.set({ ...draft, ...values });
		} else {
			// live: apply the change on top of the committed filter straight away
			this.applySubject.next({ ...this.committed(), ...values });
		}
	}

	begin(): void {
		this.draft.set({ ...this.committed() });
	}

	commit(): void {
		const draft = this.draft();
		this.draft.set(null);
		if (draft) this.applySubject.next(draft);
	}

	cancel(): void {
		this.draft.set(null);
	}
}

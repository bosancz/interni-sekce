import { Injectable, signal } from "@angular/core";
import { Observable, Subject } from "rxjs";

export type FilterValues = Record<string, unknown>;

@Injectable()
export class FilterModel {
	private committed = signal<FilterValues>({});
	private draft = signal<FilterValues | null>(null);

	private applySubject = new Subject<FilterValues>();
	readonly apply$: Observable<FilterValues> = this.applySubject.asObservable();

	get staging(): boolean {
		return this.draft() !== null;
	}

	setCommitted(values: FilterValues): void {
		this.committed.set(values);
	}

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

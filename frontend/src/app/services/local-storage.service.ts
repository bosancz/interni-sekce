import { Injectable } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { filter, map } from "rxjs/operators";

@Injectable({
	providedIn: "root",
})
export class LocalStorageService {
	private readonly changes = new Subject<{ key: string; value: any }>();

	constructor() {
		addEventListener("storage", (event) => {
			if (event.key) this.changes.next({ key: event.key, value: event.newValue });
		});
	}

	watch<T>(name: string): Observable<T | null> {
		const subject = new Subject<T | null>();

		this.changes
			.pipe(filter((change) => change.key === name))
			.pipe(map((change) => <T>change.value))
			.subscribe(subject);

		setTimeout(() => subject.next(this.get<T>(name)));

		return subject;
	}

	get<T>(name: string) {
		try {
			const data = localStorage.getItem(name);
			if (!data) return null;
			return <T>JSON.parse(data);
		} catch (e) {
			return null;
		}
	}

	set<T>(key: string, value: T) {
		localStorage.setItem(key, JSON.stringify(value));
		this.changes.next({ key, value });
	}
}

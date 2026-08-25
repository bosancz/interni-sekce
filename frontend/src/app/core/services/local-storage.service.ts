import { Injectable } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { filter, map } from "rxjs/operators";

@Injectable({
	providedIn: "root",
})
export class LocalStorageService {
	private readonly changes = new Subject<{ key: string; value: any; external: boolean }>();

	constructor() {
		addEventListener("storage", (event) => {
			if (event.storageArea !== localStorage || !event.key) return;
			this.changes.next({ key: event.key, value: this.parse(event.newValue), external: true });
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

	watchExternal<T>(name: string): Observable<T | null> {
		return this.changes.pipe(
			filter((change) => change.external && change.key === name),
			map((change) => <T>change.value),
		);
	}

	get<T>(name: string) {
		return this.parse<T>(localStorage.getItem(name));
	}

	private parse<T>(data: string | null) {
		try {
			if (!data) return null;
			return <T>JSON.parse(data);
		} catch (e) {
			return null;
		}
	}

	set<T>(key: string, value: T) {
		localStorage.setItem(key, JSON.stringify(value));
		this.changes.next({ key, value, external: false });
	}
}

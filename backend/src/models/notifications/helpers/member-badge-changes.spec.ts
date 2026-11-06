import { getMemberBadgesMessage, MemberBadgeChange, mergeMemberBadgeChange } from "./member-badge-changes";

function change(key: string, kind: MemberBadgeChange["kind"], category: MemberBadgeChange["category"] = "achievement") {
	return { key, kind, category, title: key };
}

describe("mergeMemberBadgeChange", () => {
	it("cancels an addition removed again", () => {
		expect(mergeMemberBadgeChange([change("a", "added")], change("a", "removed"))).toEqual([]);
	});

	it("cancels a removal added again", () => {
		expect(mergeMemberBadgeChange([change("a", "removed")], change("a", "added"))).toEqual([]);
	});

	it("keeps an addition updated afterwards as an addition", () => {
		expect(mergeMemberBadgeChange([change("a", "added")], change("a", "updated"))).toEqual([change("a", "added")]);
	});

	it("turns an update removed afterwards into a removal", () => {
		expect(mergeMemberBadgeChange([change("a", "updated")], change("a", "removed"))).toEqual([
			change("a", "removed"),
		]);
	});

	it("keeps the order of changes", () => {
		const changes = [change("a", "added"), change("b", "updated")];
		expect(mergeMemberBadgeChange(changes, change("a", "updated"))).toEqual(changes);
		expect(mergeMemberBadgeChange(changes, change("c", "added"))).toEqual([...changes, change("c", "added")]);
	});
});

describe("getMemberBadgesMessage", () => {
	it("returns nothing without changes", () => {
		expect(getMemberBadgesMessage([], "/x")).toBeNull();
	});

	it("names a single change in the title", () => {
		expect(getMemberBadgesMessage([{ ...change("a", "added"), title: "Černý šán" }], "/x")).toEqual({
			title: "Nové ocenění: Černý šán",
			path: "/x",
		});
		expect(getMemberBadgesMessage([{ ...change("a", "updated", "training"), title: "Zdravotník" }], "/x")).toEqual({
			title: "Upravené školení: Zdravotník",
			path: "/x",
		});
	});

	it("lists several changes in the body", () => {
		expect(
			getMemberBadgesMessage(
				[
					{ ...change("a", "removed"), title: "Nováčkovská zkouška" },
					{ ...change("b", "added"), title: "Černý šán" },
					{ ...change("c", "added"), title: "1. hvězda" },
				],
				"/x",
			),
		).toEqual({
			title: "Změna ocenění na tvém profilu",
			body: "Přidáno: Černý šán, 1. hvězda. Odebráno: Nováčkovská zkouška.",
			path: "/x",
		});
	});

	it("mentions both categories", () => {
		expect(getMemberBadgesMessage([change("a", "added"), change("b", "removed", "training")], "/x")?.title).toBe(
			"Změna ocenění a školení na tvém profilu",
		);
	});
});

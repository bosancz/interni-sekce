import { currentMembershipYear, isMembershipPaid, membershipPaymentOf } from "src/app/core/helpers/membership";
import { SDK } from "src/sdk";
import { getOfflineEntry } from "./offline-store";

export const OfflineKeys = {
	root: "root",
	account: "account",
	groups: "groups",
	members: "members",
	group: (id: number) => `group:${id}`,
	member: (id: number) => `member:${id}`,
	contacts: (id: number) => `contacts:${id}`,
	insuranceCard: (id: number) => `insurance-card:${id}`,
	insuranceCardEtag: (id: number) => `insurance-card-etag:${id}`,
};

type Member = SDK.MemberResponseWithLinks;
type Group = SDK.GroupResponseWithLinks;

const collator = new Intl.Collator("cs", { numeric: true, sensitivity: "base" });

export async function resolveOfflineResponse(url: string): Promise<{ data: unknown } | undefined> {
	const parsed = new URL(url, window.location.origin);
	const path = parsed.pathname.replace(/\/+$/, "") || "/";
	const params = parsed.searchParams;

	const single = async (key: string) => {
		const data = await getOfflineEntry(key);
		return data === undefined ? undefined : { data };
	};

	if (path === "/api") return single(OfflineKeys.root);
	if (path === "/api/account") return single(OfflineKeys.account);

	if (path === "/api/groups") {
		const groups = await getOfflineEntry<Group[]>(OfflineKeys.groups);
		if (!groups) return undefined;
		return { data: params.get("active") === "true" ? groups.filter((g) => g.active) : groups };
	}

	if (path === "/api/members") {
		const members = await getOfflineEntry<Member[]>(OfflineKeys.members);
		if (!members) return undefined;
		const groups = (await getOfflineEntry<Group[]>(OfflineKeys.groups)) ?? [];
		return { data: filterMembers(members, groups, params) };
	}

	let match = path.match(/^\/api\/groups\/(\d+)$/);
	if (match) return single(OfflineKeys.group(Number(match[1])));

	match = path.match(/^\/api\/members\/(\d+)$/);
	if (match) return single(OfflineKeys.member(Number(match[1])));

	match = path.match(/^\/api\/members\/(\d+)\/contacts$/);
	if (match) return single(OfflineKeys.contacts(Number(match[1])));

	match = path.match(/^\/api\/members\/(\d+)\/insurance-card$/);
	if (match) return single(OfflineKeys.insuranceCard(Number(match[1])));

	return undefined;
}

function normalize(value: string) {
	return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function searchText(member: Member): string {
	const values: unknown[] = [member.nickname, member.firstName, member.lastName, member.email, member.mobile];
	for (const contact of member.contacts ?? []) {
		const c = contact as unknown as Record<string, unknown>;
		values.push(
			c["name"],
			c["relationship"],
			...((c["mobile"] as string[]) ?? []),
			...((c["email"] as string[]) ?? []),
		);
	}
	return normalize(
		values
			.filter((v): v is string => typeof v === "string")
			.map((v) => `${v} ${v.replace(/\s+/g, "")}`)
			.join(" "),
	);
}

function filterMembers(members: Member[], groups: Group[], params: URLSearchParams): Member[] {
	const year = params.has("membershipYear") ? Number(params.get("membershipYear")) : currentMembershipYear();
	const includePaid = params.get("includeMembershipPaid") === "true";

	let result = members;

	if (params.get("active") === "true") {
		result = result.filter((m) => m.active || (includePaid && isMembershipPaid(m.membership, year)));
	}

	const groupIds = params.getAll("groups").map(Number);
	if (groupIds.length) result = result.filter((m) => groupIds.includes(m.groupId));

	const roles = params.getAll("roles");
	if (roles.length) result = result.filter((m) => roles.includes(m.role));

	const membership = params.getAll("membership");
	const paid = membership.includes("zaplaceno");
	const unpaid = membership.includes("nezaplaceno");
	if (paid !== unpaid) result = result.filter((m) => isMembershipPaid(m.membership, year) === paid);

	const tokens = normalize(params.get("search") ?? "")
		.split(/\s+/)
		.filter(Boolean);
	if (tokens.length) {
		result = result.filter((m) => {
			const text = searchText(m);
			return tokens.every((token) => text.includes(token));
		});
	}

	result = sortMembers(result, groups, params.get("sort") || "nickname", params.get("order") === "DESC", year);

	const offset = Number(params.get("offset") ?? 0);
	const limit = Number(params.get("limit") ?? 25);
	return result.slice(offset, offset + limit);
}

type SortValue = string | number | boolean | null | undefined;

function sortMembers(members: Member[], groups: Group[], sort: string, desc: boolean, year: number): Member[] {
	const groupNames = new Map(groups.map((g) => [g.id, g.name ?? g.shortName]));
	const nickname = (m: Member) => `${m.nickname ?? ""}${m.firstName ?? ""}${m.lastName ?? ""}`;

	const getters: Record<string, (m: Member) => SortValue> = {
		nickname,
		firstName: (m) => `${m.firstName ?? ""}${m.lastName ?? ""}`,
		lastName: (m) => `${m.lastName ?? ""}${m.firstName ?? ""}`,
		name: (m) => `${m.lastName ?? ""}${m.firstName ?? ""}`,
		role: (m) => m.role,
		membership: (m) => isMembershipPaid(m.membership, year),
		paidOn: (m) => membershipPaymentOf(m.membership, year)?.paidOn ?? null,
		variableSymbol: (m) => m.id,
		age: (m) => (m.birthday ? -new Date(m.birthday).getTime() : null),
		birthday: (m) => m.birthday ?? null,
		group: (m) => groupNames.get(m.groupId) ?? null,
		city: (m) => m.addressCity ?? null,
		street: (m) => m.addressStreet ?? null,
		status: (m) => m.active,
	};

	const getter = getters[sort] ?? nickname;
	const nullsLast = sort === "paidOn";

	const compare = (a: SortValue, b: SortValue) => {
		if (typeof a === "string" && typeof b === "string") return collator.compare(a, b);
		return Number(a) - Number(b);
	};

	return [...members].sort((a, b) => {
		const va = getter(a);
		const vb = getter(b);
		const aNull = va === null || va === undefined;
		const bNull = vb === null || vb === undefined;

		let result = 0;
		if (aNull || bNull) {
			if (!(aNull && bNull)) result = (aNull ? 1 : -1) * (nullsLast || !desc ? 1 : -1);
		} else {
			result = compare(va, vb) * (desc ? -1 : 1);
		}

		return result || collator.compare(nickname(a), nickname(b));
	});
}

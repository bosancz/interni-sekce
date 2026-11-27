export function memberActiveSql(memberAlias: string) {
	return `EXISTS (SELECT 1 FROM members_groups mg_active WHERE mg_active.member_id = ${memberAlias}.id AND mg_active.active)`;
}

export function memberGroupIdSql(memberAlias: string) {
	return `(SELECT mg_group.group_id FROM members_groups mg_group WHERE mg_group.member_id = ${memberAlias}.id AND mg_group.active)`;
}

export function memberInGroupsSql(memberAlias: string, groupIdsParam: string, activeOnly: boolean) {
	return `EXISTS (SELECT 1 FROM members_groups mg_in WHERE mg_in.member_id = ${memberAlias}.id AND mg_in.group_id IN (:...${groupIdsParam})${activeOnly ? " AND mg_in.active" : ""})`;
}

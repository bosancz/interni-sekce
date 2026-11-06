import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { Config } from "src/config";
import { MemberBadgeChange, mergeMemberBadgeChange } from "../helpers/member-badge-changes";
import { NotificationsService } from "./notifications.service";

interface PendingMemberBadgeChanges {
	actorUserId: number | undefined;
	changes: MemberBadgeChange[];
	timer: NodeJS.Timeout;
}

@Injectable()
export class MemberBadgesNotificationsService implements OnModuleDestroy {
	private readonly logger = new Logger(MemberBadgesNotificationsService.name);

	private pending = new Map<number, PendingMemberBadgeChanges>();

	constructor(
		private notificationsService: NotificationsService,
		private config: Config,
	) {}

	recordChanges(memberId: number, actorUserId: number | undefined, changes: MemberBadgeChange[]) {
		const current = this.pending.get(memberId);
		if (current && current.actorUserId !== actorUserId) this.flush(memberId);

		const previous = this.pending.get(memberId);
		if (previous) clearTimeout(previous.timer);

		this.pending.set(memberId, {
			actorUserId,
			changes: changes.reduce(mergeMemberBadgeChange, previous?.changes ?? []),
			timer: setTimeout(() => this.flush(memberId), this.config.notifications.memberBadgesDelayMs),
		});
	}

	async onModuleDestroy() {
		await Promise.all([...this.pending.keys()].map((memberId) => this.flush(memberId)));
	}

	private flush(memberId: number) {
		const pending = this.pending.get(memberId);
		if (!pending) return Promise.resolve();

		clearTimeout(pending.timer);
		this.pending.delete(memberId);

		return this.notificationsService
			.onMemberBadgesChanged(memberId, pending.changes, pending.actorUserId)
			.catch((err) => this.logger.error(`Failed to send member badges notifications: ${err.message}`));
	}
}

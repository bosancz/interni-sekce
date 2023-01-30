import { RouteEntity } from "src/access-control/schema/route-entity";
import { Member } from "src/models/members/entities/member.entity";

export const MemberRoute = new RouteEntity<Member>({
  permissions: {
    vedouci: true,
  },
});

export const MembersRoute = new RouteEntity<Member, Member[]>({
  permissions: {
    vedouci: true,
  },
  contains: { array: { entity: MemberRoute } },
});

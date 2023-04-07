import { UserRoles } from "src/models/users/entities/user.entity";

// FIXME: verejnost should only be given when
export enum StaticRoles {
  "verejnost" = "verejnost",
  "vedouci" = "vedouci",
  "uzivatel" = "uzivatel",
}

export type Roles = UserRoles | StaticRoles;

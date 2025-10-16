import { UserRoles } from "src/models/users/entities/user.entity";

export enum StaticRoles {
	"verejnost" = "verejnost",
	"vedouci" = "vedouci",
	"uzivatel" = "uzivatel",
}

export type Roles = UserRoles | StaticRoles;

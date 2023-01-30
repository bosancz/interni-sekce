import { UserRoles } from "src/models/users/entities/user.entity";

export enum DefaultRoles {
  "verejnost" = "verejnost",
  "vedouci" = "vedouci",
}

export type Roles = UserRoles | DefaultRoles;

import { UserRoles } from "src/models/users/entities/user.entity";

export type Roles = keyof typeof UserRoles | "verejnost" | "vedouci";

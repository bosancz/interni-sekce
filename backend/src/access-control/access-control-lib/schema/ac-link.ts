import { ApiProperty } from "@nestjs/swagger";

export class AcLink {
  @ApiProperty() allowed!: boolean;
  @ApiProperty() applicable!: boolean;
  @ApiProperty() href!: string;
  @ApiProperty() method!: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
}

export type AcLinksObject<P extends string> = { [key in P]: AcLink };

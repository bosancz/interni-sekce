import { ApiProperty } from "@nestjs/swagger";

export class AcLink {
  @ApiProperty() href!: string;
  @ApiProperty() allowed!: boolean;
  @ApiProperty() method!: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
}

export type WithAcLinks<D> = D & { _links?: Record<string, AcLink> };

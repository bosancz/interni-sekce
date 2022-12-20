import { ApiProperty } from "@nestjs/swagger";

export class DocumentLink {
  @ApiProperty() href!: string;
  @ApiProperty() allowed!: boolean;
  @ApiProperty() method!: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
}

export interface Document {
  _links?: Record<string, DocumentLink>;
}

import { ApiProperty } from "@nestjs/swagger";

export class MembersReportResponse {
	@ApiProperty() count!: number;

	@ApiProperty({ type: "object", additionalProperties: { type: "number" } }) rolesCount!: {
		[role: string]: number;
	};
	@ApiProperty({
		type: "object",
		additionalProperties: { type: "object", additionalProperties: { type: "number" } },
	})
	ages!: {
		[role: string]: { [age: string]: number };
	};
}

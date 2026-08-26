import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString } from "class-validator";
import { MemberPayment } from "src/models/members/entities/member-payment.entity";

export class MemberPaymentResponse implements MemberPayment {
	@ApiProperty() id!: number;
	@ApiProperty() memberId!: number;

	@ApiProperty() amount!: number;
	@ApiPropertyOptional() paymentDate?: string | null;
}

export class CreatePaymentBody {
	@ApiProperty() @IsNumber() amount!: number;
	@ApiPropertyOptional() @IsString() @IsOptional() paymentDate?: string | null;
}

export class UpdatePaymentBody extends CreatePaymentBody {}

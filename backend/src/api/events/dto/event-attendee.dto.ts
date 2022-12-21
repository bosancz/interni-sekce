import { PickType } from "@nestjs/swagger";
import { MemberDto } from "src/api/members/dto/member.dto";

export class EventAttendeeResponse extends PickType(MemberDto, ["id"]) {}

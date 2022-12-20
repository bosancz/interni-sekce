import { Request } from "express";
import { WhereExpressionBuilder } from "typeorm";

export type QueryFilter = {
  where: (qb: WhereExpressionBuilder, req: Request) => WhereExpressionBuilder;
};

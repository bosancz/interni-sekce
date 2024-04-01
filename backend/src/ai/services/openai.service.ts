import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import OpenAI from "openai";
import { Config } from "src/config";

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);

  private apiKey = Config.ai.apiKey;
  private client?: OpenAI;

  constructor() {
    if (!this.apiKey) this.logger.warn("OpenAI API KEY not provided");
  }

  public getClient() {
    if (this.client) return this.client;

    if (!this.apiKey) throw new InternalServerErrorException("OpenAI API KEY not provided");

    this.client = new OpenAI({
      apiKey: Config.ai.apiKey,
    });

    return this.client;
  }
}

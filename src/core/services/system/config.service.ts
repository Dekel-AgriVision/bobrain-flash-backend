import { Injectable } from '@nestjs/common';
import * as dotenv from 'dotenv'; // If you use dotenv for environment variables

@Injectable()
export class ConfigService {
  private readonly envConfig: Record<string, string>;

  constructor() {
    // Load environment variables from .env file
    dotenv.config();
    this.envConfig = process.env; // This assumes all environment variables are relevant to your configuration
  }

  get(key: string): string {
    return this.envConfig[key];
  }
}

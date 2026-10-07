import { toNumber } from '@app/core';
import { registerAs } from '@nestjs/config';

export default registerAs('cache', () => ({
  ttl: toNumber(process.env.APP_CACHE_TTL, 600),
}));

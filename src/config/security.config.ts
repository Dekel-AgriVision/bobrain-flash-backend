import { toNumber } from '@app/core';
import { registerAs } from '@nestjs/config';

export default registerAs('security', () => ({
  // the maximum number of requests within the TTL limit
  auth_throttle_limit: toNumber(process.env.APP_AUTH_THROTTLE_LIMIT, 10), // Default: 3
  // The number of seconds that each request will last in storage
  auth_throttle_ttl: toNumber(process.env.APP_AUTH_THROTTLE_TTL, 60 * 15), // Default: 15 minutes (60 * 15)
}));

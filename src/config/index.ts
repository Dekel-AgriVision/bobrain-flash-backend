import applicationConfig from './application.config';
import apiConfig from './api.config';
import cacheConfig from './cache.config';
import databaseConfig from './database.config';
import jwtConfig from './jwt.config';
import securityConfig from './security.config';

const configs = [
  applicationConfig,
  databaseConfig,
  cacheConfig,
  apiConfig,
  jwtConfig,
  securityConfig,
];

export {
  configs,
  applicationConfig,
  databaseConfig,
  cacheConfig,
  apiConfig,
  jwtConfig,
  securityConfig,
};

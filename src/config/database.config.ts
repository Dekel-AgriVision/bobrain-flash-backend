import { registerAs } from '@nestjs/config';

export default registerAs('db', () => ({
  host: process.env.APP_DB_HOST,
  port: process.env.APP_DB_PORT,
  username: process.env.APP_DB_USERNAME,
  password: process.env.APP_DB_PASSWORD,
  name: process.env.APP_DB_NAME,
}));

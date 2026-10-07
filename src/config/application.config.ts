import { getPackageInfos } from '@app/core';
import { registerAs } from '@nestjs/config';

const packageInfos = getPackageInfos();

export default registerAs('app', () => ({
  name: process.env.APP_NAME ?? packageInfos?.formattedName,
  host: process.env.APP_HOST,
  port: process.env.APP_PORT,
  key: process.env.APP_KEY ?? 'UhkY9Kvd21N08nbYhfCqGv42',
}));

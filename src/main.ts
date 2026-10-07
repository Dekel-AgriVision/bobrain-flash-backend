import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Paginated, bootstrapNestApp, onBootstrapNestApp } from '@app/nestjs';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import utcPlugin from 'dayjs/plugin/utc';
import advancedFormatPlugin from 'dayjs/plugin/advancedFormat';
import customParseFormatPlugin from 'dayjs/plugin/customParseFormat';
import relativeTimePlugin from 'dayjs/plugin/relativeTime';
import durationPlugin from 'dayjs/plugin/duration';
import toArrayPlugin from 'dayjs/plugin/toArray';
import localDataPlugin from 'dayjs/plugin/localeData';

// dayjs Config
dayjs.extend(utcPlugin);
dayjs.extend(advancedFormatPlugin);
dayjs.extend(customParseFormatPlugin);
dayjs.extend(relativeTimePlugin);
dayjs.extend(durationPlugin);
dayjs.extend(toArrayPlugin);
dayjs.extend(localDataPlugin);
dayjs.locale('fr');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  return await bootstrapNestApp(app, {
    configService,
    swagger:  process.env.NODE_ENV !== 'production'
        ? {
            documentOptions: {
              ignoreGlobalPrefix: true,
              extraModels: [Paginated],
            },
          }
        : undefined,
  });
}

bootstrap()
  .then((config) => {
    onBootstrapNestApp(config);
  })
  .catch((thrown) => {
    console.error(thrown);
  });

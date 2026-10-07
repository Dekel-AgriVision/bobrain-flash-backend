import {
  INestApplication,
  LoggerService,
  LogLevel,
  RequestMethod,
} from '@nestjs/common';
import { GlobalPrefixOptions, RouteInfo } from '@nestjs/common/interfaces';
import { ConfigService } from '@nestjs/config';
import {
  DocumentBuilder,
  SwaggerDocumentOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import {
  getPackageInfos,
  enableCompression,
  toBoolean,
  toInteger,
} from '@app/core';
import helmet, { HelmetOptions } from 'helmet';
import { CorsOptions } from 'cors';
import { merge, trimStart } from 'lodash';
import { Logger4jsService } from './logger';
import compression from 'compression';

export type SwaggerOptions = {
  documentOptions?: SwaggerDocumentOptions;
};

export type BootstrapOptions = {
  configService?: ConfigService;
  logger?: LoggerService | LogLevel[] | false;
  appPath?: string;
  swagger?: SwaggerOptions;
  prefixOptions?: GlobalPrefixOptions;
  helmetOptions?: HelmetOptions;
};

export type BootstrapResponse = {
  app: INestApplication;
  configService: ConfigService;
  logger?: LoggerService | LogLevel[] | false;
  appPath: string;
  appUrl: string;
  options?: BootstrapOptions;
};

const packageInfos = getPackageInfos();

/**
 *
 * @param app INestApplication
 * @param options BootstrapOptions
 * @return BootstrapResponse
 */
export async function bootstrapNestApp(
  app: INestApplication,
  options?: BootstrapOptions,
): Promise<BootstrapResponse> {
  // Check Config Service
  options = options || { configService: app.get(ConfigService) };
  options.configService = options.configService || app.get(ConfigService);
  const configService = options.configService;

  // Get application
  const appName: string = configService.get<string>(
    'app.name',
    process.env.APP_NAME ?? packageInfos['formattedName'] ?? 'nestjs-app',
  );
  const appPort: number = configService.get<number>(
    'app.port',
    toInteger(process.env.APP_PORT, 3000),
  );

  // Check Logger
  try {
    options.logger = options.logger ?? (await app.resolve(Logger4jsService));
  } catch (e) {
    console.warn(e);
    options.logger = false;
  }

  // Check Swagger Options
  options.swagger = options.swagger || { documentOptions: {} };
  options.swagger.documentOptions = options.swagger.documentOptions || {};

  // Check Global Prefix Options
  options.prefixOptions = options.prefixOptions || {};
  options.prefixOptions.exclude =
    options.prefixOptions.exclude || ([] as string[] | RouteInfo[]);

  /**
   * @see https://docs.nestjs.com/security/helmet
   */
  if (toBoolean(process.env.APP_DISABLE_HELMET, false) !== true) {
    enableHelmet(app, options.helmetOptions ?? {});
  }

  /**
   * @see https://docs.nestjs.com/security/cors
   */
  if (
    process.env.APP_CORS_ORIGIN !== undefined &&
    process.env.APP_CORS_ORIGIN !== 'none' &&
    process.env.APP_CORS_ORIGIN !== 'false'
  ) {
    enableCors(app);
  }

  /**
   * Compress HTTP response body
   */
  enableCompression(app as any);
  app.use(compression());

  /**
   * Set application base path
   */
  const appPath =
    process.env.APP_PATH ?? options.appPath ?? appName + '/api/v1';
  app.setGlobalPrefix(appPath, {
    exclude: options.prefixOptions.exclude.concat([
      { path: '/api/v1/alive', method: RequestMethod.ALL },
      { path: '/actuator', method: RequestMethod.ALL },
    ]),
  });

  /**
   * Override logger
   */
  app.useLogger(options.logger);

  /**
   * Init API Documentation
   */
  initApiDocumentation(app, appPath, configService, options.swagger);

  /**
   * Listening port
   */
  await app.listen(appPort);
  const appUrl = await app.getUrl();

  return {
    app,
    logger: options.logger,
    configService,
    appPath,
    appUrl,
    options,
  };
}

/**
 *
 * @param config BootstrapResponse
 */
export function onBootstrapNestApp(config: BootstrapResponse): void {
  const mainUrl = config.appUrl;
  let appUrl = mainUrl;
  appUrl += '/' + trimStart(config.appPath, '/');
  let logger: LoggerService | LogLevel[] | false;
  if (
    typeof config.logger !== 'undefined' &&
    config.logger != null &&
    !Array.isArray(config.logger) &&
    config.logger !== false
  ) {
    logger = config.logger;
  } else {
    logger = console;
  }
  logger.log(`Application is running on: ${appUrl}`);
  logger.log(
    `Application documentation swagger console: ${appUrl + '/swagger'}`,
  );
  logger.log(
    `Application documentation swagger json: ${appUrl + '/swagger-json'}`,
  );
}

function initApiDocumentation(
  app: INestApplication,
  appPath: string,
  configService: ConfigService,
  swaggerOptions?: SwaggerOptions,
): void {
  const appName = configService.get<string>(
    'app.name',
    process.env.APP_NAME ?? packageInfos['formattedName'] ?? 'app-nestjs',
  );
  const appPort = configService.get<string>(
    'app.port',
    process.env.APP_PORT ?? '3000',
  );
  const appHost = configService.get<string>(
    'app.host',
    process.env.APP_HOST ?? '0.0.0.0',
  );
  swaggerOptions = swaggerOptions || { documentOptions: {} };
  const config = new DocumentBuilder()
    .setTitle(appName)
    .setDescription(
      configService.get<string>(
        'app.description',
        process.env.APP_DESCRIPTION ??
          packageInfos['description'] ??
          'Booster NestJS application',
      ),
    )
    .setVersion(process.env.APP_VERSION ?? packageInfos['version'] ?? 'v1')
    .setContact(
      packageInfos['author']?.name ?? '',
      packageInfos['author']?.url ?? null,
      packageInfos['author']?.email ?? null,
    )
    .addServer(
      '{_protocol_}://{_server_ip_}:{_server_port_}/{_server_base_path}',
      'Server Base URL',
      {
        _protocol_: { default: 'http', enum: ['http', 'https'] },
        _server_ip_: { default: appHost, description: 'Server Host' },
        _server_port_: { default: appPort, description: 'Server Port' },
        _server_base_path: { default: appPath, description: 'Server Path' },
      },
    )
    .build();
  const document = SwaggerModule.createDocument(
    app,
    config,
    swaggerOptions.documentOptions,
  );

  const swaggerPath = appPath + '/swagger';
  enableSwaggerBasicAuth(app, [swaggerPath, swaggerPath + '-json']);

  SwaggerModule.setup(swaggerPath, app, document, {
    customSiteTitle: appName + ' - Swagger UI',
  });
}

/**
 * Protège les routes Swagger (UI + JSON) par une authentification HTTP Basic.
 * Activé seulement si APP_SWAGGER_USER et APP_SWAGGER_PASSWORD sont renseignés,
 * pour ne pas casser les apps qui n'ont pas configuré ces variables.
 */
function enableSwaggerBasicAuth(app: INestApplication, paths: string[]) {
  const swaggerUser = process.env.APP_SWAGGER_USER;
  const swaggerPassword = process.env.APP_SWAGGER_PASSWORD;

  if (!swaggerUser || !swaggerPassword) {
    return;
  }

  app.use(paths, (req: any, res: any, next: any) => {

    const header = req.headers.authorization;

    if (typeof header === 'string' && header.startsWith('Basic ')) {
      const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
      const separatorIndex = decoded.indexOf(':');
      const reqUser = decoded.slice(0, separatorIndex);
      const reqPassword = decoded.slice(separatorIndex + 1);
      if (reqUser === swaggerUser && reqPassword === swaggerPassword) {
        return next();
      }
    }

    res.set('WWW-Authenticate', 'Basic realm="Swagger"');
    res.status(401).send('Authentication required.');
  });
}

function enableCors(app: INestApplication) {
  let corsOrigin: boolean | string[] = true;
  if (
    ~['true', '1', 'on', '0', 'false', 'off'].indexOf(
      process.env.APP_CORS_ORIGIN,
    )
  ) {
    corsOrigin = toBoolean(process.env.APP_CORS_ORIGIN);
  } else {
    if (
      typeof process.env.APP_CORS_ORIGIN === 'string' &&
      process.env.APP_CORS_ORIGIN.trim() != ''
    ) {
      corsOrigin = process.env.APP_CORS_ORIGIN.split(',');
    }
  }

  const corsOptions: CorsOptions = {
    origin: corsOrigin ?? true,
    allowedHeaders:
      process.env.APP_CORS_ALLOWED_HEADERS?.split(',') ?? undefined,
    exposedHeaders:
      process.env.APP_CORS_EXPOSED_HEADERS?.split(',') ?? undefined,
  };

  app.enableCors(corsOptions as any);
}

function enableHelmet(app: INestApplication, options?: HelmetOptions) {
  options = options ?? {};
  app.use(
    helmet(
      merge(
        {
          contentSecurityPolicy: {
            directives: {
              'default-src': ["'none'"],
              'connect-src': ["'self'"],
              'base-uri': ["'none'"],
              'form-action': ["'none'"],
              'frame-ancestors': ["'none'"],
            },
            useDefaults: true,
          },
          frameguard: {
            action: 'DENY',
          },
        },
        options,
      ),
    ),
  );
}

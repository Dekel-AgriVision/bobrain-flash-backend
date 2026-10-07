import * as AxiosLogger from 'axios-logger';
import fs from 'fs';

/**
 * { "true", "yes", "on", "1", "oui", "ok" } => true
 * { null, "ohter string" } => false
 * { undefined } => undefined
 *
 * @param value
 * @param defaultReturn
 * @return boolean | undefined
 */
export function toBoolean(
  value: string | number,
  defaultReturn?: boolean,
): boolean | undefined {
  if (value === undefined) return defaultReturn ?? undefined;
  if (value == null) return false;
  if (typeof value === 'number') return !!value;
  try {
    value = value ?? undefined;
    if (value !== undefined) {
      switch (String(value).toLowerCase()) {
        case 'true':
        case 'yes':
        case 'on':
        case '1':
        case 'oui':
        case 'ok':
          return true;
        case '':
          return defaultReturn ?? undefined;
        default:
          return false;
      }
    }
  } catch (error) {
    //
  }
  return defaultReturn ?? undefined;
}

/**
 * Return undefined if isNaN
 *
 * @param value
 * @param defaultReturn
 * @return number | undefined
 */
export function toInteger(
  value: string,
  defaultReturn?: number,
): number | undefined {
  if (value === undefined) return defaultReturn ?? undefined;
  try {
    const parsedValue = parseInt(value);
    if (!isNaN(parsedValue)) return parsedValue;
  } catch (error) {
    //
  }
  return defaultReturn ?? undefined;
}

/**
 * Return undefined if isNaN
 *
 * @param value
 * @param defaultReturn
 * @return number | undefined
 */
export function toNumber(
  value: string,
  defaultReturn?: number,
): number | undefined {
  if (value === undefined) return defaultReturn ?? undefined;
  try {
    const parsedValue = parseFloat(value);
    if (!isNaN(parsedValue)) return parsedValue;
  } catch (error) {
    //
  }
  return defaultReturn ?? undefined;
}

/**
 * import { GlobalLogConfig } from "axios-logger/lib/common/types";
 * import { AxiosInstance } from "axios";
 *
 * @param axiosInstance AxiosInstance
 * @param logger logger instance MUST HAVE 'log' method
 * @param config GlobalLogConfig @see https://www.npmjs.com/package/axios-logger
 */
export function logAxiosRequest(
  axiosInstance: any,
  logger?: any,
  config?: any,
): void {
  // Skipping when 'axios-logger' not resolved
  if (typeof AxiosLogger.errorLogger === 'undefined') {
    const errorMessage = `[@booster/core][logAxiosRequest(...)] Unable to resolve "axios-logger" module. Run "npm install axios-logger --save-dev" or "yarn add axios-logger --dev"`;
    if (typeof logger?.warn === 'function') {
      logger.warn(errorMessage);
    } else {
      console.warn(`[${new Date().toISOString()}]`, errorMessage);
    }
    return;
  }

  if (!config) config = {};
  const axiosLoggerConfig = Object.assign(
    {
      prefixText: 'AXIOS',
      headers: true,
      params: true,
      dateFormat: false,
    },
    config,
  );

  const loggerConfig = Object.assign(
    {
      logger: logger?.log?.bind(logger) ?? undefined,
    },
    axiosLoggerConfig,
  );
  const errLoggerConfig = Object.assign(
    {
      logger: logger?.error?.bind(logger) ?? undefined,
    },
    axiosLoggerConfig,
  );

  // Delete Request/Response based rules
  delete loggerConfig['request'];
  delete loggerConfig['response'];

  /**
   * Log Request
   */
  axiosInstance.interceptors.request.handlers = [];
  const requestInterceptor = axiosInstance?.interceptors?.request?.use(
    (request: any) => {
      axiosInstance?.interceptors?.request?.eject(requestInterceptor);
      return AxiosLogger.requestLogger(request, {
        ...loggerConfig,
        ...config.request,
      });
    },
    (err: any) => {
      axiosInstance?.interceptors?.request?.eject(requestInterceptor);
      return AxiosLogger.errorLogger(err, errLoggerConfig);
    },
  );

  /**
   * Log Response
   */
  axiosInstance.interceptors.response.handlers = [];
  const responseInterceptor = axiosInstance?.interceptors?.response?.use(
    (response: any) => {
      axiosInstance?.interceptors?.response?.eject(responseInterceptor);
      return AxiosLogger.responseLogger(response, {
        ...loggerConfig,
        ...config.response,
      });
    },
    (err: any) => {
      axiosInstance?.interceptors?.response?.eject(responseInterceptor);
      return AxiosLogger.errorLogger(err, errLoggerConfig);
    },
  );
}

const packageInfos = {} as any;
/**
 * Get package.json file data
 *
 * Split "name" property with "/" namespace and create following additional fields:
 *  - namespace => splitted[0]
 *  - formattedName => splitted[1]
 *
 * Format "author" property string and return Object{name: string, email: string, url: string}.
 *
 * @param path Default is "package.json"
 * @return any default {}
 */
export function getPackageInfos(path?: string): any {
  path = path || 'package.json';
  if (
    Object.prototype.hasOwnProperty.call(packageInfos, path) &&
    typeof packageInfos[path]?.formattedName === 'string'
  ) {
    return packageInfos[path];
  }
  let content = {} as any;
  try {
    const packageContent = fs.readFileSync(path, {
      encoding: 'utf-8',
    });
    content = JSON.parse(packageContent);
  } catch (e) {
    console.warn('*** Unable to parse package.json" file', e);
  } finally {
    if (typeof content['name'] === 'string') {
      const splittedName = content['name'].split('/');
      if (splittedName.length > 1) {
        content['namespace'] = splittedName[0];
        content['formattedName'] = splittedName[1];
      } else {
        content['formattedName'] = splittedName[0];
      }
      if (Object.prototype.hasOwnProperty.call(content, 'author')) {
        if (typeof content['author'] === 'string') {
          let regResult: RegExpMatchArray | null;
          const author = {} as any;
          regResult = content['author'].match(/\s?<(.+)>/im);
          author['email'] = regResult ? regResult[1] : undefined;
          regResult = content['author'].match(/\s?\((.+)\)/im);
          author['url'] = regResult ? regResult[1] : undefined;
          regResult = content['author'].match(
            /^([a-z0-9\s@#&|éèàçîêâï'_\-~\\.,:!$;]+)\s?[<(]?/im,
          );
          author['name'] = regResult
            ? regResult[1].trimEnd()
            : content['author'] || undefined;
          content['author'] = author;
        }
      } else {
        content['author'] = {};
      }
      packageInfos[path] = Object.assign({}, content);
    }
  }
  return content;
}

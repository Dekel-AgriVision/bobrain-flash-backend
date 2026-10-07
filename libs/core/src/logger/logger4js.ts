import { toBoolean } from '../utils';
import log4js, {
  Log4js,
  Logger,
  Configuration,
  Appender,
  Level,
  LoggingEvent,
  Layout,
  Format,
} from 'log4js';
import util from 'util';
import { Logger4jsOptions, LoggerReplacementRuleOptions } from './types';

/**
 * Available environment variables:
 *  - APP_LOG4JS_CONFIG_PM2
 *  - APP_LOG4JS_CONFIG_PM2_INSTANCE_VAR
 *  - APP_LOG4JS_CONFIG_DISABLE_CLUSTERING
 */
export class Logger4js {
  private static readonly DEFAULT_CATEGORY = 'default';
  private _log4js: Log4js;
  private _logger: Logger;
  private _appenders = new Map<string, Appender>();
  private _options: Logger4jsOptions;
  private _contexts = new Map<string, any>();
  private _defaultCategory: string;
  private _defaultStatusRules = {
    from: 300,
    to: 399,
    level: 'mark',
  };

  // Map of { categoryName: [appenderName] }
  private _categories = new Map<string, string[]>();

  constructor(options?: Logger4jsOptions) {
    this._options = options ?? {};
    this._defaultCategory =
      this._options.defaultCategory || Logger4js.DEFAULT_CATEGORY;
    this._initLogger();
  }

  get level(): Level | string {
    return this._logger?.level;
  }

  set level(name: Level | string) {
    this._logger.level = name;
  }

  get defaultCategory(): string {
    return this._defaultCategory;
  }

  addContext(key: string, value: any): void {
    this._contexts.set(key, value);
    this._logger.addContext(key, value);
  }

  removeContext(key: string): void {
    this._contexts.delete(key);
    this._logger.removeContext(key);
  }

  clearContext(): void {
    this._contexts.clear();
    this._logger.clearContext();
  }

  switch(category?: string): void {
    category = category || this._defaultCategory;
    this._logger = this._log4js.getLogger(category);
  }

  newInstance(category?: string): Logger4js {
    const loggerInstance: Logger4js = Object.assign(
      Object.create(Object.getPrototypeOf(this)),
      this,
    );
    loggerInstance.switch(category);
    return loggerInstance;
  }

  // express.Handler;
  connect(options: { statusRules?: any, format?: Format; level?: string; nolog?: any }): any {
    options = options ?? {};
    options['statusRules'] = options['statusRules'] || [
      this._defaultStatusRules,
    ];
    return this._log4js.connectLogger(this._logger, options);
  }

  addAppender(name: string, appender: Appender, categories?: string[]): void {
    this._appenders.set(name, appender);

    // Adding appender in category
    categories = categories ?? [this._defaultCategory];
    categories.forEach((category) => {
      const appenderNames = this._categories.has(category)
        ? this._categories.get(category)
        : [];
      this._categories.set(category, [...appenderNames, name]);
    });

    this._reloadConfig();
  }

  removeAppender(name: string): void {
    this._appenders.delete(name);
    for (const [key, value] of this._categories.entries()) {
      this._categories.set(
        key,
        value.filter((c) => c !== name),
      );
    }
    this._reloadConfig();
  }

  trace(message: any, ...args: any[]): void {
    if (this._logger.isTraceEnabled()) {
      this._log('trace', message, ...args);
    }
  }

  debug(message: any, ...args: any[]): void {
    if (this._logger.isDebugEnabled()) {
      this._log('debug', message, ...args);
    }
  }

  verbose(message: any, ...args: any[]): void {
    if (this._logger.isDebugEnabled()) {
      this.debug(message, ...args);
    }
  }

  info(message: any, ...args: any[]): void {
    if (this._logger.isInfoEnabled()) {
      this._log('info', message, ...args);
    }
  }

  warn(message: any, ...args: any[]): void {
    if (this._logger.isWarnEnabled()) {
      this._log('warn', message, ...args);
    }
  }

  error(message: any, ...args: any[]): void {
    if (this._logger.isErrorEnabled()) {
      this._log('error', message, ...args);
    }
  }

  fatal(message: any, ...args: any[]): void {
    if (this._logger.isFatalEnabled()) {
      this._log('fatal', message, ...args);
    }
  }

  mark(message: any, ...args: any[]): void {
    if (this._logger.isLevelEnabled('mark')) {
      this._log('mark', message, ...args);
    }
  }

  log(message: any, ...args: any[]): void {
    this.info(message, ...args);
  }

  protected _log(level: Level | string, ...args: any[]): void {
    if (typeof level === 'string') level = this._log4js.levels.getLevel(level);
    if (typeof this['onBeforeLog'] === 'function') {
      this['onBeforeLog'](level, ...args);
    }
    this._logger._log(level, args);
  }

  addLayout(
    name: string,
    config: (a: any) => (logEvent: LoggingEvent) => any,
  ): void {
    return this._log4js.addLayout(name, config);
  }

  getDefaultLayout(uncoloured?: boolean): Layout {
    return {
      type: 'pattern',
      pattern: uncoloured
        ? '[%d] %z - %p% %x{context}% %x{message}'
        : '%[[%d] %z -%] %p% %[%x{context}%] %x{message}',
      tokens: {
        // Message token
        message: (logEvent) => {
          return this.formatLogEventData(logEvent);
        },
        // Contexts token
        context: (logEvent) => {
          let contextString = '';
          if (~Object.keys(logEvent.context).indexOf('requestId')) {
            contextString +=
              '[' + this._formatOutputData(logEvent.context['requestId']) + ']';
          }
          if (~Object.keys(logEvent.context).indexOf('requestPath')) {
            contextString +=
              '[' +
              this._formatOutputData(logEvent.context['requestPath']) +
              ']';
          }
          if (~Object.keys(logEvent.context).indexOf('traceId')) {
            contextString +=
              '[' + this._formatOutputData(logEvent.context['traceId']) + ']';
          }
          if (~Object.keys(logEvent.context).indexOf('spanId')) {
            contextString +=
              '[' + this._formatOutputData(logEvent.context['spanId']) + ']';
          }
          if (~Object.keys(logEvent.context).indexOf('name')) {
            contextString +=
              '[' + this._formatOutputData(logEvent.context['name']) + ']';
          }

          for (const [key, value] of Object.entries(logEvent.context)) {
            if (
              !~[
                'name',
                'requestId',
                'requestPath',
                'traceId',
                'spanId',
              ].indexOf(key)
            ) {
              contextString +=
                '[' + this._formatOutputData(util.format(value)) + ']';
            }
          }
          return contextString;
        },
      },
    };
  }

  // Before log hook
  protected onBeforeLog(_level: Level, ..._args: any[]): void {
    // To be overwritten
  }

  // Default layout message transmformer
  protected formatLogEventData(logEvent: LoggingEvent): string {
    const data = logEvent.data.map((d) => this._formatOutputData(d));
    return util.format(...data);
  }

  protected updateOptions(options: Logger4jsOptions): void {
    this._options = options ?? {};
    this._reloadConfig();
  }

  private _reloadConfig(category?: string): Logger4js {
    const categories = {} as any;
    this._categories.forEach((value, key) => {
      categories[key] = { appenders: value, level: this.level ?? 'info' };
    });

    this._log4js.configure({
      pm2: toBoolean(process.env.APP_LOG4JS_CONFIG_PM2, this._options?.pm2),
      pm2InstanceVar:
        process.env.APP_LOG4JS_CONFIG_PM2_INSTANCE_VAR ??
        this._options?.pm2InstanceVar,
      disableClustering: toBoolean(
        process.env.APP_LOG4JS_CONFIG_DISABLE_CLUSTERING,
        this._options?.disableClustering,
      ),
      appenders: Object.fromEntries(this._appenders),
      categories: categories,
    } as Configuration);

    category = category || this._defaultCategory;
    this._logger = this._log4js.getLogger(category);

    // Reload local contexts
    this._contexts.forEach((value, key) => this._logger.addContext(key, value));

    return this;
  }

  private _initLogger(): void {
    this._log4js = log4js;
    this._setJSONLayout();
    this._setDefaultAppender();
    this._reloadConfig();
  }

  private _setDefaultAppender(name?: string): void {
    name = name || 'out';
    const defaultAppender = {
      type: 'stdout',
      layout: this.getDefaultLayout(),
    } as Appender;
    // this._appenders[name] = defaultAppender;
    this.addAppender(name, defaultAppender);
  }

  protected _formatOutputData(data: any) {
    let formattedData = data;
    try {
      if (typeof data === 'object') {
        formattedData = JSON.stringify(formattedData);
      }
    } catch (error) {
      //
    } finally {
      formattedData = this._applyReplacementRules(formattedData);
    }
    return util.format(formattedData);
  }

  private _applyReplacementRules(message: any): string {
    let formattedMessage = String(message);
    if (!this._options?.replacementRules) return formattedMessage;
    let replacementRules: LoggerReplacementRuleOptions[];

    if (!Array.isArray(this._options.replacementRules))
      replacementRules = [this._options.replacementRules];
    else replacementRules = this._options.replacementRules;

    for (const replacementRule of replacementRules) {
      replacementRule.replacement = replacementRule.replacement ?? '$1"****"$3';
      if (typeof replacementRule.rule === 'string') {
        formattedMessage = formattedMessage.replace(
          new RegExp(
            `((?:\\\\)?["']${String(replacementRule.rule)}(?:\\\\)?["']\s*:\s*)("?.+?"?\s*)(,|}|])`,
            'gim',
          ),
          replacementRule.replacement,
        );
      } else {
        formattedMessage = formattedMessage.replace(
          replacementRule.rule,
          replacementRule.replacement,
        );
      }
    }
    return formattedMessage;
  }

  private _setJSONLayout(): void {
    this._log4js.addLayout('json', () => {
      return function (logEvent) {
        return JSON.stringify(logEvent);
      };
    });
  }
}

import {
  ConsoleLogger,
  Inject,
  Injectable,
  LogLevel,
  Optional,
  Scope,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { CONTEXT, RequestContext } from '@nestjs/microservices';
import { LoggerModuleOptions } from './types';
import { getPackageInfos, LoggerReplacementRuleOptions } from '@app/core';
import { LOGGER_MODULE_OPTIONS } from './custom-logger.module-definition';

@Injectable({ scope: Scope.TRANSIENT })
export class CustomLogger extends ConsoleLogger {
  @Inject(REQUEST) private request: Request;

  @Inject(CONTEXT) private ctx: RequestContext;

  @Optional()
  @Inject(LOGGER_MODULE_OPTIONS)
  private loggerOptions: LoggerModuleOptions;

  public getContext(): string {
    return this.context;
  }

  public info(message: any, context?: string): void {
    this.log(message, context);
  }

  protected printMessages(
    messages: unknown[],
    context?: string,
    logLevel?: LogLevel,
    writeStreamType?: 'stdout' | 'stderr',
  ): void {
    if (/(LoggingInterceptor)/im.test(context)) {
      messages = [messages[0]];
    }
    messages = this.customFormatMessages(messages);
    context = this.updateContext(context);
    super.printMessages(messages, context, logLevel, writeStreamType);
  }

  getTimestamp(): string {
    return new Date().toISOString();
  }

  protected formatPid(pid: number): string {
    const name = `${
      process.env.APP_NAME || getPackageInfos()['name'] || 'Nest'
    }`;
    let nodeEnv = '';
    if (process.env.NODE_ENV) {
      nodeEnv = `{${process.env.NODE_ENV}}`;
    }
    return `${nodeEnv}[${name}] ${pid}  - `;
  }

  private customFormatMessages(messages: unknown[]): unknown[] {
    const formattedMessages: unknown[] = [];
    for (const message of messages) {
      formattedMessages.push(this.customFormatMessage(message));
    }

    return formattedMessages;
  }

  private customFormatMessage(message: unknown): unknown {
    let formattedMessage: unknown = message;
    if (
      typeof formattedMessage === 'object' &&
      formattedMessage.constructor === Object
    ) {
      try {
        formattedMessage = JSON.stringify(formattedMessage);
      } catch (e) {
        // Error
      }
    }
    try {
      if (typeof formattedMessage === 'string') {
        formattedMessage = formattedMessage.replace(/(\n|\r)/gm, '');
        formattedMessage = this.applyReplacementRules(String(formattedMessage));
      }
    } catch (e) {
      // Error
    }

    return formattedMessage;
  }

  private applyReplacementRules(message: any): string {
    let formattedMessage = String(message);
    if (!this.loggerOptions?.replacementRules) return formattedMessage;
    let replacementRules: LoggerReplacementRuleOptions[];

    if (!Array.isArray(this.loggerOptions.replacementRules))
      replacementRules = [this.loggerOptions.replacementRules];
    else replacementRules = this.loggerOptions.replacementRules;

    for (const replacementRule of replacementRules) {
      replacementRule.replacement = replacementRule.replacement ?? '$1"****"$3';
      if (typeof replacementRule.rule === 'string') {
        formattedMessage = formattedMessage.replace(
          new RegExp(
            `(["']${replacementRule.rule}["']\s*:\s*)("?.+?"?\s*)(,|}|])`,
            'img',
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

  private updateContext(context?: string) {
    context = context || this.context || '';
    try {
      if (
        typeof this.ctx !== 'undefined' &&
        typeof this.ctx.context !== 'undefined'
      ) {
        context = `${JSON.stringify(this.ctx.pattern)}|${context}`.trim();
      } else {
        if (typeof this.request !== 'undefined') {
          let requestId = '';
          requestId +=
            this.request.query.MatchingKey ||
            this.request.query.requestId ||
            this.request.header('X-OAPI-Request-Id') ||
            '';
          const appName = `${
            process.env.APP_NAME || getPackageInfos()['formattedName']
          }`;
          let basePath = String(appName + '/api');
          let path = String(this.request?.path ?? this.request?.url) || '';
          if (~path.indexOf('v1')) basePath += '/v1';
          if (~path.indexOf('v2')) basePath += '/v2';
          if (~path.indexOf('v3')) basePath += '/v3';
          if (~path.lastIndexOf(basePath))
            path = path.slice(path.lastIndexOf(basePath) + basePath.length);
          context =
            `${requestId}|${this.request.method.toUpperCase()}|${path}|${context}`.trim();
        }
      }
    } catch (e) {
      console.error(
        `[${new Date().toISOString()}][${
          CustomLogger.name
        }][method][updateContext]`,
        e,
      );
    }

    return context;
  }

  private shouldLogSpan(): boolean {
    const appTelemetryClients = (
      process.env.APP_TELEMETRY_CLIENTS || 'none'
    ).split(',');
    if (~appTelemetryClients.indexOf('none')) return false;
    if (!~appTelemetryClients.indexOf('otel')) return false;
    const appLogsCollector = (process.env.APP_LOGS_COLLECTOR || 'none').split(
      ',',
    );
    if (~appLogsCollector.indexOf('none')) return false;
    if (!~appLogsCollector.indexOf('otel')) return false;
    return true;
  }
}

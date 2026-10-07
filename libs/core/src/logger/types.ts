export interface Logger4jsOptions {
  defaultCategory?: string;
  pm2?: boolean;
  pm2InstanceVar?: string;
  disableClustering?: boolean;
  replacementRules?:
    | LoggerReplacementRuleOptions
    | LoggerReplacementRuleOptions[];
}

export interface LoggerReplacementRuleOptions {
  rule: RegExp | string;
  replacement?: string;
}

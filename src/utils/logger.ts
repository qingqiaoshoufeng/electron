// const log4js = require('log4js');
import log4js from 'log4js';

const path = require('path');
const { app } = require('electron');
// 日志文件的输出路径，这里我们选择userData path下的logs
// 在我的电脑上是C:\Users\xxx\AppData\Roaming\myApp\logs
const LOG_PATH = path.join(app.getPath('logs'), 'logs');
interface LogConfig {
  level: string;
  [propName: string]: any;
}

log4js.addLayout(
  'json',
  (config: any) =>
    (logEvent: log4js.LoggingEvent): string => {
      return (
        JSON.stringify(
          {
            level: logEvent.categoryName,
            time: logEvent.startTime,
            message: logEvent.data,
            caller: logEvent.context.caller || '', // caller
            params: logEvent.context.params || {}, // params
          },
          0
        ) + config.separator
      );
    }
);
log4js.configure({
  appenders: {
    // 设置控制台输出 （默认日志级别是关闭的（即不会输出日志））
    out: {
      type: 'console', // 配置了这一项，除了会输出到日志文件，也会输出到控制台
    },
    // 设置每天：以日期为单位,数据文件类型，dataFiel 注意设置pattern，alwaysIncludePattern属性
    frontFileLog: {
      type: 'dateFile',
      filename: path.join(LOG_PATH, 'front'),
      pattern: 'yyyy-MM-dd.log', // 每天生成按这个格式拼接到filename后边
      alwaysIncludePattern: true, // 始终包含pattern
      daysToKeep: 1,
      layout: {
        type: 'json', // 使用内置布局
        separator: ',',
      },
    },
    systemFileLog: {
      type: 'dateFile',
      filename: path.join(LOG_PATH, 'system'),
      pattern: 'yyyy-MM-dd.log', // 每天生成按这个格式拼接到filename后边
      alwaysIncludePattern: true, // 始终包含pattern
      daysToKeep: 1,
      layout: {
        type: 'json', // 使用内置布局
        separator: ',',
      },
    },
    crashFileLog: {
      type: 'dateFile',
      filename: path.join(LOG_PATH, 'crash'),
      pattern: 'yyyy-MM-dd.log', // 每天生成按这个格式拼接到filename后边
      alwaysIncludePattern: true, // 始终包含pattern
      daysToKeep: 1,
      layout: {
        type: 'json', // 使用内置布局
        separator: ',',
      },
    },
  },
  // 不同等级的日志追加到不同的输出位置：appenders: ['out', 'allLog']  categories 作为getLogger方法的键名对应
  categories: {
    front_info: {
      appenders: ['out', 'frontFileLog'],
      level: 'info',
    },
    front_warn: {
      appenders: ['out', 'frontFileLog'],
      level: 'warn',
    },
    front_error: {
      appenders: ['out', 'frontFileLog'],
      level: 'error',
    },
    system_info: {
      appenders: ['out', 'systemFileLog'],
      level: 'info',
    },
    system_warn: {
      appenders: ['out', 'systemFileLog'],
      level: 'warn',
    },
    system_error: {
      appenders: ['out', 'systemFileLog'],
      level: 'error',
    },
    crash: {
      appenders: ['out', 'crashFileLog'],
      level: 'fatal',
    },
    default: {
      appenders: ['out'],
      level: 'debug',
    },
  },
});

// type logKey = Record<string, unknown>;
export = {
  front: (message: string, cfg = {}) => {
    const config: LogConfig = { level: 'info', ...cfg };
    const logger = log4js.getLogger(`front_${config.level}`);
    logger.addContext('caller', config.caller);
    logger.addContext('params', config.params);
    logger[config.level](message);
  },
  system: (message: string, cfg = {}) => {
    const config: LogConfig = { level: 'info', ...cfg };
    const logger = log4js.getLogger(`system_${config.level}`);
    logger.addContext('caller', config.caller);
    logger.addContext('params', config.params);
    logger[config.level](message);
  },
  crash: (message: string, config: LogConfig) => {
    const logger = log4js.getLogger('crash');
    logger.addContext('caller', config.caller);
    logger.addContext('params', config.params);
    logger.fatal(message);
  },
};

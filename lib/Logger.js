const util = require('util');
const Console = require('console').Console;
const fs = require('fs');
const stream = require('stream');
const request = require('request');
const SlackLogger = require('./services/SlackLogger');
const moment = require('moment');

const levels = {
  INFO: 1,
  VERBOSE: 2,
  WARN: 3,
  ERROR: 4,
  FATAL: 5,
  ALL: 10
};

class LogMessage {
  constructor(level, message, err = null, info = {}) {
    this.level = level;
    this.message = typeof message === 'string' ? util.format(message) : util.format.apply(null, message);
    this.info = info;
    this.error = err;
  }
}

function isError(level) {
  return level === levels['ERROR'] || level === levels['FATAL'];
}



class Logger {
  constructor(services = {}, options = {}, level = levels['ALL']) {
    this._services = services;
    this._options = options;
    this._dateFormat = options.dateFormat || 'MMMM Do YYYY, h:mm:ss a';
    this._formatter = util.format.bind(null, '\[%s\] ');
    this.level = level;
  }

  info(message, info = {}) {
    if (this.level >= levels['INFO']) {
      return this._execLog(new LogMessage('INFO', message, null, info));
    }

    return false;
  }

  error(message, error, info = {}) {
    if (this.level >= levels['ERROR']) {
      return this._execLog(new LogMessage('ERROR', message, error, info));
    }

    return false;
  }

  verbose(message, error, info = {}) {
    if (this.level >= levels['VERBOSE']) {
      return this._execLog(new LogMessage('VERBOSE', message, error, info));
    }

    return false;
  }

  fatal(message, error, info = {}) {
    if (this.level >= levels['FATAL']) {
      return this._execLog(new LogMessage('FATAL', message, error, info));
    }

    return false;
  }

  _execLog(logMessage) {
    const message = this._formatter(
      logMessage.level,
      logMessage.message,
      '*' + moment(Date.now()).format(this._dateFormat) + '*'
    );

    if (this._options.console) {
      console.log(message);
    }
    
    if (logMessage.level === 'ERROR' && this._options.console) {
      console.error(message, logMessage.error);
    }

    let logConsole = null;
    if (this._services.file) {
      const logConsole = new console.Console(fs.createWriteStream(this._services.file, { flags: 'a' }));
      logConsole.log(message);
    }

    Object.keys(this._services)
      .forEach(service => {
        switch (service) {
          case 'file':
            
            break;
          case 'slack':
            logConsole = new console.Console(new SlackLogger({
              SLACK_WEBHOOK_URL: this._services.slack
            }));
            if (logMessage.level === 'ERROR' || logMessage.level === 'FATAL') {
              return logConsole.error(
                JSON.stringify(Object.assign(logMessage, {
                  message,
                  error: logMessage.error.name,
                  stack: logMessage.error.stack
                }))
              );
            }

            logConsole.log(JSON.stringify(Object.assign(logMessage, { message })));
            break;
          case 'console':
            break;
          default:
            break;

        }
      });

  }
}

logger = new Logger({ slack: 'https://hooks.slack.com/services/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' })
logger.fatal('hello', new Error('fuck'));
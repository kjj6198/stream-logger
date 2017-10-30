const request = require('request');
const Writable = require('stream').Writable;


class SlackLogger extends Writable {
  constructor(options) {
    super(options);
    this.options = options;
    this.SLACK_WEBHOOK_URL = options.SLACK_WEBHOOK_URL;
  }

  _write(chunk, encoding, callback) {
    const message = JSON.parse(chunk.toString());
    
    request.post(this.SLACK_WEBHOOK_URL, {
      form: {
        payload: JSON.stringify({
          channel: this.options.SLACK_CHANNEL || '#general',
          attachments: [
            {
              mrkdwn: true,
              mrkdwn_in: ['text', 'fields'],
              fallback: message.message,
              text: message.message,
              color: (message.level === 'ERROR' || message.level === 'FATAL') ? 'danger' : '#27cc95',
              fields: [
                {
                  title: message.error && 'ErrorType',
                  value: message.error || undefined
                },
                {
                  title: message.stack && 'Stack',
                  value: message.stack && '```\n' + message.stack + '\n```',
                },
              ].concat(Object.keys(message.info).map(key => ({ title: key, value: message.info[key] }))),
              footer: message.info.label || undefined,
              ts: Date.now() / 1000
            }
          ]
        })
      }
    }, (err, res, body) => {
      if (err) { callback(err); }
      if (body !== 'ok') { callback(body); }

      callback(null);
    })
  }
}

module.exports = SlackLogger;
const request = require('request');
const Writable = require('stream').Writable;

const postData = {
  attachments: [
    {
      channel: '#general',
      fallback: 'Required plain-text summary of the attachment.',
      color: '#27cc95',
      pretext: 'Optional text that appears above the attachment block',
      author_name: 'Bobby Tables',
      author_link: 'http://flickr.com/bobby/',
      author_icon: 'http://flickr.com/icons/bobby.jpg',
      title: 'Slack API Documentation',
      title_link: 'https://api.slack.com/',
      text: 'Optional text that appears within the attachment',
      fields: [
        {
          title: 'Priority',
          value: 'High',
          short: false
        }
      ],
      'image_url': 'http://my-website.com/path/to/image.jpg',
      'thumb_url': 'http://example.com/path/to/thumb.png',
      'footer': 'cronjob:mktevent',
      'ts': Date.now() / 1000
    }
]
  
}

// request.post('https://hooks.slack.com/services/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', {
//   form: {
//     payload: JSON.stringify(postData)
//   }
// }, console.log)

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
              mrkdwn_in: ['text'],
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
                  value: message.stack || undefined,
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
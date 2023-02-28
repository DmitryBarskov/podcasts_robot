const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const sqsClient = new SQSClient();
const DOWNLOAD_QUEUE_URL = process.env.DOWNLOAD_QUEUE_URL;
const DEFAULT_RESPONSE = {
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: '{"message":"ok"}',
};

const sendToQueue = async (messageBody) => {
  console.debug('Sending to Download Queue:', { DOWNLOAD_QUEUE_URL, messageBody });
  try {
    const output = await sqsClient.send(new SendMessageCommand({
      MessageBody: JSON.stringify(messageBody),
      QueueUrl: DOWNLOAD_QUEUE_URL,
    }));
    console.debug('Received response from SQS:', output);
    return output;
  } catch (err) {
    console.error('Error resopsne from SQS:', err);
  }
};

/**
 * @param {object} event telegram event schema:
 * {
 *   update_id, date, text, entities: [],
 *   message: {
 *     message_id,
 *     from: { id, is_bot, first_name, last_name, username, language_code },
 *     chat: { id, type, first_name, last_name, username }
 *   }
 * }
 */
exports.handler = async (event) => {
  const telegramEvent = JSON.parse(event.body);
  const message = telegramEvent.message ??
                  telegramEvent.edited_message ??
                  telegramEvent.channel_post;

  console.debug('Received telegram event:', telegramEvent);
  if (!message?.text) {
    console.error('Message not found / Unsupported event!');
    return DEFAULT_RESPONSE;
  }

  await sendToQueue({
    videoLink: message.text,
    chatId: message.chat.id,
    requestMessageId: message.message_id,
  });

  return DEFAULT_RESPONSE;
};

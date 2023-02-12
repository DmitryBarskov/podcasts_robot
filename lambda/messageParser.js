const ytdl = require('ytdl-core');
const withLogging = require('src/withLogging.js');
const respondWith = require('src/lambdaResponse.js');
const telegramMethod = require('src/telegramMethod.js');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const sqsClient = new SQSClient();
const QUEUE = process.env.QUEUE_URL;

const sendToQueue = async (messageBody) => {
  console.debug('Sending to SQS:', { url: QUEUE, messageBody });
  try {
    const output = await sqsClient.send(new SendMessageCommand({
      MessageBody: JSON.stringify(messageBody),
      QueueUrl: QUEUE,
    }));
    console.debug('Received response from SQS:', output);
    return output;
  } catch (err) {
    console.error('Error resopsne from SQS:', err);
  }
};

/**
 * telegram event schema:
 * {
 *   update_id, date, text, entities: [],
 *   message: {
 *     message_id,
 *     from: { id, is_bot, first_name, last_name, username, language_code },
 *     chat: { id, type, first_name, last_name, username }
 *   }
 * }
 */
exports.handler = withLogging(async (event) => {
  const telegramEvent = JSON.parse(event.body);
  const videoLink = telegramEvent?.message?.text;
  const isValidUrl = ytdl.validateURL(videoLink);

  console.debug('Received telegram event:', telegramEvent);

  if (!isValidUrl) {
    await telegramMethod('sendMessage', {
      chat_id: telegramEvent.message.chat.id,
      text: 'I\'m a robot! Send me a youtube video! 😋',
    });
    return respondWith({ message: 'ok' });
  }

  const info = await ytdl.getBasicInfo(videoLink);
  const trackTitle = `${info.videoDetails.title} -- ${info.videoDetails.author.name}`;

  let telegramResponse = telegramMethod('sendMessage', {
    chat_id: telegramEvent.message.chat.id,
    text: `You sent me ${trackTitle}`,
  });
  let queueResponse = sendToQueue({
    videoLink,
    chatId: telegramEvent.message.chat.id,
  });

  await Promise.all([telegramResponse, queueResponse]);

  return respondWith({ message: 'ok' });
});

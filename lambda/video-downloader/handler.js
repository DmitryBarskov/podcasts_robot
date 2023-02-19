const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const ytdl = require('ytdl-core');

const storeFile = require('./storeFile.js');

const sqsClient = new SQSClient();
const TELEGRAM_REQUEST_QUEUE_URL = process.env.TELEGRAM_REQUEST_QUEUE_URL;

const telegramMethod = async (messageBody) => {
  console.debug('Sending to SQS:', { TELEGRAM_REQUEST_QUEUE_URL, messageBody });
  try {
    const output = await sqsClient.send(new SendMessageCommand({
      MessageBody: JSON.stringify(messageBody),
      QueueUrl: TELEGRAM_REQUEST_QUEUE_URL,
    }));
    console.debug('Received response from SQS:', output);
    return output;
  } catch (err) {
    console.error('Error resopsne from SQS:', err);
  }
};

/**
 * @param {string} videoLink link to youtube video (validated arleady)
 * @param {number} chatId where to send audio file to
 * @param {number} requestMessageId messege which requested video to be downloaded
 */
const processRecord = async ({ videoLink, chatId, requestMessageId }) => {
  if (!ytdl.validateURL(videoLink)) {
    return await telegramMethod({
      type: 'invalidUrl',
      chatId, requestMessageId,
    });
  }

  let videoId = ytdl.getURLVideoID(videoLink);
  let videoInfo = await ytdl.getInfo(videoId);
  let format = ytdl.chooseFormat(videoInfo.formats, { quality: '140' });
  let details = videoInfo.videoDetails;
  let audio = ytdl(videoId, { format });

  let audioFileKey = `${videoId}.m4a`;
  let audioUrl = await storeFile(audioFileKey, audio);

  return await telegramMethod({
    type: 'downloadSuccess',
    chatId, requestMessageId,
    title: `${details.title} – ${details.author.name}`,
    audioData: [
      {
        performer: details.ownerChannelName,
        title: details.title,
        audio: audioUrl,
        duration: parseInt(details.lengthSeconds),
      }
    ],
  });
};

/**
 * Trigger from SQS schema:
 *
 * @param {object} event of type { Records: [ { body } ] },
 * where body is a JSON string. JSON.parse(body) = {
 *   videoLink, chatId, requestMessageId
 * }
 */
exports.handler = async (event) => {
  let promises = event.Records.map(record => {
    console.debug("Processing rec:", record);
    return processRecord(JSON.parse(record.body));
  });
  await Promise.all(promises);
  return Promise.resolve({});
};

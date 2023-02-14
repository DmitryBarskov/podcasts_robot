const ytdl = require('ytdl-core');
const fetch = require('node-fetch');
const FormData = require('form-data');

const withLogging = require('src/withLogging.js');
const telegramMethod = require('src/telegramMethod');
const storeFile = require('src/storeFile.js');

/**
 * @param {string} videoLink link to youtube video (validated arleady)
 * @param {number} chatId where to send audio file to
 * @param {number} requestMessageId messege which requested video to be downloaded
 * @param {number} responseMessageId message where to attach the file to
 */
const processRecord = async ({ videoLink, chatId, requestMessageId, responseMessageId }) => {
  let videoId = ytdl.getURLVideoID(videoLink);
  let videoInfo = await ytdl.getInfo(videoId);
  let format = ytdl.chooseFormat(videoInfo.formats, { quality: '140' });
  let details = videoInfo.videoDetails;
  let audio = ytdl(videoId, { format });

  let audioFileKey = `${videoId}.m4a`;
  let audioUrl = await storeFile(audioFileKey, audio);

  return telegramMethod('sendAudio', {
    body: {
      chat_id: chatId,
      performer: details.ownerChannelName,
      title: details.title,
      audio: audioUrl,
      duration: parseInt(details.lengthSeconds),
    },
  });
};

/**
 * Trigger from SQS schema:
 * event = { Records: [ { body } ] },
 * Where body is a JSON string. JSON.parse(body) = {
 *   videoLink, chatId, messageId
 * }
 */
exports.handler = withLogging(async (event) => {
  console.debug("event.Records:", event.Records);
  let promises = event.Records.map(record => {
    return processRecord(JSON.parse(record.body));
  });
  await Promise.all(promises);
  return {};
});

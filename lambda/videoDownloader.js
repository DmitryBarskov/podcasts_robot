const ytdl = require('ytdl-core');
const FormData = require('form-data');
const withLogging = require('src/withLogging.js');
const telegramMethod = require('./src/telegramMethod');
const fetch = require('node-fetch');
const fs = require('fs');

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
  let thumbnailUrl = details.thumbnails.reduce((prev, curr) => prev.height < curr.height ? prev : curr).url;
  let thumbnailImage = await fetch(thumbnailUrl);
  let audio = ytdl(videoId, { format });


  let audioFile = `/tmp/${videoId}.m4a`;
  audio.pipe(fs.createWriteStream(audioFile));
  console.debug('Downloaded audio:', videoLink);

  let thumbnailFile = `/tmp/${videoId}.jpg`;
  thumbnailImage.body.pipe(fs.createWriteStream(thumbnailFile));
  console.debug('Downloaded image:', thumbnailUrl);

  let form = new FormData();
  form.append('chat_id', chatId.toString());
  form.append('performer', details.ownerChannelName);
  form.append('title', details.title);
  form.append('thumb', fs.createReadStream(thumbnailFile), {
    filename: 'thumb.jpg', contentType: 'image/jpeg',
    knownLength: parseInt(thumbnailImage.headers.get('content-length')),
  });
  form.append('audio', fs.createReadStream(audioFile), {
    filename: `${details.title} - ${details.ownerChannelName}.m4a`,
    contentType: 'audio/mpeg',
    knownLength: parseInt(format.contentLength),
  });

  console.log('Form created!');

  return await telegramMethod('sendAudio', {
    headers: form.getHeaders(),
    body: form,
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

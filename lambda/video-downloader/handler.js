const ytdl = require('ytdl-core');
const { slugify } = require('transliteration');

const fetchAudioData = require('./fetchAudioData.js');
const { splitAudioStream, cleanUp } = require('./splitAudioStream.js');
const storeFile = require('./storeFile.js');
const telegramApi = require('./telegramApi.js');

/**
 * @param {string} videoLink link to youtube video (validated arleady)
 * @param {number} chatId where to send audio file to
 * @param {number} requestMessageId messege which requested video to be downloaded
 */
const processRecord = async ({ videoLink, chatId, requestMessageId }) => {
  if (!ytdl.validateURL(videoLink)) {
    return await telegramApi({
      type: 'invalidUrl',
      chatId, requestMessageId,
    });
  }

  let {
    audio, videoId, performer, title, durationS, sizeMb
  } = await fetchAudioData(videoLink);
  console.debug('Downloading', { videoId, performer, title, durationS, sizeMb });
  let chunks = await splitAudioStream(audio, {
    maxSegmentSizeMb: 19.9, sizeMb, durationS,
    dirname: videoId, prefix: slugify(`${title} - ${performer}`),
  });

  console.debug('Downloaded chunks:', chunks);

  const telegramAudios = chunks.map(async (chunk) => {
    let url = await storeFile(chunk.tmpPath, chunk.stream);

    return {
      audio: url,
      title: chunk.filename,
      performer: performer,
      duration: chunk.segmentDurationS,
    };
  });

  return await telegramApi({
    type: 'downloadSuccess',
    chatId, requestMessageId,
    audioData: await Promise.all(telegramAudios),
  }).then((...args) => {
    cleanUp(videoId);
    return args;
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

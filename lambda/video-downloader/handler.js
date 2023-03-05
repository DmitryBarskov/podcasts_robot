const ytdl = require('ytdl-core');
const { slugify } = require('transliteration');

const fetchAudioData = require('./fetchAudioData.js');
const { splitAudioStream, cleanUp } = require('./splitAudioStream.js');
const storeFile = require('./storeFile.js');
const telegramApi = require('./telegramApi.js');
const withTimeout = require('./withTimeout.js');

/**
 * @param {string} videoLink link to youtube video (validated arleady)
 * @param {number} chatId where to send audio file to
 * @param {number} requestMessageId messege which requested video to be downloaded
 */
const processRecord = async ({ videoLink, chatId, requestMessageId }) => {
  if (!ytdl.validateURL(videoLink)) {
    return await telegramApi({
      type: 'invalidUrl',
      chatId,
      requestMessageId,
    });
  }

  const {
    audio, videoId, performer, title, durationS, sizeMb
  } = await fetchAudioData(videoLink).catch((err) => {
    console.error('Error fetching data from YouTube', err);
    throw err;
  });

  console.debug('Downloading', { videoId, performer, title, durationS, sizeMb });
  const chunks = await splitAudioStream(audio, {
    maxSegmentSizeMb: 19.9,
    sizeMb,
    durationS,
    dirname: videoId,
    prefix: slugify(`${title} - ${performer}`),
  });

  console.debug('Downloaded chunks:', chunks);

  const telegramAudios = chunks.map(async (chunk) => {
    const url = await storeFile(chunk.tmpPath, chunk.stream);

    return {
      audio: url,
      title: chunk.filename,
      performer,
      duration: chunk.segmentDurationS,
    };
  });

  console.debug('Sending to telegram...')
  return await telegramApi({
    type: 'downloadSuccess',
    chatId,
    requestMessageId,
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
  await withTimeout(async () => {
    const promises = event.Records.map((record) => {
      console.debug('Processing rec:', record);
      return processRecord(JSON.parse(record.body));
    });
    await Promise.all(promises);
    console.debug('All records processed!');
    return Promise.resolve({});
  }, 150_000).catch((err) => {
    console.error(err);
  });
  console.debug('All records processed!');
  return Promise.resolve({});
};

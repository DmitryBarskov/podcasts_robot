const telegramMethod = require("./telegramMethod.js");
const randomEmoji = require('./randomEmoji.js');

const processRecord = async (event) => {
  if (event.type == 'invalidUrl') {
    return await telegramMethod('sendMessage', {
      body: {
        chat_id: event.chatId,
        reply_to_message_id: event.requestMessageId,
        text: `I'm a robot! Send me a youtube video! ${randomEmoji()}`
      },
    });
  } else if (event.type == 'downloadSuccess') {
    const sendTitle = telegramMethod('sendMessage', {
      body: {
        chat_id: event.chatId,
        reply_to_message_id: event.requestMessageId,
        text: event.title,
      },
    });
    const sendAudioChunks = event.audioData.map(chunk => {
      return telegramMethod('sendAudio', {
        body: {
          chat_id: event.chatId,
          reply_to_message_id: event.requestMessageId,
          allow_sending_without_reply: true,
          protect_content: true,
          ...chunk,
        },
      });
    });
    return await Promise.all([sendTitle, ...sendAudioChunks]);
  } else {
    console.error('Unsupported event!', event);
    return {};
  }
};

/**
 * Trigger from SQS schema:
 *
 * @param {object} event of type { Records: [ { body } ] },
 * where body is a JSON string. JSON.parse(body) = {
 *    type: 'downloadFailure' | 'downloadSuccess',
 *    chatId, requestMessageId, audioData?
 * }
 */
exports.handler = async (event) => {
  let promises = event.Records.map(record => {
    console.debug("Processing rec:", record);
    return processRecord(JSON.parse(record.body));
  });
  await Promise.all(promises);
  return {};
};

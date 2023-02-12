const fetch = require('node-fetch');

const BOT_TOKEN = process.env.BOT_TOKEN;

/**
 * Calls given method from Telegram Bot API
 *
 * @param {string} method https://core.telegram.org/bots/api#available-methods
 * @param {object} body parameters for the method
 * @returns {Promise} parsed response from telegram
 */
const telegramMethod = (method, body = null) => {
  console.debug('Sending request to telegram:', method, body);
  return fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: body ? JSON.stringify(body) : '',
  }).then(r => r.json()).then(response => {
    console.debug('Received response from telegram:', response);
    return response;
  });
};

module.exports = telegramMethod;

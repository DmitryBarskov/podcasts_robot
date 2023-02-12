#!/usr/bin/env node

import { request } from 'https';

const asyncRequest = (options: any): Promise<string> => {
  return new Promise((resolve, reject) => {
    request(options, (response) => {
      let data: string[] = [];

      response.on('data', (chunk) => data.push(chunk));
      response.on('end', () => { resolve(data.join("")) });
    }).on('error', (err) => {
      reject(err);
    }).end(options.body ?? '');
  });
};

const BOT_TOKEN = process.env['BOT_TOKEN'] ?? (() => { throw new Error('Missing BOT_TOKEN env')})();
const WEBHOOK_URL = process.env['WEBHOOK_URL'];

if (WEBHOOK_URL) {
  asyncRequest({
    method: 'POST', host: 'api.telegram.org', port: 443,
    path: `/bot${BOT_TOKEN}/setWebhook`,
    headers: { 'Content-Type': 'application/json', },
    body: JSON.stringify({ url: WEBHOOK_URL })
  }).then(resp => console.log(resp))
    .catch(err => console.error(err));
} else {
  asyncRequest({
    method: 'POST', host: 'api.telegram.org', port: 443,
    path: `/bot${BOT_TOKEN}/deleteWebhook`,
    headers: { 'Content-Type': 'application/json', },
  }).then(resp => console.log(resp))
    .catch(err => console.error(err));
}

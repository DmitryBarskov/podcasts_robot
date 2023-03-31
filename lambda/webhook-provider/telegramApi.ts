import fetch from 'node-fetch';

export interface TelegramResponse {
  ok: boolean
}

const BOT_TOKEN = process.env.BOT_TOKEN ?? '';

const fetchJson = async (method: string, options: { body?: string } = {}): Promise<TelegramResponse> => {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  console.info('Sending request to telegram', [url, options]);

  return await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    ...options
  }).then(async (r) => await r.json()) as TelegramResponse;
};

export const setWebhook = async (webhookUrl: string): Promise<TelegramResponse> =>
  await fetchJson('setWebhook', {
    body: JSON.stringify({ url: webhookUrl }),
  });

export const deleteWebhook = async (): Promise<TelegramResponse> =>
  await fetchJson('deleteWebhook');

import fetch from 'node-fetch';

export type TelegramResponse = {
  ok: boolean;
};

const BOT_TOKEN = process.env.BOT_TOKEN;

export const setWebhook = async (webhookUrl: string): Promise<TelegramResponse> => {
  const fetchArgs: [string, object] = [
    `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ url: webhookUrl }),
    }
  ];
  console.info('Sending request to telegram', fetchArgs);
  return await fetch(...fetchArgs).then((r) => r.json()) as TelegramResponse;
};

export const deleteWebhook = async (): Promise<TelegramResponse> => {
  const fetchArgs: [string, object] = [
    `https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    }
  ];
  console.info('Sending request to telegram', fetchArgs);
  return await fetch(...fetchArgs).then((r) => r.json()) as TelegramResponse;
};

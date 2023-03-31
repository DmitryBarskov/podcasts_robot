import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { TelegramApi } from './telegram-api';
import { VideoDownloader } from './lambda-video-downloader';
import { BotEntrypoint } from './bot-entrypoint';
import { TelegramWebhook } from './telegram-webhook';

export interface PodcastsRobotStackProps extends StackProps {
  botToken: string
}

export class PodcastsRobotStack extends Stack {
  constructor(scope: Construct, id: string, props: PodcastsRobotStackProps) {
    super(scope, id, props);

    const botEntrypoint = new BotEntrypoint(this, 'BotEntrypointConstruct', {});

    const telegramApi = new TelegramApi(this, 'TelegramApiConstruct', props);

    new VideoDownloader(this, 'VideoDownloaderConstruct', {
      telegramApiRequestQueue: telegramApi.requestQueue,
      downloadRequestQueue: botEntrypoint.downloadRequestQueue,
    });

    const webhook = new TelegramWebhook(this, 'TelegramWebhook', {
      botToken: props.botToken,
      webhookUrl: botEntrypoint.entrypointUrl,
    });

    new CfnOutput(this, 'WebhookSetResponse', {
      value: webhook.response,
    });
  }
}

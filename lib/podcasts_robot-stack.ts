import { Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { TelegramApi, TelegramApiProps } from './telegram-api';
import { VideoDownloader } from './lambda-video-downloader';
import { BotEntrypoint } from './bot-entrypoint';

export interface PodcastsRobotStackProps extends TelegramApiProps {
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
  }
}

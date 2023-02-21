import { Stack, StackProps, Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

export interface PodcastsRobotStackProps extends StackProps {
  botToken: string
}

export class PodcastsRobotStack extends Stack {
  constructor(scope: Construct, id: string, props: PodcastsRobotStackProps) {
    super(scope, id, props);

    const downloadRequestQueue = new Queue(this, 'DownloadRequestQueue');

    const telegramRequestQueue = new Queue(this, 'TelegramRequestQueue', {
      visibilityTimeout: Duration.seconds(300),
    });

    const botEntrypoint = new lambda.Function(this, 'BotEntrypoint', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('lambda/bot-entrypoint'),
      handler: 'handler.handler',
      environment: {
        DOWNLOAD_QUEUE_URL: downloadRequestQueue.queueUrl,
      },
    });
    const _gateway = new LambdaRestApi(this, 'Endpoint', {
      handler: botEntrypoint,
    });
    downloadRequestQueue.grantSendMessages(botEntrypoint);

    const podcastsStorage = new Bucket(this, 'PodcastsStorage', {
      bucketName: 'podcastsrobot',
      removalPolicy: RemovalPolicy.RETAIN,
      publicReadAccess: true,
    });
    const videoDownloader = new lambda.Function(this, 'VideoDownloader', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('lambda/video-downloader'),
      handler: 'handler.handler',
      timeout: Duration.seconds(3 * 60),
      memorySize: 480,
      architecture: lambda.Architecture.ARM_64,
      environment: {
        BOT_TOKEN: props.botToken,
        BUCKET: podcastsStorage.bucketName,
        TELEGRAM_REQUEST_QUEUE_URL: telegramRequestQueue.queueUrl,
      },
    });
    videoDownloader.addEventSource(new SqsEventSource(downloadRequestQueue));
    downloadRequestQueue.grantConsumeMessages(videoDownloader);
    podcastsStorage.grantReadWrite(videoDownloader);

    const telegramApi = new lambda.Function(this, 'TelegramApi', {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset('lambda/telegram-api'),
      handler: 'handler.handler',
      environment: {
        BOT_TOKEN: props.botToken,
      },
    });
    telegramApi.addEventSource(new SqsEventSource(telegramRequestQueue));
    telegramRequestQueue.grantConsumeMessages(telegramApi);
    telegramRequestQueue.grantSendMessages(videoDownloader);
  }
}

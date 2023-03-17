import { Duration, RemovalPolicy, StackProps } from "aws-cdk-lib";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Queue } from "aws-cdk-lib/aws-sqs";
import { Construct } from "constructs";
import { Function, Runtime, Code, Architecture } from 'aws-cdk-lib/aws-lambda';

export interface VideoDownloaderProps extends StackProps {
  downloadRequestQueue: Queue,
  telegramApiRequestQueue: Queue,
}

export class VideoDownloader extends Construct {
  static readonly timeout = Duration.minutes(3);

  constructor (scope: Construct, id: string, props: VideoDownloaderProps) {
    super(scope, id);

    const podcastsStorage = new Bucket(this, 'PodcastsStorage', {
      bucketName: 'podcasts-robot',
      removalPolicy: RemovalPolicy.RETAIN,
      publicReadAccess: true,
    });

    const { telegramApiRequestQueue } = props;

    const videoDownloader = new Function(this, 'VideoDownloader', {
      runtime: Runtime.NODEJS_16_X,
      code: Code.fromAsset('lambda/video-downloader'),
      handler: 'handler.handler',
      timeout: VideoDownloader.timeout,
      memorySize: 480,
      architecture: Architecture.ARM_64,
      environment: {
        BUCKET: podcastsStorage.bucketName,
        TELEGRAM_REQUEST_QUEUE_URL: telegramApiRequestQueue.queueUrl,
      },
    });
    telegramApiRequestQueue.grantSendMessages(videoDownloader);
    podcastsStorage.grantReadWrite(videoDownloader);

    const { downloadRequestQueue } = props;
    videoDownloader.addEventSource(new SqsEventSource(downloadRequestQueue));
    downloadRequestQueue.grantConsumeMessages(videoDownloader);
  }
}

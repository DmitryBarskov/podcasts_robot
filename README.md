# podcasts_robot

It is a telegram bot used to download audio files from YouTube.
It supports long videos too! Despite the telegram limitation on file size.

## Architecture

```


                                AWS Lambda                            (AWS SQS)
|----------|               |----------------|                 |------------------------|
| Telegram | -- webhook -> | bot-entrypoint | -- pushes to -> | download request queue |
|----------|               |----------------|                 |------------------------|



        (AWS SQS)                              AWS Lambda                               [AWS SQS]
|------------------------|                |------------------|                 |------------------------|
| download request queue | -- triggers -> | video downloader | -- pushes to -> | telegram request queue |
|------------------------|                |------------------|                 |------------------------|
                                                   |
                                           downloads audio to
                                                   |
                                                   V
                                               S3 Bucket
                                          |------------------|
                                          | podcasts storage |
                                          |------------------|
                                                 ^
                                                 |
                                      serves public files from
                                                 |
        [AWS SQS]                            AWS Lambda
|------------------------|                |--------------|                     |----------|
| telegram request queue | -- triggers -> | telegram api | -- http requests -> | Telegram |
|------------------------|                |--------------|                     |----------|

```

## Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template

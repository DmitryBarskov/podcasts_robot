import { IFunction } from 'aws-cdk-lib/aws-lambda';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

class TelegramBotProvider {
  constructor(scope: Construct, id: string, onEventHandler: IFunction) {
    new cr.Provider(scope, id, {
      onEventHandler,
    });
  }
}

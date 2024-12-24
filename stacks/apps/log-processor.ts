// eslint-disable-next-line import/no-extraneous-dependencies
import * as cdk from 'aws-cdk-lib';

export function createLogProcessor(
  stack: cdk.Stack,
  prefix: string,
  env: string,
  prop: {
    architecture: cdk.aws_lambda.Architecture;
    layers: cdk.aws_lambda.ILayerVersion[];
    runtime: cdk.aws_lambda.Runtime;
    memorySize: number;
    timeout: cdk.Duration;
    loggingFormat: cdk.aws_lambda.LoggingFormat;
    logLevel: cdk.aws_lambda.ApplicationLogLevel;
    openSearchUrl: string;
  },
) {
  const {
    architecture,
    layers,
    runtime,
    memorySize,
    timeout,
    loggingFormat,
    logLevel,
    openSearchUrl,
  } = prop;

  const secretsMgr = new cdk.aws_secretsmanager.Secret(stack, 'SecretsMgrLogProcessor', {
    secretName: `${prefix}-${env}-log-processor`,
  });
  const openSearchToken = secretsMgr
    .secretValueFromJson('openSearchToken')
    .unsafeUnwrap()
    .toString();

  const handlerLog = new cdk.aws_lambda.Function(stack, 'FnLogProcessorLog', {
    architecture,
    layers,
    runtime,
    memorySize,
    timeout,
    code: cdk.aws_lambda.Code.fromAsset('dist/apps/log-processor'),
    handler: 'main.logsHandler',
    loggingFormat,
    applicationLogLevelV2: logLevel,
    reservedConcurrentExecutions: 1,
    environment: {
      PREFIX: prefix,
      NODE_ENV: env,
      NODE_OPTIONS: '--enable-source-maps',
      OPENSEARCH_URL: openSearchUrl,
      OPENSEARCH_TOKEN: openSearchToken,
    },
  });

  const logGroupMakerSqs = new cdk.aws_logs.LogGroup(stack, 'LgGrLogProcessorLog', {
    logGroupName: `/aws/lambda/${handlerLog.functionName}`,
    retention: cdk.aws_logs.RetentionDays.ONE_MONTH,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
  });

  return { handlerLog, logGroupMakerSqs };
}

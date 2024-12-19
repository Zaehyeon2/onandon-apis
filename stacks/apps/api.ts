/* eslint-disable import/no-extraneous-dependencies */
import * as cdk from 'aws-cdk-lib';

export function createApi(
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
  },
) {
  const { architecture, layers, runtime, memorySize, timeout, loggingFormat, logLevel } = prop;

  //  API LAMBDA FUNCTION
  const handlerApi = new cdk.aws_lambda.Function(stack, 'FnApi', {
    architecture,
    layers,
    runtime,
    timeout,
    memorySize,
    code: cdk.aws_lambda.Code.fromAsset('dist/apps/api'),
    handler: 'main.apiHandler',
    loggingFormat,
    applicationLogLevelV2: logLevel,
    environment: {
      SERVICE_NAME: 'api',
      NODE_ENV: env,
      NODE_OPTIONS: '--enable-source-maps',
    },
  });

  const logGroupApi = new cdk.aws_logs.LogGroup(stack, 'LgGrApi', {
    logGroupName: `/aws/lambda/${handlerApi.functionName}`,
    retention: cdk.aws_logs.RetentionDays.ONE_MONTH,
    removalPolicy: cdk.RemovalPolicy.DESTROY,
  });

  // MAINTENANCE DDB TABLE
  const ddbTableMaintenance = new cdk.aws_dynamodb.Table(stack, 'DdbMaintenance', {
    partitionKey: { name: 'type', type: cdk.aws_dynamodb.AttributeType.STRING },
    tableName: `${prefix}-${env}-maintenance`,
    billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
    pointInTimeRecovery: true,
  });

  ddbTableMaintenance.grantReadWriteData(handlerApi);

  // USER DDB TABLE
  const ddbTableUser = new cdk.aws_dynamodb.Table(stack, 'DdbTableUser', {
    partitionKey: { name: 'id', type: cdk.aws_dynamodb.AttributeType.STRING },
    tableName: `${prefix}-${env}-user`,
    billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
    pointInTimeRecovery: true,
  });

  ddbTableUser.addGlobalSecondaryIndex({
    indexName: 'idxPhoneNumber',
    partitionKey: { name: 'phoneNumber', type: cdk.aws_dynamodb.AttributeType.STRING },
  });

  ddbTableUser.grantReadWriteData(handlerApi);

  return {
    handlerApi,
    logGroupApi,
    ddbTableMaintenance,
    ddbTableUser,
  };
}

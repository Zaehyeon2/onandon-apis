/* eslint-disable no-new */
/* eslint-disable import/no-extraneous-dependencies */
import * as cdk from 'aws-cdk-lib';
import { SubnetFilter } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { createApi } from './apps/api';
import { createLogProcessor } from './apps/log-processor';
import { createApiGateway } from './components/apigateway';

type Properties = {
  awsEnv?: cdk.Environment;
  externalResources?: {
    openSearchUrl: string;
    publicApiGateway: {
      zoneName: string;
      hostedZoneId: string;
      domainName: string;
      certificateArn: string;
      sourceIps: string[];
    };
  };
};

export class ServiceStack extends cdk.Stack {
  constructor(scope: Construct, prefix: string, env: string, props: Properties) {
    const { awsEnv, externalResources } = props;

    super(scope, `${prefix}-${env}`, { env: awsEnv });

    let architecture = cdk.aws_lambda.Architecture.ARM_64;
    if (env === 'local' && process.env.ARCH !== 'arm') {
      architecture = cdk.aws_lambda.Architecture.X86_64;
    }

    const layers = [];
    if (env !== 'local') {
      layers.push(
        // lambda insight extension for signal handler
        cdk.aws_lambda.LayerVersion.fromLayerVersionArn(
          this,
          'LyrLambdaInsight',
          'arn:aws:lambda:ap-northeast-1:580247275435:layer:LambdaInsightsExtension-Arm64:31',
        ),
      );
    }

    let openSearchUrl = 'http://localhost:9200';
    const vpc = new cdk.aws_ec2.Vpc(this, 'Vpc');
    const vpcSubnet = new cdk.aws_ec2.Subnet(this, 'Subnet', {
      vpcId: vpc.vpcId,
      availabilityZone: vpc.availabilityZones[0]!,
      cidrBlock: vpc.vpcCidrBlock,
    });
    const securityGroup = new cdk.aws_ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc,
    });
    const vpcSubnets = vpc.selectSubnets({
      subnetFilters: [SubnetFilter.byIds([vpcSubnet.subnetId])],
    });

    let publicZoneName = 'publiczonename';
    let publicHostedZoneId = 'publichostedzoneid';
    let publicDomainName = 'publicdummydomain.io';
    let publicCertificateArn = 'publiccertificatearn';
    let publicSourceIps: string[] = [];

    if (env !== 'local' && externalResources) {
      openSearchUrl = externalResources.openSearchUrl;
      publicZoneName = externalResources.publicApiGateway.zoneName;
      publicHostedZoneId = externalResources.publicApiGateway.hostedZoneId;
      publicDomainName = externalResources.publicApiGateway.domainName;
      publicCertificateArn = externalResources.publicApiGateway.certificateArn;
      publicSourceIps = externalResources.publicApiGateway.sourceIps;
    }

    const runtime = cdk.aws_lambda.Runtime.NODEJS_20_X;
    const memorySize = 512;
    const timeout = cdk.Duration.seconds(20);
    const loggingFormat = cdk.aws_lambda.LoggingFormat.JSON;
    const logLevel = cdk.aws_lambda.ApplicationLogLevel.DEBUG;

    const api = createApi(this, prefix, env, {
      architecture,
      layers,
      runtime,
      timeout,
      memorySize,
      loggingFormat,
      logLevel,
    });

    const logProcessor = createLogProcessor(this, prefix, env, {
      architecture,
      layers,
      runtime,
      timeout,
      memorySize,
      loggingFormat,
      logLevel,
      openSearchUrl,
      vpc,
      securityGroups: [securityGroup],
      vpcSubnets,
    });

    const publicApiGw = createApiGateway(this, prefix, env, 'Public', {
      zoneName: publicZoneName,
      hostedZoneId: publicHostedZoneId,
      domainName: publicDomainName,
      certificateArn: publicCertificateArn,
      sourceIps: publicSourceIps,
    });

    publicApiGw.apigateway.root.addResource('api').addProxy({
      defaultIntegration: new cdk.aws_apigateway.LambdaIntegration(api.handlerApi, {
        proxy: true,
      }),
    });

    // lambda subscription for ES
    const logTargets = [{ logGroup: api.logGroupApi, name: 'AdminApi' }];

    logTargets.forEach((target) => {
      new cdk.aws_logs.SubscriptionFilter(this, `Sub${target.name}`, {
        logGroup: target.logGroup,
        destination: new cdk.aws_logs_destinations.LambdaDestination(logProcessor.handlerLog),
        filterPattern: cdk.aws_logs.FilterPattern.anyTerm(
          'ServiceLogger',
          'NestLogger',
          'AccessLogger',
        ),
      });
    });

    // Lambda ARN 출력
    new cdk.CfnOutput(this, 'CommentApiHandlerArn', {
      value: api.handlerApi.functionArn,
      description: 'The ARN of the Comment Api Handler',
    });
  }
}

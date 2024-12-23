/* eslint-disable import/no-extraneous-dependencies */
import * as cdk from 'aws-cdk-lib';

export function createApiGateway(
  stack: cdk.Stack,
  prefix: string,
  env: string,
  name: string,
  props: {
    zoneName: string;
    hostedZoneId: string;
    domainName: string;
    certificateArn: string;
    sourceIps: string[];
  },
) {
  const { sourceIps, zoneName, hostedZoneId, domainName, certificateArn } = props;

  const apigateway = new cdk.aws_apigateway.RestApi(stack, `ApiGw${name}`, {
    restApiName: `${prefix}-${env}-${name.toLowerCase()}-api-gateway`,
    endpointConfiguration: {
      // route53 domain이 REGIONAL 이므로 REGIONAL로 설정
      // EDGE 서비스는 CloudFlare를 사용하게 된다
      types: [cdk.aws_apigateway.EndpointType.REGIONAL],
    },
    disableExecuteApiEndpoint: true,
    policy: new cdk.aws_iam.PolicyDocument({
      statements: [
        new cdk.aws_iam.PolicyStatement({
          effect: cdk.aws_iam.Effect.ALLOW,
          principals: [new cdk.aws_iam.ArnPrincipal('*')],
          actions: ['execute-api:Invoke'],
          resources: ['execute-api:/*/*/*'], // Allow invoke on any resource
          conditions: {
            IpAddress: { 'aws:SourceIp': sourceIps }, // IP ACL
          },
        }),
      ],
    }),
  });

  // 403 오류 응답 사용자 정의 - ACL에 걸렸을 경우
  apigateway.addGatewayResponse('AccessDenied', {
    type: cdk.aws_apigateway.ResponseType.ACCESS_DENIED,
    statusCode: '403',
    templates: {
      'application/json': JSON.stringify({
        message: 'Access Denied. Source IP is not allowed.',
      }),
    },
  });

  /**
   * Route53
   */

  // 기존 ACM 인증서 가져오기
  const certificate = cdk.aws_certificatemanager.Certificate.fromCertificateArn(
    stack,
    `CertApiGw${name}`,
    certificateArn,
  );

  // 사용자 지정 도메인 이름 생성
  const customDomain = new cdk.aws_apigateway.DomainName(stack, `DmnApiGw${name}`, {
    domainName,
    certificate,
    endpointType: cdk.aws_apigateway.EndpointType.REGIONAL,
  });

  // API를 사용자 지정 도메인에 매핑
  const baseMapping = new cdk.aws_apigateway.BasePathMapping(stack, `BPMapApiGw${name}`, {
    domainName: customDomain,
    restApi: apigateway,
    stage: apigateway.deploymentStage,
  });

  // 호스팅 존 가져오기
  const hostedZone = cdk.aws_route53.HostedZone.fromHostedZoneAttributes(stack, `HzApiGw${name}`, {
    zoneName,
    hostedZoneId,
  });

  // Route 53 A 레코드 생성
  const aliasRecord = new cdk.aws_route53.ARecord(stack, `ARcdApiGw${name}`, {
    zone: hostedZone,
    recordName: domainName,
    target: cdk.aws_route53.RecordTarget.fromAlias(
      new cdk.aws_route53_targets.ApiGatewayDomain(customDomain),
    ),
  });

  // Create a WAF WebACL
  const webAcl = new cdk.aws_wafv2.CfnWebACL(stack, 'PublicWebACL', {
    scope: 'REGIONAL',
    name: `${prefix}-${env}-public-web-acl`,
    defaultAction: { allow: {} },
    visibilityConfig: {
      cloudWatchMetricsEnabled: true,
      metricName: `${prefix}-${env}-public-web-acl`,
      sampledRequestsEnabled: true,
    },
    rules: [
      {
        name: 'IpRateLimitRule',
        priority: 1,
        action: { block: {} },
        statement: {
          rateBasedStatement: {
            limit: 10,
            evaluationWindowSec: 1,
            aggregateKeyType: 'IP',
          },
        },
        visibilityConfig: {
          cloudWatchMetricsEnabled: true,
          metricName: `${prefix}-${env}-ip-rate-limit-rule`,
          sampledRequestsEnabled: true,
        },
      },
    ],
  });

  // Associate the WAF with the API Gateway
  // eslint-disable-next-line no-new
  new cdk.aws_wafv2.CfnWebACLAssociation(stack, 'PublicWebACLAssociation', {
    resourceArn: `arn:aws:apigateway:${stack.region}::/restapis/${apigateway.restApiId}/stages/prod`, // Adjust to reflect correct stage
    webAclArn: webAcl.attrArn,
  });

  return { apigateway, baseMapping, aliasRecord, customDomain, certificate };
}

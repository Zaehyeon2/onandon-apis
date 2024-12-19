/* eslint-disable no-new */
/* eslint-disable import/no-extraneous-dependencies */
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ServiceStack } from './service.stack';

const STACK_NAME_PREFIX = 'onandon-apis';
const envs = [
  {
    // local sam client 실행을 위한 환경이므로 실제 AWS 정보는 필요 없음
    name: 'local',
    props: {},
  },
  {
    name: 'dq',
    props: {
      awsEnv: {
        account: '058264460122',
        region: 'ap-northeast-2',
      },
      externalResources: {
        openSearchUrl: '',
        publicApiGateway: {
          zoneName: 'dq.onandon.io', // Route 53 도메인 이름
          hostedZoneId: 'Z0566760LH9IZGG2XQRL', // Route 53 호스팅 존 ID
          domainName: 'api-origin.dq.onandon.io',
          certificateArn:
            'arn:aws:acm:ap-northeast-1:058264460122:certificate/8959ba91-b538-4e61-a727-eb6c7479e591',
          sourceIps: [
            // Cloudflare 서버 IP. 참고: https://www.cloudflare.com/ips/
            '103.21.244.0/22',
            '103.22.200.0/22',
            '103.31.4.0/22',
            '104.16.0.0/13',
            '104.24.0.0/14',
            '108.162.192.0/18',
            '131.0.72.0/22',
            '141.101.64.0/18',
            '162.158.0.0/15',
            '172.64.0.0/13',
            '173.245.48.0/20',
            '188.114.96.0/20',
            '190.93.240.0/20',
            '197.234.240.0/22',
            '198.41.128.0/17',
          ],
        },
      },
    },
  },
  {
    name: 'live',
    props: {
      awsEnv: {
        account: '000000000001',
        region: 'ap-northeast-2',
      },
      externalResources: {
        openSearchUrl: '',
        publicApiGateway: {
          zoneName: 'onandon.io', // Route 53 도메인 이름
          hostedZoneId: 'Z069513733O37Y2HNVATU', // Route 53 호스팅 존 ID
          domainName: 'api-origin.onandon.io',
          certificateArn:
            'arn:aws:acm:ap-northeast-1:000000000001:certificate/c26e70cd-b6dc-44a0-8e89-671ed91f624b',
          sourceIps: [],
        },
      },
    },
  },
];

const app = new cdk.App();

envs.forEach((env) => {
  new ServiceStack(app, STACK_NAME_PREFIX, env.name, env.props);
});

/* eslint-disable import/no-extraneous-dependencies */
import * as cdk from 'aws-cdk-lib';

export class SfnLambdaScheduler {
  constructor(
    stack: cdk.Stack,
    prefix: string,
    env: string,
    name: string,
    functions: cdk.aws_lambda.IFunction[],
    waitSeconds: number,
    iterationInMinutes: number,
  ) {
    // do nothing

    // 반복 횟수를 추적할 수 있는 상태 변수 초기화
    const startState = new cdk.aws_stepfunctions.Pass(stack, 'Initialize', {
      result: cdk.aws_stepfunctions.Result.fromObject({ count: 0 }),
      resultPath: '$.iterator',
    });

    // Parallel 상태 정의
    const parallelState = new cdk.aws_stepfunctions.Parallel(stack, 'InvokeParallel', {
      resultPath: cdk.aws_stepfunctions.JsonPath.DISCARD,
    });

    // parallelState에 invoke 할 함수 추가
    functions.forEach((func, index) => {
      parallelState.branch(
        new cdk.aws_stepfunctions_tasks.LambdaInvoke(stack, `Invoke_${index}`, {
          lambdaFunction: func,
        })
          .addCatch(new cdk.aws_stepfunctions.Succeed(stack, `Invoke_${index}_Failed`), {})
          .next(new cdk.aws_stepfunctions.Succeed(stack, `Invoke_${index}_Succeed`)),
      );
    });

    const parallelStateWithIncrement = parallelState.next(
      // 실행 후 반복 횟수 증가
      new cdk.aws_stepfunctions.Pass(stack, 'IncrementCount', {
        resultPath: '$.iterator',
        parameters: {
          'count.$': 'States.MathAdd($.iterator.count, 1)',
        },
      }),
    );

    // Step Functions 상태 정의
    const waitState = new cdk.aws_stepfunctions.Wait(stack, 'Wait', {
      time: cdk.aws_stepfunctions.WaitTime.duration(cdk.Duration.seconds(waitSeconds)),
    }).next(parallelStateWithIncrement);

    // 반복 수행 여부를 결정할 Choice 상태
    const choiceState = new cdk.aws_stepfunctions.Choice(stack, 'IsCountReached')
      .when(
        cdk.aws_stepfunctions.Condition.numberLessThanEquals(
          '$.iterator.count',
          iterationInMinutes,
        ),
        waitState,
      )
      .otherwise(new cdk.aws_stepfunctions.Succeed(stack, 'Finished'));

    // 상태 머신 정의
    const definition = startState.next(parallelStateWithIncrement).next(choiceState);

    const stateMachine = new cdk.aws_stepfunctions.StateMachine(stack, name, {
      stateMachineName: `${prefix}-${env}-${name}`,
      definitionBody: cdk.aws_stepfunctions.DefinitionBody.fromChainable(definition),
      stateMachineType: cdk.aws_stepfunctions.StateMachineType.EXPRESS,
      timeout: cdk.Duration.minutes(1), // 상태 머신의 전체 타임아웃 설정
      logs: {
        destination: new cdk.aws_logs.LogGroup(stack, `LgGr${name}`, {
          logGroupName: `/aws/states/${prefix}-${env}-${name}`,
          retention: cdk.aws_logs.RetentionDays.ONE_MONTH,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
        includeExecutionData: true,
        level: cdk.aws_stepfunctions.LogLevel.ALL,
      },
    });

    // CloudWatch Events 규칙 생성 및 Step Functions 호출
    const rule = new cdk.aws_events.Rule(stack, `CwRule${name}`, {
      schedule: cdk.aws_events.Schedule.rate(cdk.Duration.minutes(1)), // 1분 간격으로 실행
    });

    rule.addTarget(new cdk.aws_events_targets.SfnStateMachine(stateMachine));
  }
}

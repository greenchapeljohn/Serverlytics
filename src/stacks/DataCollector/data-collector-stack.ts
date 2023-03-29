import { GoFunction } from '@aws-cdk/aws-lambda-go-alpha';
import * as cdk from 'aws-cdk-lib';
import {
  aws_apigateway as apigw,
  // aws_lambda as lambda,
  // aws_lambda_nodejs as lambdaNode,
  // Stack,
  // Duration,
  // aws_iam as iam,
  // aws_dynamodb as dynamodb,
} from 'aws-cdk-lib';

import { ApiGatewayHelper } from 'cdk-api-gateway-helper-lib';
import { ApiGatewayCustomDomain } from 'cdk-custom-domain-lib';
import { Construct } from 'constructs';

export interface DataCollectorProps extends cdk.StackProps {

}

export class DataCollectorCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: DataCollectorProps) {
    super(scope, id, props);


    const domainNamePart = 'dc'; // domain name part is a subdomain of the domain name eg. example.serverlytics.dev

    const gatewayHelper = new ApiGatewayHelper(this, 'DC-Endpoint'); // create the gateway helper

    // CDK GoLang Lambda Function
    const goCollector = new GoFunction(this, 'DC-Add-Data', {
      entry: 'src/stacks/DataCollector/lambda/main.go',

    });


    // add lambda to the gateway
    gatewayHelper.addApiToGateway({
      resourceVersion: 'v1',
      resourceName: 'add-data',
      methodType: 'POST',
      lambdaFunction: goCollector,
      useAuthorizer: false,
      useApiKey: false,
      throttling: {
        rateLimit: 10,
        burstLimit: 2,
      },
    });


    // Add the default plan
    const defaultPlan: apigw.UsagePlanProps = {
      name: 'DC-HandlerPlan',
      throttle: {
        rateLimit: 10,
        burstLimit: 2,
      },
    };


    // add the throttle per method
    gatewayHelper.addUsagePlan('DC-UsagePlan', defaultPlan, undefined);

    // Add default error handling for auth failure
    gatewayHelper.addDefaultAuthErrorResponse('DC-response');

    // Create custom domain
    new ApiGatewayCustomDomain(this, gatewayHelper.returnGateway(), process.env.DOMAIN!, domainNamePart);

  }
}

#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AwsCognitoStack } from '../lib/aws-cognito-stack';
import { stackConfig } from './config';

const app = new cdk.App();
new AwsCognitoStack(app, 'cognito-stack', stackConfig);
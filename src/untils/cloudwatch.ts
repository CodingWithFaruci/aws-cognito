import { CloudWatchClient, PutMetricDataCommand, PutMetricDataCommandInput } from '@aws-sdk/client-cloudwatch';

interface ICloudWatchEvent {
  sub:string,
  err: Error,
  cw: CloudWatchClient
}

export const handleCloudwatchEvent = async (values: ICloudWatchEvent) => {
  const input: PutMetricDataCommandInput = {
    MetricData: [
      {
        MetricName: 'FailedPostConformationMetrics',
        Unit: 'Count',
        Value: 1,
        Timestamp: new Date(),
        Dimensions: [{
          Name: 'FailedPostConformationMetrics',
          Value: values.err.message,
        }],
      },
    ],
    Namespace: 'PrintHelix',
  };
  const command: PutMetricDataCommand = new PutMetricDataCommand(input);
  try {
    await values.cw.send(command);
  } catch (eventError) {
    console.error(`Error while sending error event for user: ${values.sub}`);
    console.error(eventError);
  }
};
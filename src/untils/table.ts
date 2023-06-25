import {
  DynamoDBDocumentClient,
  PutCommand,
  PutCommandInput,
  PutCommandOutput,
} from '@aws-sdk/lib-dynamodb';

interface ITableEntry {
  tableEntry: {
    account_id: string,
    account_name: string,
    account_email: string,
    email_verified: string,
    given_name: string,
    family_name: string,
  },
  tableName:string,
  ddb: DynamoDBDocumentClient
}

export const handleTableEntry = async (values: ITableEntry) => {
  const input: PutCommandInput = {
    TableName: values.tableName,
    Item: {
      account_id: values.tableEntry.account_id,
      account_name: values.tableEntry.account_name,
      account_email: values.tableEntry.account_email,
      email_verified: values.tableEntry.email_verified,
      given_name: values.tableEntry.given_name,
      family_name: values.tableEntry.family_name,
    },
  };
  const command: PutCommand = new PutCommand(input);
  const result: PutCommandOutput = await values.ddb.send(command);
  return result.$metadata.httpStatusCode;
};
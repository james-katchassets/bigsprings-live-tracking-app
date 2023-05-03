// Create service client module using ES6 syntax.
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { MY_AWS_ACCESS_KEY_ID, MY_AWS_SECRET_ACCESS_KEY, MY_AWS_REGION } from '$env/static/private';

// Set the AWS Region.
const REGION = MY_AWS_REGION;
const cred = {
	accessKeyId: MY_AWS_ACCESS_KEY_ID,
	secretAccessKey: MY_AWS_SECRET_ACCESS_KEY
};
// Create an Amazon DynamoDB service client object.
const ddbClient = new DynamoDBClient({ region: REGION, credentials: cred });
export { ddbClient };

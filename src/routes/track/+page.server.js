import { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } from '$env/static/private';
import { ddbClient } from '$lib/ddbclient';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { GetCommand } from '@aws-sdk/lib-dynamodb';


/** @type {import('./$types').PageServerLoad} */
export const load = ({locals}) => {
  
  const cred = {
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
  };
  
  const client = ddbClient;

  const params = {
    TableName: "nmealogs",
    Key: {
      macaddr: "00:50:18:6B:EA:EB", // For example, 'Season': 2.
      timestamp_msec: 1670473529000 // For example,  'Episode': 1; (only required if table has sort key).
    },
  };
  
  const run = async () => {
    try {
      const data = await client.send(new GetCommand(params));
      console.log("Success :", data);
      // console.log("Success :", data.Item);
      return data;
    } catch (err) {
      console.log("Error", err);
    }
  };
  
  run();
}
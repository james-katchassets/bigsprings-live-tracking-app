import { MY_AWS_ACCESS_KEY_ID, MY_AWS_SECRET_ACCESS_KEY, MY_HEREMAPS_API_KEY } from '$env/static/private';
import { ddbClient } from '$lib/ddbclient';
import moment from 'moment';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { resourceLimits } from 'worker_threads';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ locals, fetch }) => {
	const cred = {
		accessKeyId: MY_AWS_ACCESS_KEY_ID,
		secretAccessKey: MY_AWS_SECRET_ACCESS_KEY
	};

	const client = ddbClient;
	const start_time = moment().subtract(7, 'days');

	const params = {
		TableName: 'kegcat-dev-eu',
		KeyConditionExpression: 'id = :mac AND #c >= :s',
		ScanIndexForward: false,
		// FilterExpression: "ffamode = :mode",
		ExpressionAttributeNames: {
			'#c': 'timestamp'
		},
		ExpressionAttributeValues: {
			':mac': 'e89f6de809f8',
			':s': start_time.toISOString(),
		},
		ProjectionExpression: 'id, #c, battery, config, entries, firmware_version, hardware_version, iccid, imei, message_topic, mobile, scan_results',
	};

	const run = async () => {
		try {
			const data = await client.send(new QueryCommand(params));
			/** @type any */
			const obj = structuredClone(data.Items);
			return obj;
		} catch (err) {
			console.log('Error', err);
		}
	};
	const logs = await run();
	let monit_logs = [];
	let scan_logs = [];
	let reset_logs = [];

	const endpoint = `https://positioning.hereapi.com/v2/locate?apiKey=${MY_HEREMAPS_API_KEY}`;

	const positioning = async ( /** @type {{ scan_results: { bssid: string; rssi: number; }[]; }} */ msg ) => {
		const body = {
			"wlan": msg.scan_results.map( (/** @type {{ bssid: string; rssi: Number; }} */ result) => {
				return {
					"mac": result.bssid,
					"rss": result.rssi
				}	
			}  )
		}
		// console.log(body);
		const headers = new Headers();
		headers.append("Content-Type", "application/json");
		const res = await fetch(endpoint, { headers: headers, method: "POST", body: JSON.stringify(body) })
		if ( res.status == 200 ) {
			return await res.json();
		} else {
			console.log(res.statusText)
			return null;
		}
	};

	for (const msg of logs) {
		switch (msg.message_topic) {
			case 'monit':
				monit_logs.push(msg);
				break;
			case 'scan':
				const loc = await positioning(msg);
				if ( loc != null ) {
 					msg.location = loc.location;
				} else {
					msg.location = null;
				}
				scan_logs.push(msg);
				
				break;
			case 'reset':
				reset_logs.push(msg);
				break;
			default:
				break;
		}
	}
	return {
		monit_logs: monit_logs,
		scan_logs: scan_logs,
		reset_logs: reset_logs
	}
};

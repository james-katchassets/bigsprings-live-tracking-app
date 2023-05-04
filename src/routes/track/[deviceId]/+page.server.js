import { MY_AWS_ACCESS_KEY_ID, MY_AWS_SECRET_ACCESS_KEY, MY_HEREMAPS_API_KEY, MY_REDIS_PASSWORD } from '$env/static/private';
import { ddbClient } from '$lib/ddbclient';
import moment from 'moment';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { createClient } from 'redis';
import md5 from 'blueimp-md5';


/** @type {import('./$types').PageServerLoad} */
export const load = async ({ params, fetch }) => {
	const cred = {
		accessKeyId: MY_AWS_ACCESS_KEY_ID,
		secretAccessKey: MY_AWS_SECRET_ACCESS_KEY
	};

	const client = ddbClient;
	const start_time = moment().utc().subtract(3, 'days');
	console.log(start_time.toISOString());
	const parameters = {
		TableName: 'kegcat-dev-eu',
		KeyConditionExpression: 'id = :mac AND #c >= :s',
		ScanIndexForward: false,
		ExpressionAttributeNames: {
			'#c': 'timestamp'
		},
		ExpressionAttributeValues: {
			':mac': params.deviceId,
			':s': start_time.toISOString(),
		},
		ProjectionExpression: 'id, #c, battery, config, entries, firmware_version, hardware_version, iccid, imei, message_topic, mobile, scan_results',
	};

	const run = async () => {
		try {
			const data = await client.send(new QueryCommand(parameters));
			/** @type any */
			const obj = structuredClone(data.Items);
			return obj;
		} catch (err) {
			console.log('Error', err);
		}
	};
	const logs = await run();
	let monit_logs = [];
	/**
	 * @type {any[]}
	 */
	let scan_logs = [];
	let reset_logs = [];



	const redis_client = createClient({
		password: MY_REDIS_PASSWORD,
		socket: {
			host: 'redis-14990.c291.ap-southeast-2-1.ec2.cloud.redislabs.com',
			port: 14990
		}
	});
	await redis_client.connect();

	const endpoint = `https://positioning.hereapi.com/v2/locate?apiKey=${MY_HEREMAPS_API_KEY}`;
	const positioning = async ( /** @type {{ id: string, timestamp: string,  scan_results: { bssid: string; rssi: number; channel: number; ssid: string }[]; }} */ msg) => {
		// const gbody = {
		// 	considerIp: "false",
		// 	"wifiAccessPoints": msg.scan_results.map((/** @type {{ bssid: string; rssi: Number; channel: number; ssid: string}} */ result) => {
		// 		return {
		// 			"macAddress": result.bssid,
		// 			"signalStrength": result.rssi,
		// 			"channel": result.channel,
		// 			"age": moment().valueOf() - moment(msg.timestamp).valueOf()
		// 		}
		// 	})
		// }
		// console.log("gmap", gbody);
		const body = {
			"wlan": msg.scan_results.map((/** @type {{ bssid: string; rssi: Number; channel: number; ssid: string}} */ result) => {
				return {
					"mac": result.bssid,
					"rss": result.rssi
				}
			})
		}

		const hkey = md5(JSON.stringify(body));
		const val = await redis_client.get(hkey);

		if ( val ) {
			console.log("REDIS_HIT:", val);
			return JSON.parse(val);
		}

		// console.log("Heremaps", body);
		const headers = new Headers();
		headers.append("Content-Type", "application/json");
		const res = await fetch(endpoint, { headers: headers, method: "POST", body: JSON.stringify(body) })
		if (res.status == 200) {
			const result =  await res.json();
			redis_client.set(hkey, JSON.stringify(result));
			return result;
		} else {
			console.log(res.statusText)
			return null;
		}
	};
	/** @type  { Map<number, any> } */
	let tempTx = new Map();

	for (const msg of logs) {
		switch (msg.message_topic) {
			case 'monit':
				monit_logs.push(msg);
				break;
			case 'scan':
				// const loc = await positioning(msg);
				// if ( loc != null ) {
				// 	msg.location = loc.location;
				// } else {
				// 	msg.location = null;
				// }
				// scan_logs.push(msg);
				/** @type Number */
				let timestampMsec = moment(msg.timestamp).valueOf();
				timestampMsec = Math.round(timestampMsec / 1000 / 60 / 5) * 5 * 60;
				tempTx.set(timestampMsec, msg);
				break;
			case 'reset':
				reset_logs.push(msg);
				break;
			default:
				break;
		}
	}

	const delay = (/** @type number */ time) => {
		return new Promise(resolve => setTimeout(resolve, time));
	};

	const keys = Array.from(tempTx.keys());
	for (let i of keys) {
		const v = tempTx.get(i);
		const loc = await positioning(v);
		if (loc != null) {
			v.location = loc.location;
		} else {
			v.location = null
		}
		scan_logs.push(v);
	}

	// tempTx.forEach( async (v, k) => {
	// 	const loc = await positioning(v);
	// 	if ( loc != null ) {
	// 		v.location = loc.location;
	// 	} else {
	// 		v.location = null
	// 	}
	// 	scan_logs.push(v);
	// });
	redis_client.disconnect();
	return {
		monit_logs: monit_logs,
		scan_logs: scan_logs,
		reset_logs: reset_logs
	}
};

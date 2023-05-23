import { MY_HEREMAPS_API_KEY } from "$env/static/private";
import md5 from 'blueimp-md5';

const positioning = async ( 
  /** @type {{ id: string, timestamp: string,  scan_results: { bssid: string; rssi: number; channel: number; ssid: string }[]; }} */ msg,
  /** @type { import("@vercel/kv").VercelKV } */ redis_client ) => {
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
  const endpoint = `https://positioning.hereapi.com/v2/locate?apiKey=${MY_HEREMAPS_API_KEY}`;
  const hkey = md5(JSON.stringify(body));
  const /** @type { string | null } */ val = await redis_client.get(hkey);

  if ( val ) {
    return JSON.parse(JSON.stringify(val));
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
    redis_client.set(hkey, '{}');
    return null;
  }
};


const revgeocoding = async ( 
  /** @type {{ location: { lat: number; lng: number; accuracy: number; }}} */ loc,
  /** @type { import("@vercel/kv").VercelKV } */ redis_client ) => {
  const url = `https://revgeocode.search.hereapi.com/v1/revgeocode?in=circle:${loc.location.lat},${loc.location.lng};r=${loc.location.accuracy}&limit=5&apiKey=${MY_HEREMAPS_API_KEY}`
  const hkey = md5(JSON.stringify(url));
  const val = await redis_client.get(hkey);
  if ( val ) {
    return JSON.parse(JSON.stringify(val));
  }
  const res = await fetch(url, { method: "GET" });
  if (res.status == 200) {
    const result =  await res.json();
    redis_client.set(hkey, JSON.stringify(result));
    return result;
  } else {
    console.log(res.statusText);
    const body = await res.json();
    console.log(body);
    // redis_client.set(hkey, '{}');
    return null;
  }
};

export { positioning, revgeocoding};

<script>
	import { Column, DataTable, Grid, Pagination, Row, Tag } from 'carbon-components-svelte';
	// import { ScaleTypes } from '@carbon/charts/interfaces/enums';
	import { ComboChart } from '@carbon/charts-svelte';
	import moment from 'moment';
	import mapboxgl from 'mapbox-gl';
	import { onMount } from 'svelte';
	import 'mapbox-gl/dist/mapbox-gl.css';
	import '@carbon/charts/styles.css';

	/** @type {import('./$types').PageData}*/
	export let data;
	
	// let /** @type number */ pageSize = 20;
	// let /** @type number */ page = 1;
	let /** @type number[] */ center;
	$: center =
		data.scan_logs.length > 0 && data.scan_logs[0].location != null
			? [data.scan_logs[0].location.lng, data.scan_logs[0].location.lat]
			: [151.21513681183322, -33.875958176445934];

	const render = () => {
		mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
		const map = new mapboxgl.Map({
			container: 'map', // container ID
			style: 'mapbox://styles/mapbox/streets-v12', // style URL
			center: center, // starting position [lng, lat]
			zoom: 9 // starting zoom
		});

		const /** @type number[][] */ coordinates = new Array();
		// console.log(data.scan_logs);
		let /** @type number | undefined */ minX = undefined;
		let /** @type number | undefined */ minY = undefined;
		let /** @type number | undefined */ maxX = undefined;
		let /** @type number | undefined */ maxY = undefined;
		for (var i = 0; i < data.scan_logs.length; i++) {
			if (data.scan_logs[i].location === null) {
				continue;
			}
			coordinates.push([data.scan_logs[i].location.lng, data.scan_logs[i].location.lat]);
			if (!minX || minX > data.scan_logs[i].location.lng) {
				minX = data.scan_logs[i].location.lng;
			}
			if (!minY || minY > data.scan_logs[i].location.lat) {
				minY = data.scan_logs[i].location.lat;
			}
			if (!maxX || maxX < data.scan_logs[i].location.lng) {
				maxX = data.scan_logs[i].location.lng;
			}
			if (!maxY || maxY < data.scan_logs[i].location.lat) {
				maxY = data.scan_logs[i].location.lat;
			}
		}

		if (coordinates.length == 0) {
			console.log('No coordinate found');
			return;
		}

		const routedata = {
			type: 'geojson',
			data: {
				type: 'FeatureCollection',
				features: [
					{
						type: 'Feature',
						properties: {},
						geometry: {
							type: 'LineString',
							coordinates: coordinates
						}
					}
				]
			}
		};

		const concatPlaces = (/** @type any[] */ plcs) => {
			/**
			 * @type {string[]}
			 */
			const result = [];
			plcs.forEach( (plc) => {
				result.push(`<li>${plc.title}</li>`)
			} );
			return result.join("");
		};


		data.scan_logs.forEach((/** @type any */ log) => {
			if (log.location != null) {
				const desc = `Timestamp: ${moment

					.parseZone(log.timestamp, 'YYYY-MM-DDTHH:mm:ssZ')

					.local()

					.format('YYYY-MM-DD HH:mm:ss ZZ')} ${
					log.location === null
						? '--'
						: '<br/>Coordinates: [' + log.location.lat + ',' + log.location.lng + ']<br/>' +
						( log.places.items.length > 0 ? 'Matched place(s):<br/><ul style="list-style-type: square;list-style-position: inside;">' + concatPlaces(log.places.items) + '</ul>' : ""  )

				}`;
				// console.log(log.places);
				routedata.data.features.push({
					type: 'Feature',
					properties: {
						description: desc
					},
					geometry: {
						type: 'Point',
						coordinates: [log.location.lng, log.location.lat]
					}
				});
				console.log(desc);
			}
		});

		map.on('load', () => {
			map.addSource('route', routedata);
			map.addLayer({
				id: 'route',
				type: 'line',
				source: 'route',
				layout: {
					'line-join': 'round',
					'line-cap': 'round'
				},
				paint: {
					'line-color': '#5ab55f',
					'line-width': 5
				}
			});
			map.addLayer({
				id: 'locations',
				type: 'circle',
				source: 'route',
				// paint: {
				// 	'circle-color': ['case', ['==', ['get', 'speed'], 0], '#ff0000', '#00ff00'],
				// 	'circle-radius': 6
				// },
				filter: ['==', '$type', 'Point']
			});
		});

		const popup = new mapboxgl.Popup({
			closeButton: true,
			closeOnClick: true
		});

		map.on('mouseenter', 'locations', (/** @type any */ e) => {
			map.getCanvas().style.cursor = 'pointer';
			const coordinates = e.features[0].geometry.coordinates.slice();
			const description = e.features[0].properties.description;
			console.log(description);
			// Ensure that if the map is zoomed out such that multiple
			// copies of the feature are visible, the popup appears
			// over the copy being pointed to.
			while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
				coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
			}

			// Populate the popup and set its coordinates
			// based on the feature found.
			popup.setLngLat(coordinates).setHTML(description).addTo(map);
		});
		map.on('mouseleave', 'places', () => {
			map.getCanvas().style.cursor = '';
			popup.remove();
		});
		map.fitBounds(
			[
				[minX, minY],
				[maxX, maxY]
			],
			{
				padding: 40
			}
		);
	};
	let mapInit = false;
	onMount(() => {
		mapInit = true;
		render();
	});
	$: {
		if (mapInit && data ) {
			render();
		}
	}
	// console.log(data.chart_data);
	// console.log(data.scan_logs);
	// console.log(data.monit_logs);

	const options = {
		title: 'Temperature & Movement Detection',
		axes: {
			left: {
				mapsTo: 'value',
				title: 'Temperature',
				correspondingDatasets: ['Temperature']
			},
			bottom: {
				
				scaleType: /** @type { import("@carbon/charts/interfaces/enums").ScaleTypes } */ ( 'time' ),
				mapsTo: 'date'
			},
			right: {
				title: 'Detection',
				mapsTo: 'key',
				ticks: {
					values: ['upside_down', 'unknown', 'upright', 'moved', 'tilted']
				},
				scaleType:  /** @type { import("@carbon/charts/interfaces/enums").ScaleTypes } */ ( 'labels' ),
				correspondingDatasets: ['Orientation', 'Tilt', 'Movement']
			}
		},
		timeScale: {
			addSpaceOnEdges: 0,
			timeIntervalFormats: {
				hourly: {
					primary: 'd-MMM, h:mm',
					secondary: 'HH:mm'
				}
			}
		},
		curve: 'curveMonotoneX',
		comboChartTypes: [
			{
				type: 'line',
				options: {
					points: {
						enabled: false
					}
				},
				correspondingDatasets: ['Temperature']
			},
			{
				type: 'scatter',
				options: {
					points: {
						radius: 2
					}
				},
				correspondingDatasets: ['Orientation', 'Movement', 'Tilt']
			}
		],
		height: '400px'
	};
</script>

<Grid narrow>
	<Row><Column><h4>Device ID: <Tag type="cyan">{data.device_id}</Tag></h4></Column></Row>
	<Row>
		<Column>
			<div id="map" style="min-height:400px;min-width:300px;" />
		</Column>
	</Row>
	<Row>
		<Column>
			{#if data.chart_data != undefined }
			<ComboChart data={data.chart_data} {options} />
			{/if}
		</Column>
	</Row>
	<!-- <Row>

<Column>

<DataTable

title="Travel Logs"

sortable

headers={[

{ key: 'timestamp', value: 'Timestamp', display: (ts) => moment(ts).format() },

{ key: 'lat', value: 'Latitude' },

{ key: 'lng', value: 'Longitude' },

{ key: 'speed', value: 'Speed (km/h)' }

]}

{pageSize}

{page}

rows={Array.from(data.logs, (v, i) => ({

id: v.timestamp_msec,

timestamp: v.timestamp_msec,

lat: v.lat,

lng: v.lng,

speed: v.speed

}))}

/>

<Pagination

bind:pageSize

bind:page

totalItems={data.logs.length}

pageSizeInputDisabled

/></Column

>
            </Row> -->
</Grid>

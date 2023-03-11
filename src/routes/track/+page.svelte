<script>
	import { Column, DataTable, Grid, Pagination, Row } from 'carbon-components-svelte';
	import moment from 'moment';
	import mapboxgl from 'mapbox-gl';
	import { onMount } from 'svelte';
	import 'mapbox-gl/dist/mapbox-gl.css';

	/** @type {import('./$types').PageData}*/
	export let data;
	let /** @type number */ pageSize = 20;
	let /** @type number */ page = 1;
	let /** @type number[] */ center =
			data.logs.length > 0
				? [data.logs[data.logs.length - 1].lng, data.logs[data.logs.length - 1].lat]
				: [151.21513681183322, -33.875958176445934];

	let /** @type number | undefined */ minX = undefined;
	let /** @type number | undefined */ minY = undefined;
	let /** @type number | undefined */ maxX = undefined;
	let /** @type number | undefined */ maxY = undefined;

	onMount(() => {
		mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
		const map = new mapboxgl.Map({
			container: 'map', // container ID
			style: 'mapbox://styles/mapbox/streets-v12', // style URL
			center: center, // starting position [lng, lat]
			zoom: 9 // starting zoom
		});

		const /** @type number[][] */ coordinates = new Array();

		for (var i = 0; i < data.logs.length; i++) {
			coordinates.push([data.logs[i].lng, data.logs[i].lat]);
			if (!minX || minX > data.logs[i].lng) {
				minX = data.logs[i].lng;
			}
			if (!minY || minY > data.logs[i].lat) {
				minY = data.logs[i].lat;
			}
			if (!maxX || maxX < data.logs[i].lng) {
				maxX = data.logs[i].lng;
			}
			if (!maxY || maxY < data.logs[i].lat) {
				maxY = data.logs[i].lat;
			}
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

		data.logs.forEach((/** @type any */ log) =>
			routedata.data.features.push({
				type: 'Feature',
				properties: {
					description:
						moment(log.timestamp_msec).format() +
						'<br/>Coordinates: [' +
						log.lat +
						',' +
						log.lng +
						']</br>',
					speed: log.speed
				},
				geometry: {
					type: 'Point',
					coordinates: [log.lng, log.lat]
				}
			})
		);

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
				paint: {
					'circle-color': ['case', ['==', ['get', 'speed'], 0], '#ff0000', '#00ff00'],
					'circle-radius': 6
				},
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
			{ padding: 40 }
		);
	});
</script>

<Grid>
	<Row>
		<Column>
			<div id="map" style="min-height:500px;width:100%;" />
		</Column>
	</Row>
	<Row>
		<Column
			><DataTable
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
	</Row>
</Grid>

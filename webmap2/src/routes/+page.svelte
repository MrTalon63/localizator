<script lang="ts" context="module">
	import { goto } from "$app/navigation";
	if (browser && !localStorage.getItem("token")) goto("/login");
	const reqTrackers = await fetch("https://tracker-api.mrtalon.eu/api/trackers", {
		headers: {
			"Authorization": `Bearer ${localStorage.getItem("token")}`
		}
	})
	if (reqTrackers.status === 401) goto("/login");
	const myTrackers = await reqTrackers.json() as {trackerUID: string, name: string}[]
	if (!localStorage.getItem("selectedTrackers")) localStorage.setItem("selectedTrackers", JSON.stringify(myTrackers.map(tracker => tracker.trackerUID)));
</script>

<script lang="ts">
	import { MapLibre, Marker, Popup, DefaultMarker, LineLayer, Layer } from "svelte-maplibre";
	import { browser } from "$app/environment";

	let selectedTrackers: string[] = JSON.parse(localStorage.getItem("selectedTrackers")!);
	let selectedTracker: string = "";
	let selectedTrackerData: {
		name: string
		trackerUID: string;
		timestamp: Date;
		latitude: number;
		longitude: number;
		accuracy: number | null;
		type: string;
		latest: boolean | undefined;
	}[][] = [];

	let zoomLevel = (localStorage.getItem("zoomLevel") ? parseInt(localStorage.getItem("zoomLevel")!) : 10);
	let center = (localStorage.getItem("center") ? JSON.parse(localStorage.getItem("center")!) : [21.05, 52.5]);
	

	$: {
		getPositions(selectedTrackers);
		localStorage.setItem("selectedTrackers", JSON.stringify(selectedTrackers));
	}

	async function getPositions(trackers: string[]) {
		trackers.forEach(async tracker => {
			const name = myTrackers.find(myTracker => myTracker.trackerUID === tracker)!.name;
			const reqPositions = await fetch(`https://tracker-api.mrtalon.eu/api/tracker/${tracker}/positions`, {
				headers: {
					"Authorization": `Bearer ${localStorage.getItem("token")}`
				}
			});
			if (reqPositions.status === 401) goto("/login");
			const positions = await reqPositions.json() as {
				name: string;
				trackerUID: string;
				timestamp: Date;
				latitude: number;
				longitude: number;
				accuracy: number | null;
				type: string;
				latest: boolean | undefined;
			}[];
			positions.forEach(position => position.name = name);
			selectedTrackerData = [...selectedTrackerData, positions];
		})
	}
</script>

<div>
	<MapLibre
		style = {{
			version: 8,
			sources: {
				"raster-tiles": {
					type: "raster",
					tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
					tileSize: 256,
					attribution: "OpenStreetMap"
				}
			},
			layers: [{
				id: "raster-tiles",
				type: "raster",
				source: "raster-tiles",
				paint: {
					"raster-opacity": 1
				}
			}]
		}}
		center={center}
		zoom={zoomLevel}
		class="map"
  		standardControls
		on:zoomend={(m) => localStorage.setItem("zoomLevel", m.detail.map.getZoom().toString())}
		on:moveend={(m) => localStorage.setItem("center", JSON.stringify(m.detail.map.getCenter()))}
	>
		{#each selectedTrackerData as trackersData}
			{#each trackersData as trackerData}
				{#if trackerData.latest === true}
					<DefaultMarker lngLat={[trackerData.longitude, trackerData.latitude]} class="">
						<Popup>
							<p>Nazwa: {trackerData.name}</p>
							<p>Czas: {trackerData.timestamp}</p>
							<p>Dokładność: {trackerData.accuracy}</p>
							<p>Typ: {trackerData.type}</p>
						</Popup>
					</DefaultMarker>
				{:else}
					<Marker lngLat={[trackerData.longitude, trackerData.latitude]} class="h-2 w-2 rounded-full place-items-center bg-red-700">
						<Popup>
							<p>Nazwa: {trackerData.name}</p>
							<p>Czas: {trackerData.timestamp}</p>
							<p>Dokładność: {trackerData.accuracy}</p>
							<p>Typ: {trackerData.type}</p>
						</Popup>
					</Marker>
				{/if}
			{/each}
			<LineLayer
				id = {`line-${trackersData[0].trackerUID}`}
				source={{
					type: "geojson",
					data: {
						type: "Feature",
						properties: {},
						geometry: {
							type: "LineString",
							coordinates: trackersData.map(trackerData => [trackerData.longitude, trackerData.latitude])
						}
					}
				}}
				layout={{
					"line-join": "round",
					"line-cap": "round"
				}}
				paint={{
					"line-color": "red",
					"line-width": 4,
					"line-opacity": 0.5
				}}
		/>
		{/each}


	</MapLibre>

	<div>
		<select bind:value={selectedTracker}>
			{#each myTrackers as tracker}
				<option value={tracker.trackerUID}>{tracker.name}</option>
			{/each}
		</select>
		<button on:click={() => {if (!selectedTrackers.includes(selectedTracker)) selectedTrackers = [...selectedTrackers, selectedTracker]}} class="bg-slate-500 border-black border-solid p-2 m-2">Add</button>
		<button on:click={() => {selectedTrackers = selectedTrackers.filter(tracker => tracker !== selectedTracker); window.location.reload()}} class="bg-slate-500 border-black border-solid p-2 m-2">Remove</button>
		<p class="text-xl font-semibold">Selected trackers:</p>
		{#each selectedTrackers as tracker}
			<p>{myTrackers.find(myTracker => myTracker.trackerUID === tracker)?.name}</p>
		{/each}
	</div>

	<button on:click={() => {window.location.reload()}} class="bg-slate-500 border-black border-solid p-2 m-2">Refresh</button>
	<button on:click={() => {localStorage.removeItem("token"); localStorage.removeItem("selectedTrackers"); goto("/login")}} class="bg-slate-500 border-black border-solid p-2 m-2">Remove Token</button>
</div>

<style>
	:global(.map) {
	  height: 75vh;
	}
</style>
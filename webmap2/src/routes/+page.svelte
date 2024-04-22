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
	if (localStorage.getItem("selectedTrackers") == "null") localStorage.setItem("selectedTrackers", JSON.stringify(myTrackers.map(tracker => tracker.trackerUID)));
</script>

<script lang="ts">
	import { MapLibre, Marker, Popup, DefaultMarker, LineLayer, Layer } from "svelte-maplibre";
	import { DateTime } from "luxon";
	import { browser } from "$app/environment";

	let selectedTrackers: string[] = JSON.parse(localStorage.getItem("selectedTrackers")!);
	let selectedTracker: string = "";
	let selectedTrackerData: {
		name: string
		trackerUID: string;
		timestamp: string;
		latitude: number;
		longitude: number;
		accuracy: number | null;
		type: string;
		latest: boolean | undefined;
	}[][] = [];

	let zoomLevel = (localStorage.getItem("zoomLevel") ? parseInt(localStorage.getItem("zoomLevel")!) : 10);
	let center = (localStorage.getItem("center") ? JSON.parse(localStorage.getItem("center")!) : [21.05, 52.5]);
	let time = localStorage.getItem("time") || "24";

	$: {
		getPositions(selectedTrackers);
		if (localStorage.getItem("selectedTrackers") == "null") {
			getTrackers();
		} else {
			localStorage.setItem("selectedTrackers", JSON.stringify(selectedTrackers));
		}
	}

	async function getPositions(trackers: string[]) {
		trackers.forEach(async tracker => {
			const name = myTrackers.find(myTracker => myTracker.trackerUID === tracker)!.name;
			const reqPositions = await fetch(`https://tracker-api.mrtalon.eu/api/tracker/${tracker}/positions?time=${time}`, {
				headers: {
					"Authorization": `Bearer ${localStorage.getItem("token")}`
				}
			});
			if (reqPositions.status === 401) goto("/login");
			const positions = await reqPositions.json() as {
				name: string;
				trackerUID: string;
				timestamp: string;
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

	async function getTrackers() {
		const reqTrackers = await fetch("https://tracker-api.mrtalon.eu/api/trackers", {
			headers: {
				"Authorization": `Bearer ${localStorage.getItem("token")}`
			}
		})
		if (reqTrackers.status === 401) goto("/login");
		const myTrackers = await reqTrackers.json() as {trackerUID: string, name: string}[]
		if (localStorage.getItem("selectedTrackers") == "null") localStorage.setItem("selectedTrackers", JSON.stringify(myTrackers.map(tracker => tracker.trackerUID)));
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
					<Marker lngLat={[trackerData.longitude, trackerData.latitude]} class="">
						<Popup>
							<p>Nazwa: {trackerData.name}</p>
							<p>Czas: {DateTime.fromISO(trackerData.timestamp).setLocale("pl").toLocaleString(DateTime.DATETIME_FULL_WITH_SECONDS)}</p>
							<p>Dokładność: {trackerData.accuracy}</p>
							<p>Typ: {trackerData.type}</p>
						</Popup>
						<img src="https://c.mrtalon.eu/u/aprs_person.webp" style="height: 48px;">
					</Marker>
				{:else}
					<Marker lngLat={[trackerData.longitude, trackerData.latitude]} class="h-2 w-2 rounded-full place-items-center bg-red-700">
						<Popup>
							<p>Nazwa: {trackerData.name}</p>
							<p>Czas: {DateTime.fromISO(trackerData.timestamp).setLocale("pl").toLocaleString(DateTime.DATETIME_FULL_WITH_SECONDS)}</p>
							<p>Dokładność: {trackerData.accuracy}</p>
							<p>Typ: {trackerData.type}</p>
						</Popup>
					</Marker>
				{/if}
			{/each}

			<LineLayer
				id = {`line-${Math.random() * 1000}`}
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
		<select bind:value={selectedTracker} class="placeholder-black font-semibold border-b-black border-2 bg-slate-400 p-2 m-2">
			{#each myTrackers as tracker}
				<option value={tracker.trackerUID}>{tracker.name}</option>
			{/each}
		</select>
		<button on:click={() => {if (!selectedTrackers.includes(selectedTracker)) selectedTrackers = [...selectedTrackers, selectedTracker]}} class="bg-slate-500 border-black border-solid p-2 m-2">Dodaj</button>
		<button on:click={() => {selectedTrackers = selectedTrackers.filter(tracker => tracker !== selectedTracker); window.location.reload()}} class="bg-slate-500 border-black border-solid p-2 m-2">Usuń</button>
		<p class="text-xl font-semibold">Wybrane lokalizatory:</p>
		{#each selectedTrackers as tracker}
			<p>{myTrackers.find(myTracker => myTracker.trackerUID === tracker)?.name}</p>
		{/each}

		<label for="time" class="placeholder-black font-semibold m-1">Czas:</label>
		<select id="time" bind:value={time} on:change={() => {window.localStorage.setItem("time", time); window.location.reload()}} class="placeholder-black font-semibold border-b-black border-2 bg-slate-400 p-2 m-2">
			<option value="1">1h</option>
			<option value="3">3h</option>
			<option value="6">6h</option>
			<option value="12">12h</option>
			<option value="24">24h</option>
			<option value="48">2 dni</option>
			<option value="72">3 dni</option>
			<option value="168">7 dni</option>
			<option value="336">14 dni</option>
			<option value="720">30 dni</option>
		</select>
	</div>

	<button on:click={() => {window.location.reload()}} class="bg-slate-500 border-black border-solid p-2 m-2">Odśwież</button>
	<button on:click={() => {localStorage.clear(); goto("/login")}} class="bg-slate-500 border-black border-solid p-2 m-2">Usuń Token</button>
</div>

<style>
	:global(.map) {
	  height: 75vh;
	}
</style>
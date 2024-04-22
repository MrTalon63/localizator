<script lang="ts">
	import { goto } from "$app/navigation";

	let token: string = "";
</script>

<div class="flex flex-auto container justify-center pt-10">
	<input type="text" placeholder="Token" bind:value={token} class="placeholder-black font-semibold border-b-black border-2 bg-slate-400 p-2 m-2" />
	<button on:click={() => {localStorage.setItem("token", token); window.location.replace("/")}} class="bg-slate-500 border-black border-solid p-2 m-2">Ustaw token</button>
</div>

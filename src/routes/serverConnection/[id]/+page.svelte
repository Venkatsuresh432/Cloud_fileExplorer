<script>
    import Filemanager from "./filemanager.svelte"
    import { page } from '$app/stores'
    import { userStore } from '$lib/store';
    import { get } from 'svelte/store';
    import Cookies from "js-cookie";
    import { goto } from "$app/navigation";
    import { onMount } from 'svelte';
    let user = null;
    $: user = $userStore;
    onMount(() => {
        if (!user) {
            const storedUser = Cookies.get("user");
            if (storedUser) {
                user = JSON.parse(storedUser);
                userStore.set(user);
            } else {
                goto('/login');
            }
        }
    })
    let serverId = $page.params.id;
    let server = '';
    let password = "";
    async function getServerData() {
        const response = await fetch(`http://localhost:7930/server/${serverId}`, { 
            method: 'GET',
            headers: {Authorization: `Bearer ${user?.token}`} 
         });
        if (!response.ok) return alert("Error While Fetch Details");
        const data = await response.json();
        server = data.server;
        password = btoa(server.password);
    }
    onMount(getServerData);
</script>

<main id="main" class="main">
    <!-- First iFrame -->
    <div>
        <Filemanager />
    </div>

    <!-- Second iFrame -->
    <div class="card text-center">
        <div class="card-body">
            <iframe
                src={`http://localhost:8888/?hostname=${server.hostToConnect}&username=${server.serverName}&password=${password}`}
                name="iframe_a" height="600px" width="100%" title="Remote Access">
            </iframe>
        </div>
    </div>
</main>
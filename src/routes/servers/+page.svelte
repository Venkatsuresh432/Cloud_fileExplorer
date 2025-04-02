<script>
	import { onMount } from "svelte";
  import { userStore } from '$lib/store';
    import { get } from 'svelte/store'; 
    import Cookies from "js-cookie";
    import { goto } from "$app/navigation";
	
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

  export let servers = [];
  // Function to confirm before deletion
  async function confirmDelete(id) {
  if (!confirm("Are you sure?")) return; 
  try {
    const response = await fetch(`http://localhost:7930/server/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      throw new Error("Error deleting the server");
    }
    alert("Server Deleted Successfully");  
    if (typeof serverData === "function") {
      await serverData(); 
    }
  }
  catch (error) {
    alert(error.message || "Something went wrong!");
  }
}

async function redirectServer(id){
  goto(`/sftpManager2/${id}`);
}
function redirectTerminal(id){
  goto(`/serverConnection/${id}`)
}

  async function serverData() {
    const response = await fetch(`http://localhost:7930/server`, { method: 'GET' });
    if(!response.ok)  return alert("Error While getting Server");
    const serverData = await response.json();
    alert(serverData.message)
    console.log(serverData)
    servers = serverData.data; 
  }

  function createServer(){
    goto("/createServer")
  }
async function updateServerStatus(id){
 goto(`/serverStatus/${id}`)
} 
async function updateByPassProxy(id) {
  goto(`/serverProxyUpdate/${id}`)
}
  onMount(serverData);
</script>

<main id="main" class="main">
  <section class="section">
    <div class="row">
      <div class="col-lg-12">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">
              Server List
              <a href="#" on:click={createServer} class="btn btn-primary btn-sm position-absolute end-0 me-5">
                Add Server
              </a>
            </h5>

            <table class="table">
              <thead>
                <tr>
                  <th scope="col">Sno</th>
                  <th scope="col">Server Name</th>
                  <th scope="col">Host To Connect</th>
                  <th scope="col">Port</th>
                  <th scope="col">Status</th>
                  <th scope="col">Bypass Proxy</th>
                  <th scope="col">FileManager</th>
                  <th scope="col">Terminal</th>
                  <th scope="col">Delete</th>
                </tr>
              </thead>
              <tbody>
                {#each servers as server, index}
                    <tr>
                      <th scope="row">{index + 1}</th>
                      <td>{server.serverName}</td>
                      <td>{server.hostToConnect}</td>
                      <td>{server.port}</td>
  
                      <!-- Status Column -->
                      <td>
                        {server.status ? "Active" : "Inactive"}  
                        <a href="#" on:click={updateServerStatus(server._id)}>
                          <i class="bi bi-pencil-square"></i>
                        </a>
                      </td>
  
                      <!-- Bypass Proxy Column -->
                      <td>
                        {server.bypassProxy ? "Allowed" : "Not Allowed"}  
                        <a href="#" on:click={updateByPassProxy(server._id)}>
                          <i class="bi bi-pencil-square"></i>
                        </a>
                      </td>
  
                      <!-- Connect Column -->
                      <td class="text-center">
                        <a href="#" on:click={redirectServer(server._id)}>
                          <i class="bi bi-hdd-network"></i>
                        </a>
                      </td>

                      <td class="text-center">
                        <a href="#" on:click={redirectTerminal(server._id)}>
                          <i class="bi bi-hdd-network"></i>
                        </a>
                      </td>
  
                      <!-- Delete Column -->
                      <td>
                        <a href="#" on:click={confirmDelete(server._id)}>
                          <i class="bi bi-trash"></i>
                        </a>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
  
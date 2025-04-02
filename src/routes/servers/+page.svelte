<script>
    import { onMount } from "svelte";
    import { userStore } from '$lib/store';
    import { get } from 'svelte/store'; 
    import Cookies from "js-cookie";
    import { goto } from "$app/navigation";
    import { dangerToast, warningToast, successToast, infoToast}  from "$lib/toastNotifications"
    let user = null;
    $: user = $userStore;
    export let servers = [];
    onMount(() => {
        const storedUser = Cookies.get("user");
        if (storedUser) {
            user = JSON.parse(storedUser);
            userStore.set(user);
        } else {
            goto('/login'); 
        };
        serverData();
    });

  // Function to confirm before deletion
  async function confirmDelete(id) {
  if (!confirm("Are you sure?")) return; 
  try {
    const response = await fetch(`http://localhost:7930/server/${id}`, { 
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user?.token}` }
     });
    if (!response.ok) {
      dangerToast("Error deleting the server")
     return;
    }
    successToast("Server Deleted Successfully");  
    if (typeof serverData === "function") {
      await serverData(); 
    }
  }
  catch (error) {
    warningToast(error.message || "Something went wrong!");
  }
}

async function redirectServer(id){
  goto(`/sftpManager2/${id}`);
}
function redirectTerminal(id){
  goto(`/serverConnection/${id}`)
}

  async function serverData() {
    const response = await fetch(`http://localhost:7930/server`, { 
      method: 'GET',
      headers :{ Authorization: `Bearer ${user?.token}` }
     });
    if(!response.ok){ dangerToast("Error While getting Server"); return;}  
    const serverData = await response.json();
    successToast(serverData.message)
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
</script>

<main id="main" class="main">
  <section class="section">
    <div class="row">
      <div class="col-lg-12">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">
              Server List 
             
              <a on:click={createServer} class="btn btn-primary btn-sm position-absolute end-0 me-5">
                Add Server
              </a>
            </h5>

            <table class="table">
              <thead>
                <tr>
                  <th scope="col">Sno</th>
                  <th scope="col">ServerName</th>
                  <th scope="col">ServerAddress</th>
                  <th scope="col">Status</th>
                  <th scope="col">Proxy</th>
                  <th scope="col">FileManager</th>
                  <th scope="col">Terminal</th>
                  <th scope="col">Update</th>
                  <th scope="col">Delete</th>
                </tr>
              </thead>
              <tbody>
                {#each servers as server, index}
                    <tr>
                      <th scope="row">{index + 1}</th>
                      <td>{server.serverName}</td>
                      <td>{server.hostToConnect}</td>
                      <!-- Status Column -->
                      <td>
                        {server.status ? "Active" : "Inactive"}  
                        <!-- svelte-ignore a11y_consider_explicit_label -->
                        <a href="#" on:click={updateServerStatus(server._id)}>
                          <i class="bi bi-pencil-square"></i>
                        </a>
                      </td>
                      <!-- Bypass Proxy Column -->
                      <td>
                        {server.bypassProxy ? "Allowed" : "Not Allowed"}  
                        <!-- svelte-ignore a11y_consider_explicit_label -->
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
                      <td>
                        <a href={`/updateServer/${server._id}`}>
                          <i class="bi bi-database-fill-up"></i>
                        </a>
                      </td>
                      <!-- Delete Column -->
                      <td>
                        <a href="" on:click={confirmDelete(server._id)}>
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
  
<script>
   import { userStore } from '$lib/store';
    import { get } from 'svelte/store'; 
    import Cookies from "js-cookie";
    import { goto } from "$app/navigation";
    import { page } from   '$app/stores'
	  import { onMount } from 'svelte';
    let data = '';
    let servers = [];
    const userId = $page.params.id 
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

async function fetchFiles(){
  const response = await fetch(`http://localhost:7930/lists/serverAllotment/${userId}`, {
     method : "GET" ,
     headers: {Authorization: `Bearer ${user?.token}`}
    });
  if(!response.ok) return alert("Error While Fetching Data");
  const fetchData = await response.json();
  console.log(fetchData)
  data = fetchData.data;
  servers = fetchData.servers
}
    var time = ''
    function formatDate(date) {
      time =  date ? new Date(date).toISOString().split("T")[0] : "";
      return time;
    }
    async function addServerToUser(id)
    {
      const response = await fetch(`http://localhost:7930/lists/addServer/${userId}/${id}`,{
        method: 'PUT',
        headers: {Authorization: `Bearer ${user?.token}`}
      })
      if(!response.ok) return alert("Server Not Be Updated")
      const data = response.json();
      console.log(data)
      alert("alert: "+data.message);
      fetchFiles();
    }
    onMount(fetchFiles);
  </script>
  
  <main id="main" class="main">
    <section class="section">
      <div class="row">
        <div class="col-lg-12">
          <h5>Hi {data.userName}</h5> 
          <!-- Assigned Servers -->
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">Assigned Servers</h5>
              <table class="table">
                <thead>
                  <tr>
                    <th scope="col">Sno</th>
                    <th scope="col">Server Name</th>
                    <th scope="col">Temporary</th>
                    <th scope="col">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {#each data.servers as server, index}
                    <tr>
                      <th scope="row">{index + 1}</th>
                      <td>{server.serverName}</td>
                      <td>
                        <input 
                          type="checkbox" 
                          class="temp-server-checkbox" 
                          data-serverid={server._id} 
                          checked={server.disableDate ? true : false} />
                      </td>
                      <td>
                        <input 
                          type="date" 
                          class="disable-date-server" 
                          data-serverid={server._id} 
                          bind:value={time} />
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
  
          <!-- Available Servers -->
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">Available Servers</h5>
              <table class="table">
                <thead>
                  <tr>
                    <th scope="col">Sno</th>
                    <th scope="col">Server Name</th>
                    <th scope="col">Host To Connect</th>
                    <th scope="col">Port</th>
                    <th scope="col">Add Server</th>
                  </tr>
                </thead>
                <tbody>
                  {#each servers as server, index}
                    <tr>
                      <th scope="row">{index + 1}</th>
                      <td>{server.serverName}</td>
                      <td>{server.hostToConnect}</td>
                      <td>{server.port}</td>
                      <td>
                        <a href="#" 
                          on:click={addServerToUser(server._id)} >
                          <i class="bi bi-database-fill-add"></i>
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
  
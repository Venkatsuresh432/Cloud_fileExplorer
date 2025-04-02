<script>
    import { onMount } from "svelte";
    import { userStore } from '$lib/store';
    import { get } from 'svelte/store'; 
    import Cookies from "js-cookie";
    import { goto } from "$app/navigation";
    import { page } from '$app/stores'
    let userId = $page.params.id; 
    let user = '';
    let data = ''
    export let servers = [];

    async function getData() {
      const response = await fetch(`http://localhost:7930/user/${userId}`) 
      if(!response.ok) return alert('No User Found')
      const userData = await response.json(); 
      console.log(userData)
      user = userData.user
      servers = user.servers
    }


    function navigateServer(id){
      goto(`/sftpManager2/${id}`);
    }
    onMount(() => { 
        if (!user) {
            const user = Cookies.get("user");
          }
            else {
              goto('/login');
            }
        });
   onMount(getData);
  </script>
  <main id="main" class="main">
    <section class="section">
      <div class="row">
        <div class="col-lg-12">
           <h5 class="text-center">hi</h5>    <!--  {user.name} -->
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">Server List</h5>
              <table class="table">
                <thead>
                  <tr>
                    <th scope="col">Sno</th>
                    <th scope="col">ServerName</th>
                    <th scope="col">Connect</th>
                  </tr>
                </thead>
                <tbody>
                  {#each servers as server, index}
                    <tr>
                      <th scope="row">{index + 1}</th>
                      <td>{server.serverName}</td>
                      <td>
                        <a href="#" on:click={navigateServer(server._id)}>
                          <i class="bi bi-hdd-network"></i>
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
  
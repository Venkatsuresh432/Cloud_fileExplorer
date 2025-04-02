<script>
import { onMount } from "svelte";
import { userStore } from '$lib/store';
    import { get } from 'svelte/store'; 
    import Cookies from "js-cookie";
    import { goto } from "$app/navigation";

    let user = null;
    $: user = $userStore;
    onMount(() => {
        const storedUser = Cookies.get("user");
        if (storedUser) {
            user = JSON.parse(storedUser);
            userStore.set(user);
        } else {
            goto('/login'); 
        }
    });
export let users = [];

var time = ''

function formatDate(date) {
 time = date ? new Date(date).toISOString().split('T')[0] : '';
 return
}
//   export let users = [];
  async function userData() {
    const response = await fetch("http://127.0.0.1:7930/user", { 
      method : 'GET',
      headers: { Authorization: `Bearer ${user?.token}` }
    })
    if(!response.ok) return alert("fetch failed")
    const userItem = await response.json()
    alert(userItem.message)
    users = userItem.users
    console.log(users)
  }
  async function updateActivate(id, status) {
    goto(`/userActiveUpdate/${id}?status=${status}`)
    
  }
  function createUser(){
    goto('/createUser')
  }

  async function confirmDelete(userId) {
   if(confirm("Are You Sure?")){
    const response = await fetch(`http://localhost:7930/user/server/${userId}`, {
       method : 'DELETE',
       headers : {  Authorization: `Bearer ${user?.token}` }
      });
    if(!response.ok) return alert("Error for delete User")
    const data = response.json()
    console.log(data)
    alert ("User Deleted Successfully")
    userData();
   }
  }
     onMount(userData);
</script>

<main id="main" class="main">
  <section class="section">
    <div class="row">
      <div class="col-lg-12 col-md-12 col-sm-12">
        <div class="card">
          <div class="card-body position-relative">
            <h5 class="card-title">
              User List
              <a href="#" on:click={createUser} class="btn btn-primary btn-sm position-absolute end-0 me-5">
                AddUser
              </a>
            </h5>
            <table class="table text-left">
              <thead>
                <tr>
                  <th scope="col">Sno</th>
                  <th scope="col">User Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Role</th>
                  <th scope="col">Temporary</th>
                  <th scope="col">Date</th>
                  <th scope="col">Server</th>
                  <th scope="col">Status</th>
                  <th scope="col">Delete</th>
                </tr>
              </thead>
              <tbody>
                {#each users as user, index}
                  <tr>
                    <th scope="row">{index + 1}</th>
                    <td>{user.userName}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      <input type="checkbox" class="temp-user-checkbox" bind:checked={user.disableDate} data-userid={user._id} />
                    </td>
                    <td>
                       <input type="date" class="disable-date" data-userid={user._id} bind:value={time} />      
                    </td>
                    <td>
                      <a href={`/serverAllotment/${user._id}`}>
                        <i class="bi bi-database"></i>
                      </a>
                    </td>
                    <td>
                      { user.status == 1 ? "active" : "inactive"}
                      <a href="#" on:click={updateActivate(user._id , user.status)}>
                        <i class="bi bi-pencil-square"></i>
                      </a>
                    </td>
                    <td>
                      <a on:click={confirmDelete(user._id)}>
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

<script>
   import { toast } from '@zerodevx/svelte-toast'
    import { onMount } from "svelte";
    import { userStore } from '$lib/store';
    import { get } from 'svelte/store'; 
    import Cookies from "js-cookie";
    import { goto } from "$app/navigation";
    import { dangerToast, warningToast, successToast, infoToast}  from "$lib/toastNotifications"
	
    let user = null;
    $: user = $userStore;
    let date =""
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

//   export let users = [];
  async function userData() {
    const response = await fetch("http://127.0.0.1:7930/user", { 
      method : 'GET',
      headers: { Authorization: `Bearer ${user?.token}` }
    })
    if(!response.ok) return dangerToast("Error While Fetch Users")
    const userItem = await response.json()
    successToast(userItem.message)
    users = userItem.users
    console.log(users)
  }
  async function updateActivate(id, status) {
    goto(`/userActiveUpdate/${id}?status=${status}`)
    
  }
  function createUser(){
    goto('/createUser')
  }
  function updateUser(id){
    goto(`/updateUser/${id}`)
  }

  async function confirmDelete(userId) {
   if(confirm("Are You Sure?")){
    const response = await fetch(`http://localhost:7930/user/server/${userId}`, {
       method : 'DELETE',
       headers : {  Authorization: `Bearer ${user?.token}` }
      });
    if(!response.ok) return dangerToast('Delete User Failed')
    const data = response.json()
    console.log(data)
    successToast('User Deleted Successfully')
    userData();
   }
  }
     onMount(()=>{ userData(); });
</script>

<main id="main" class="main">
  <section class="section">
    <div class="row">
      <div class="col-lg-12 col-md-12 col-sm-12">
        <div class="card">
          <div class="card-body position-relative">
            <h5 class="card-title">
              User List
              <a on:click={createUser} class="btn btn-primary btn-sm position-absolute end-0 me-5">
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
                  <th scope="col">Temporary User</th>
                  <!-- <th scope="col">Date</th> -->
                  <th scope="col">Server</th>
                  <th scope="col">Status</th>
                  <th scope="col">Update</th>
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
                    <!-- <td>
                      <input type="checkbox" class="temp-user-checkbox" bind:checked={user.disableDate} data-userid={user._id} />
                    </td> -->
                    <td>
                      {user?.disableDate || "NO "}
                       <!-- <input type="date" class="disable-date" data-userid={user._id} bind:value={user.disableDate} />       -->
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
                      <a href={`/updateUser/${user._id}`}>
                        <i class="bi bi-person-fill-up"></i>
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

<script>
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
            } 
            else {
              goto('/login');
            }
        }
    })
  // Form Data Variables
  let userName = "";
  let email = "";
  let password = "";
  let status = false;
  let temp = false;
  let disableDate = "";
  // Toggle disableDate visibility based on temp checkbox
  function toggleDisableDate() {
    if (!temp) {
      disableDate = "";
    }
  }
  // Form Submission Handler (Optional)
  async function submitForm(event) {
    //Prevent default form submission (if handling it manually)
    event.preventDefault();
    const data = {
      userName,
      email,
      password,
      status,
      disableDate
    }
    console.log(data);
    const response = await fetch("http://127.0.0.1:7930/user",{
      method:'POST',
      headers: { 'Content-Type' : 'application/json' },
      body: JSON.stringify(data)
    });
    if(!response) return alert("error while add user")
    const result = response.json()
    alert("User Added Successfully")
    window.location.href = "/users"
    console.log({
      userName,
      email,
      password,
      status,
      temp,
      disableDate
    });
  }
</script>

<main id="main" class="main">
  <div class="card">
    <div class="card-body">
      <h5 class="card-title">Create User</h5>

      <form action="/create/addUser" method="POST" on:submit={submitForm}>
        <!-- Username Field -->
        <div class="row mb-3">
          <label for="username" class="col-sm-2 col-form-label">Username</label>
          <div class="col-sm-10">
            <input type="text" class="form-control" name="userName" bind:value={userName} required />
          </div>
        </div>

        <!-- Email Field -->
        <div class="row mb-3">
          <label for="email" class="col-sm-2 col-form-label">Email</label>
          <div class="col-sm-10">
            <input type="email" class="form-control" name="email" bind:value={email} required />
          </div>
        </div>

        <!-- Password Field -->
        <div class="row mb-3">
          <label for="password" class="col-sm-2 col-form-label">Password</label>
          <div class="col-sm-10">
            <input type="password" class="form-control" name="password" bind:value={password} required />
          </div>
        </div>

        <!-- Status Checkbox -->
        <div class="row mb-3">
          <label class="form-check-label col-sm-2 col-form-label" for="status">Status</label>
          <div class="col-sm-10">
            <input class="form-check-input" type="checkbox" name="status" id="status" bind:checked={status} />
          </div>
        </div>

        <!-- Temporary Checkbox & Disable Date -->
        <div class="row mb-3">
          <label class="form-check-label col-sm-2 col-form-label" for="temp">Temporary</label>
          <div class="col-sm-10">
            <input class="form-check-input" type="checkbox" name="temp" id="temp" bind:checked={temp}
              on:change={toggleDisableDate} />
            {#if temp}
                <input class="form-control mt-2" type="date" id="disableDate" name="disableDate" bind:value={disableDate} required />
              {/if}
            </div>
          </div>
  
          <!-- Submit & Reset Buttons -->
          <div class="row mb-3">
            <div class="text-center">
              <button type="submit" class="btn btn-primary mx-2">Submit</button>
              <button type="reset" class="btn btn-secondary mx-2">Reset</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </main>
  
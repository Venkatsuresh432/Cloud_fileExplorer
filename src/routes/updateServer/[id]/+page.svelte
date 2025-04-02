<script>
    import { read } from '$app/server'
    import { onMount } from 'svelte'
    import { render } from 'svelte/server';
    import { userStore } from '$lib/store';
    import { get } from 'svelte/store'; 
    import Cookies from "js-cookie";
    import { goto } from "$app/navigation";
    import { page }  from "$app/stores";

    import { dangerToast, warningToast, successToast, infoToast}  from "$lib/toastNotifications";
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
  
  
    let file = null;
    let fileContent ="";
    let fileType =""; 
    let id = $page.params.id;
    let serverName = "";
    let hostToConnect = "";
    let port = "";
    let password = "";
    let privateKey ="";
    let bypassProxy = false;
    let status = false;
    let temp = false;
    let disableDate = "";
    
  function handleFileUpload(event) {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;
  
    // Ensure the file has a .pem extension
    const fileName = uploadedFile.name;
    if (!fileName.endsWith(".pem")) {
      warningToast("Only .pem files are allowed!");
      return;
    }
  
    readPemFile(uploadedFile);
  }
  
  function readPemFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      const pemContent = reader.result;
      console.log("PEM File Content:\n", pemContent);
      privateKey = pemContent;
    };
    reader.readAsText(file);
  }
      function toggleDisableDate() {
        if (!temp) {
          disableDate = "";
        }
      }


     async function fetchData(){
        const response = await fetch(`http://localhost:7930/server/${id}`,{ 
            method: "GET",
            headers:{ Authorization: `Bearer ${user?.token}`}
        });
        if(!response.ok) return dangerToast('Error While Fetch Server Data');
        const data = await response.json();
        console.log(data)
            serverName = data.server.serverName;
            hostToConnect = data.server.hostToConnect;
            port = data.server.port;
            password = data.server.password,
            privateKey = data.server.privateKey,
            bypassProxy =data.server.bypassProxy,
            status = data.server.status,
            disableDate = data.server.disableDate
     }
    
      async function submitForm(event) {
        event.preventDefault();
        const data={
          serverName,
          hostToConnect,
          port,
          password,
          privateKey,
          bypassProxy,
          status,
          disableDate
        };
        const response = await fetch(`http://localhost:7930/server/update/${id}`,{
          method: "PUT",
          headers:{ "Content-Type": "application/json", Authorization: `Bearer ${user?.token}`},
          body: JSON.stringify(data)
        });
        if(!response.ok) return warningToast("Error While Updating Server");
        const result = response.json();
        successToast("Server Updated Succcessfully"); 
        window.location.href = "/servers"
        console.log(result);
      }
      onMount(fetchData);
    </script>
    
    <main id="main" class="main">
      <div class="card">
        <div class="card-body">
          <h5 class="card-title">Server Creation</h5>
    
          <form  on:submit={submitForm}>
            <!-- Server Name -->
            <div class="row mb-3">
              <label for="serverName" class="col-sm-2 col-form-label">Server Name*</label>
              <div class="col-sm-10">
                <input type="text" class="form-control" id="serverName" name="serverName" bind:value={serverName} required />
              </div>
            </div>
    
            <!-- Host To Connect -->
            <div class="row mb-3">
              <label for="hostUrl" class="col-sm-2 col-form-label">Host To Connect*</label>
              <div class="col-sm-10">
                <input type="text" class="form-control" id="hostUrl" name="hostToConnect" bind:value={hostToConnect} required title="Enter a valid IPv4 or IPv6 address" />
              </div>
            </div>
    
            <!-- Port -->
            <div class="row mb-3">
              <label for="port" class="col-sm-2 col-form-label">Port*</label>
              <div class="col-sm-10">
                <input type="number" class="form-control" id="port" name="port" bind:value={port} required />
              </div>
            </div>
    
            <!-- Password -->
            <div class="row mb-3">
              <label for="password" class="col-sm-2 col-form-label">Password*</label>
              <div class="col-sm-10">
                <input type="password" class="form-control" id="password" name="password" bind:value={password} required />
              </div>
            </div>
    
            <!-- Private Key (Textarea) -->
            <div class="row mb-3">
              <label for="privateKey" class="col-sm-2 col-form-label">Private Key</label>
              <div class="col-sm-10">
                <textarea class="form-control" id="privateKey" name="passKey" rows="4" bind:value={privateKey}></textarea>
              </div>
            </div>
    
            <!-- File Upload -->
            <div class="mb-3">
              <p class="text-center">or</p>
              <input class="form-control" type="file" accept='.pem' name="passKey" id="formFileMultiple" on:change={handleFileUpload} />
            </div>
    
            <!-- Bypass Proxy Checkbox -->
            <div class="row mb-3 form-check">
              <div class="col-sm-10 offset-sm-2">
                <input class="form-check-input" type="checkbox" id="bypassProxy" name="bypassProxy" bind:checked={bypassProxy} />
                <label class="form-check-label" for="bypassProxy">Bypass Proxy</label>
              </div>
            </div>
    
            <!-- Status Checkbox -->
            <div class="row mb-3 form-check">
              <div class="col-sm-10 offset-sm-2">
                <input class="form-check-input" type="checkbox" id="status" name="status" bind:checked={status} />
                <label class="form-check-label" for="status">Status</label>
              </div>
            </div>
    
            <!-- Temporary Checkbox & Disable Date -->
            <div class="row mb-3 form-check">
              <div class="col-sm-10 offset-sm-2">
                <input class="form-check-input" type="checkbox" id="tempCheckbox" name="temp" bind:checked={temp} on:change={toggleDisableDate} />
                <label class="form-check-label" for="tempCheckbox">Temporary Date</label>
                {#if temp}
                  <input class="form-control mt-2" type="date" name="disableDate" id="disableDate" bind:value={disableDate} required />
                {/if}
              </div>
            </div>
    
            <!-- Submit & Reset Buttons -->
            <div class="text-center">
              <button type="submit" class="btn btn-primary mx-2">Submit</button>
              <button type="reset" class="btn btn-secondary mx-2">Reset</button>
            </div>
          </form>
        </div>
      </div>
    </main>
    
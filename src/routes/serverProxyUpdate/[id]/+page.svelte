<script>
    import { page }  from '$app/stores'
    export let id = $page.params.id;
    export let name;
    let servers = ''
    let isChecked = "";

    async function serverData() {
    const response = await fetch(`http://localhost:7930/server/${id}`, { method: 'GET' });
    if(!response.ok)  return alert("Error While getting Server");
    const serverData = await response.json();
    alert(serverData.message)
    servers = serverData.server; 
    console.log(servers)
    isChecked = servers.status;
   
  }


    const handleSubmit = async (event) => {
        event.preventDefault();
        const response = await fetch(`http://localhost:7930/servers/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                bypassProxy: isChecked ? 1 : 0
            })
        });
        if (response.ok) {
            console.log("Proxy access updated successfully");
            goto('/servers')
        } else {
            console.error("Failed to update proxy access");
        }
    };
</script>

<main id="main" class="main">
    <div class="card row-md-6 pt-5">
        <div class="card-header text-center">{name}</div>
        <div class="card-body d-flex flex-column">
            <h5 class="card-title text-center">Proxy Access</h5>

            <form on:submit={handleSubmit}>
                <div class="form-check d-flex justify-content-center mx-2 py-3">
                    <input class="form-check-input me-5" type="checkbox" bind:checked={isChecked} id="flexCheckDefault" />
                    <label class="form-check-label m-2" for="flexCheckDefault">Yes/No</label>
                </div>

                <div class="row-sm-3 d-flex justify-content-center">
                    <button class="btn btn-primary" type="submit">Submit</button>
                </div>
            </form>
        </div>
    </div>
</main>
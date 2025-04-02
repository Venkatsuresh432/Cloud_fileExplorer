<script>
	import { goto } from '$app/navigation';
    import { page } from '$app/stores'
    export let id = $page.params.id;
    import { onMount } from "svelte";
    let isChecked = ''
    let users ='';
    async function userData() {
    const response = await fetch(`http://127.0.0.1:7930/user/${id}`, { method : 'GET' })
    if(!response.ok) return alert("fetch failed")
    const userItem = await response.json()
    alert(userItem.message)
    users = userItem.user
    console.log(users)
    isChecked = Boolean(users.status)
  }

    const handleSubmit = async (event) => {
        event.preventDefault();
        const response = await fetch(`http://localhost:7930/user/status/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                status: isChecked ? 1 : 0
            })
        });
        if (response.ok) {
            console.log("User activation status updated successfully");
            goto('/users')
        } else {
            console.error("Failed to update user activation status");
        }
    };
    onMount(userData)
</script>

<main id="main" class="main">
    <div class="card row-md-6 pt-5">
        <div class="card-header text-center">{name}</div>
        <div class="card-body d-flex flex-column">
            <h5 class="card-title text-center">Activate/Deactivate the user</h5>

            <form on:submit={handleSubmit}>
                <div class="form-check d-flex align-items-center justify-content-center mx-2 py-3">
                    <input class="form-check-input me-5" type="checkbox" bind:checked={isChecked}
                        id="flexCheckDefault" />
                    <label class="form-check-label m-2" for="flexCheckDefault">Activate</label>
                </div>

                <div class="row-sm-3 d-flex justify-content-center">
                    <button class="btn btn-primary" type="submit">Submit</button>
                </div>
            </form>
        </div>
    </div>
</main>
<script>
    import { toast } from '@zerodevx/svelte-toast'
    import { onMount } from "svelte";
    import { clearCopiedItems, userStore as store } from '$lib/store'; 
    import { goto }  from '$app/navigation'
    import { get } from 'svelte/store'; 
    import Cookies from "js-cookie";
   
    let email = "";
    let password = "";
    let isChecked ="";
  
    function removeAllData(){
      store.set(null);
      Cookies.remove("user");
      clearCopiedItems();
    }
    async function login(event) {
      event.preventDefault(); 
      try {
        if(!isChecked)
        {
          toast.push('Please Check The Remember me Button', { theme: {
            '--toastColor': '#856404',
            '--toastBackground': '#FFF3CD',
            '--toastBarBackground': '#FFA500'
            },pausable:true}) 
            return;
        } 
        const response = await fetch("http://localhost:7930/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!response.ok) {
            toast.push('Login Failed:Invalid Credentials', { theme: {
            '--toastColor': '#721C24',
            '--toastBackground': '#F8D7DA',
            '--toastBarBackground': '#DC3545'
            },pausable:true})
          return;
        }
        const data = await response.json();
        console.log(data)
        const user = data.data
        Cookies.set("user", JSON.stringify({
                name: user.userName,
                email: user.email,
                id: user._id,
                token: data.token,
                role: user.role
            }), { expires: 1, path: '/' });
            store.set({
                name: user.userName,
                email: user.email,
                id: user._id,
                token: data.token,
                role: user.role
            });
            toast.push('Login Success', { theme: {
            '--toastColor': '#155724',
            '--toastBackground': '#DFF6DD',
            '--toastBarBackground': '#28A745'
          }, pausable:true})
          if(user.role === 'admin')
          { goto('/users',  { replaceState: true, invalidateAll: true })}
          else
          { goto(`/usersServerList/${user._id}`,{ replaceState: true, invalidateAll: true })}
      } 
      catch (error) {
        console.error("Login error:", error.message);
        toast.push('Login Failed:'+error.message, { theme: {
            '--toastColor': '#721C24',
            '--toastBackground': '#F8D7DA',
            '--toastBarBackground': '#DC3545'
            },pausable:true})
      }
    }
    onMount(removeAllData);
  </script>
  <main>
    <div class="container">
      <section class="section register min-vh-100 d-flex flex-column align-items-center justify-content-center py-4">
        <div class="container">
          <div class="row justify-content-center">
            <div class="col-lg-4 col-md-6 d-flex flex-column align-items-center justify-content-center">
              <div class="d-flex justify-content-center py-4">
                <div class="logo d-flex align-items-center w-auto">
                  <span class="d-none d-lg-block">FileExplorer</span>
                </div>
              </div>
              <div class="card mb-3">
                <div class="card-body">
                  <div class="pt-4 pb-2">
                    <h5 class="card-title text-center pb-0 fs-4">Login to Your Account</h5>
                    <p class="text-center small">Enter your Email & password to login</p>
                  </div>
  
                  <!-- Login Form with Svelte bindings -->
                  <form class="row g-3 needs-validation" on:submit={login} novalidate>
                    <div class="col-12">
                      <label for="yourEmail" class="form-label">Email</label>
                      <div class="input-group has-validation">
                        <span class="input-group-text" id="inputGroupPrepend">@</span>
                        <input type="email" name="email" class="form-control" id="yourEmail" bind:value={email} required />
                        <div class="invalid-feedback">Please enter your Email!</div>
                      </div>
                    </div>
  
                    <div class="col-12">
                      <label for="yourPassword" class="form-label">Password</label>
                      <input type="password" name="password" class="form-control" id="yourPassword" bind:value={password} required />
                      <div class="invalid-feedback">Please enter your password!</div>
                    </div>
  
                    <div class="col-12">
                      <div class="form-check">
                        <input class="form-check-input" type="checkbox" name="remember" bind:checked={isChecked} id="rememberMe" required/>
                        <label class="form-check-label" for="rememberMe" >Remember me</label>
                      </div>
                    </div>
  
                    <div class="col-12">
                      <button class="btn btn-primary w-100" type="submit">Login</button>
                    </div>
                  </form>
  
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </main>
 
  <style>
  </style>
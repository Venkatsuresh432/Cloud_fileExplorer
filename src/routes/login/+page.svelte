<script>
    import { onMount } from "svelte";
    import { userStore as store } from '$lib/store'; 
    import { goto }  from '$app/navigation'
    import { get } from 'svelte/store'; 
   
    import Cookies from "js-cookie";
    
 
    let email = "";
    let password = "";
  
    async function login(event) {
      event.preventDefault(); 
      console.log("Logging in with:", email, password);
      try {
        const response = await fetch("http://localhost:7930/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
  
        if (!response.ok) {
          alert("Login failed: Invalid credentials.");
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
        console.log("Login successful:", data);
          if(user.role === 'admin')
          {goto('/users',  { replaceState: true, invalidateAll: true })}
          else
          {goto(`/usersServerList/${user._id}`,{ replaceState: true, invalidateAll: true })}
      } 
      catch (error) {
        console.error("Login error:", error.message);
        alert("An error occurred. Please try again.");
      }
    }
  </script>
  
  <main>
    <div class="container">
      <section class="section register min-vh-100 d-flex flex-column align-items-center justify-content-center py-4">
        <div class="container">
          <div class="row justify-content-center">
            <div class="col-lg-4 col-md-6 d-flex flex-column align-items-center justify-content-center">
              <div class="d-flex justify-content-center py-4">
                <a href="/index" class="logo d-flex align-items-center w-auto">
                  <span class="d-none d-lg-block">Cloud File Manager</span>
                </a>
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
                        <input class="form-check-input" type="checkbox" name="remember" value="true" id="rememberMe" required/>
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
  
<script>
    import { userStore as store } from '$lib/store';
    import { get } from 'svelte/store'; 
    import { onMount } from "svelte";
    import Cookies from "js-cookie";
    import { goto } from '$app/navigation';
    let user = null;
    onMount(() => {
        const storedUser = Cookies.get("user");
        if (storedUser) {
            user = JSON.parse(storedUser);
            store.set(user);
        } else {
            goto('/login'); 
        }
    });

  function logout() {
        store.set(null);
        Cookies.remove("user");
        goto("/login");
    }
</script>
  {#if user}
  <header id="header" class="header fixed-top d-flex align-items-center">
    <!-- Logo -->
    <div class="d-flex align-items-center justify-content-between ms-4">
      <a href="#" class="logo d-flex align-items-center">
        <!-- <img src="/assets/img/logo.png" alt="" /> -->
        <span class="d-none d-lg-block">FileExplorer</span>
      </a>
      <i class="bi bi-list toggle-sidebar-btn"></i>
    </div>
  
    <!-- Search Bar -->
    <div class="search-bar">
      <form class="search-form d-flex align-items-center" method="POST" action="#">
        <input type="text" name="query" placeholder="Search" title="Enter search keyword" />
        <button type="submit" title="Search">
          <i class="bi bi-search"></i>
        </button>
      </form>
    </div>
  
    <!-- User Profile and Notifications -->
    <nav class="header-nav ms-auto">
      <ul class="d-flex align-items-center">
        <!-- Mobile Search Toggle -->
        <li class="nav-item d-block d-lg-none">
          <a class="nav-link nav-icon search-bar-toggle" href="#">
            <i class="bi bi-search"></i>
          </a>
        </li>


        <!-- Profile Display -->
        <li class="nav-item dropdown pe-3 me-5">
          <a class="nav-link nav-profile d-flex align-items-center pe-0" href="#" data-bs-toggle="dropdown">
            <img src="/assets/img/profile-img.jpg" alt="Profile" class="rounded-circle" />
            <span class="d-none d-md-block dropdown-toggle ps-2">{user?.name}</span>
          </a>
          <ul class="dropdown-menu dropdown-menu-end dropdown-menu-arrow profile">
            <li class="dropdown-header">
              <h6>Hi, {user?.name}</h6>
            </li>
            <li><hr class="dropdown-divider" /></li>
            <li>
              <a class="dropdown-item d-flex align-items-center" href="#" on:click={logout}>
                <i class="bi bi-box-arrow-right"></i> <span>Sign Out</span>
              </a>
            </li>
          </ul>
        </li>
      </ul>
    </nav>
  </header>
<aside id="sidebar" class="sidebar">
    <ul class="sidebar-nav" id="sidebar-nav">
      <li class="nav-heading">Menus</li>
      {#if user && user?.role === "admin"}
        <li class="nav-item">
          <a class="nav-link collapsed" href="/users">
            <i class="bi bi-person"></i>
            <span>Users</span>
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link collapsed" href="/servers">
            <i class="bi bi-hdd-stack-fill"></i>
            <span>Servers</span>
          </a>
        </li>
      {/if}
      {#if user && user?.role === "client"}
        <li class="nav-item">
          <a class="nav-link collapsed" href="/usersServerList">
            <i class="bi bi-hdd-stack-fill"></i>
            <span>Servers</span>
          </a>
        </li>
      {/if}
    </ul>
  </aside>
   {/if}
   

<slot />

<style>
    /* #page-loader {
        position: fixed;
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        transition: opacity 0.5s ease-out;
    }
    #page-loader .spinner-border {
        width: 3rem;
        height: 3rem;
        color: #007bff;
    } */
</style>

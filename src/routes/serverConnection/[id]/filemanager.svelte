<script>
    "use strict";
    import { onMount } from 'svelte';
    import { userStore } from '$lib/store';
    import { get } from 'svelte/store'; 
    import Cookies from "js-cookie";
    import { goto } from "$app/navigation";
    import { page } from '$app/stores'
    let user = null;
    $: user = $userStore;
   import './filemanager2.css'
   import { storeCopiedItems, getCopiedItems, clearCopiedItems } from "$lib/store";
   import { dangerToast, warningToast, successToast, infoToast}  from "$lib/toastNotifications"
	import { success } from '$lib/server/utils/responseHandler';


   let serverId = $page.params.id;
    let folderName = "";
    let server = "";
    let files = "";
    let currentPath = "";
    let breadcrumbPaths = "";
    let modal = null; 
    let showModal = false;
    let selectedPath = [];
    let selectedFiles = [];
    let clipboardItems = '';
    let multiCopyMode = false; 

    let pos = { x:0, y:0 }
    let menu = { h:0, y:0}
    let browser = { h:0, y:0 }
    let showMenu = false;
    let content;

    function collectSelectedPaths() {
         clipboardItems = [];
        const checkboxes = document.querySelectorAll(".file-select-checkbox:checked");
        checkboxes.forEach((checkbox) => {
            clipboardItems.push(checkbox.value);
        });
    }


    function toggleMultiCopy() {
        multiCopyMode = !multiCopyMode;

        // Get all checkboxes
        const checkboxes = document.querySelectorAll(".file-select-checkbox");
        
        checkboxes.forEach((checkbox) => {
            if (multiCopyMode) {
                checkbox.classList.remove("hidden"); 
            } else {
                checkbox.classList.add("hidden"); 
            }
        });
    }

    function rightClickContextMenu(e) {   
        showMenu = true;
        browser={
            w:window.innerWidth,
            h:window.innerHeight
        };
        pos={
            x: e.clientX,
            y: e.clientY
        };
        if ( browser.h - pos.y < menu.h )
            pos.y = pos.y -menu.h
        if( browser.w - pos.x < menu.w )
            pos.x = pos.x - menu.w
    
        const fileItem = e.target.closest(".file-item");
        if (fileItem) {
            selectedPath = fileItem.dataset.path; 
        } 
        else {
            selectedPath = null; 
        }
        } 
 
    function onPageClick(e){
        showMenu = false;
        selectedPath ='';
    }
    
    function getContextMenuDimension(node){
        let height = node.offsetHeight
        let width = node.offsetWidth
    
        menu = {
            h: height,
            w: width
        }
    }

    function copyItem() {
        toggleMultiCopy()
        collectSelectedPaths();
        console.log(clipboardItems)
        selectedPath ? storeCopiedItems([selectedPath]) : storeCopiedItems(clipboardItems);
        infoToast(`Copied successfully`);
    }

    function pasteItem() {
        const copiedItems  = getCopiedItems();
        const destPath = currentPath;
        // alert("Copy:"+ copiedItems)
        if(!copiedItems || copiedItems === 0) return dangerToast("No copied items found");
        fetch(`http://localhost:7930/sftp/pasted/${serverId}?path=${destPath}`, {
            method: "POST",
            headers: { "Content-Type": "application/json",  Authorization: `Bearer ${user?.token}`  },
            body: JSON.stringify(copiedItems),
        })
        .then(res => res.json())
        .then(data => {
            infoToast("Success: " + data.message);
            clearCopiedItems();
            fetchFiles(destPath);
        })
        .catch(err => console.error("Paste API Error:", err));    
    }
    
    function renameItem() {
        if (!selectedPath) return warningToast("No file selected!");

        const newName = prompt("Enter new name:");
        if (!newName) return;

        const parentPath = selectedPath.substring(0, selectedPath.lastIndexOf("/"));
        const newPath = `${parentPath}/${newName}`;

        fetch("http://localhost:7930/sftp/rename", {
            method: "POST",
            headers: { "Content-Type": "application/json",  Authorization: `Bearer ${user?.token}` },
            body: JSON.stringify({ serverId, oldPath: selectedPath, newPath }),
        })
        .then(res => res.json())
        .then(data =>{
            infoToast("alert: "+data.message);
            fetchFiles(currentPath);
        })
        .catch(err => console.error("Rename API Error:", err));
    }
    
    function deleteItem() {
        toggleMultiCopy();
        collectSelectedPaths();
        
        var deleteList; 
        selectedPath? deleteList = [selectedPath] : deleteList = clipboardItems;
        alert(deleteList)
        const path = currentPath;
        fetch("http://localhost:7930/sftp/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json",  Authorization: `Bearer ${user?.token}` },
            body: JSON.stringify({ serverId, filePaths: deleteList  }),
        })
        .then(res => res.json())
        .then(data => {
           
            infoToast("Deleted Successfully!"+data.message);
            fetchFiles(path);
        }
    )
        .catch(err => console.error("Delete API Error:", err));
    }
    
    let menuItems = [
        {
            'name':'copy',
            'onClick': copyItem,
            'displayText': 'copy',
            'class': "bi bi-files"
        },
        {
            "name":"paste",
            "onClick":pasteItem,
            "displayText":'paste',
            "class": "bi bi-clipboard-check"
        },
        {
            "name":"rename",
            "onClick":renameItem,
            "displayText":"Rename",
            "class":"bi bi-pencil-square"
        },
        {
            "name":"delete",
            "onClick":deleteItem,
            "displayText":"delete",
            "class":"bi bi-trash"
        }
    ];
    
     async function fetchFiles(path = "") {
      const response = await fetch(`http://localhost:7930/sftp/files/${serverId}?path=${path}`,{ method : "GET", headers : {  Authorization: `Bearer ${user?.token}` }})
      if(!response.ok) return dangerToast("error while fetch data");
      const fileData = await response.json();
        successToast(fileData.message)
        console.log('Fetching files...',fileData);
        server = fileData.server;
        breadcrumbPaths = fileData.breadcrumbPaths;
        files=fileData.files;
        currentPath = fileData.currentPath;
    }
    // navigation 
    async function confirmFolderOpen(path) {
        event.preventDefault(); 
        const userConfirmed = confirm("Do you want to open this folder?");
        if (userConfirmed) {
            infoToast("Navigating To"+ path)
           await fetchFiles(path) 
        }
    }

    // upload Model
    function handleFileSelection(event) {
        files = Array.from(event.target.files);
        progress = {}; 
    }
    async function uploadFiles(event) {
        event.preventDefault();
        if (files.length === 0) {
            warningToast("Please select files to upload.");
            return;
        }
        for (let file of files) {
            const uploadId = Date.now().toString();
            const formData = new FormData();
            formData.append("files", file);
            formData.append("uploadId", uploadId);

            try {
                const response = await fetch(`http://localhost:7930/sftp/uploadFile/${serverId}?path=${currentPath}`,
                 {
                    method: "POST",
                    headers :{ Authorization: `Bearer ${user?.token}`},
                    body: formData,
                });

                if (!response.ok) return dangerToast("Upload failed");

                const result = await response.json();
               
                closeModal("uploadModal");
                successToast(`Uploaded: ${file.name}`);
            } catch (error) {
                console.error(`Upload failed for ${file.name}:`, error);
                dangerToast(`Upload failed for ${file.name}`);
                files ='';
                closeModal("uploadModal");
            }
        }
        files ='';
            fetchFiles();
            closeModal("uploadModal");
    };

    // craete folder
    async function createFolder(event) {
        event.preventDefault();
        if (!folderName.trim()) {
            warningToast("Folder name is required!");
            return;
        }
    //    alert(folderName)
        try {
            const response = await fetch(`http://localhost:7930/sftp/createFolder/${serverId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                     Authorization: `Bearer ${user?.token}`
                },
                body: JSON.stringify({ folderName }),
            });
            const result = await response.json();
            console.log(result)
            if (response.ok) {
                successToast("Folder created successfully!");
                folderName = ""; 
                closeModal(addFolderModal); 
            } else {
                dangerToast(result.message || "Failed to create folder.");
                closeModal(addFolderModal);
            }
        } 
        catch (error) {
            console.error("Error creating folder:", error.message);
            dangerToast("An error occurred while creating the folder.");
            folderName = "";
            closeModal(addFolderModal);
        }
    }
    function collectSelectedFiles() {
        selectedFiles = [];
        const checkboxes = document.querySelectorAll(".download-checkbox:checked");
        checkboxes.forEach((checkbox) => {
            selectedFiles.push(checkbox.value);
        });

        if (selectedFiles.length === 0) {
            warningToast("Please select at least one file to download.");
            return false;
        }
        return true;
    }

    async function downloadSelectedFiles(event) {
        event.preventDefault()
        if (!collectSelectedFiles()) return;
        try {
            const response = await fetch(`http://localhost:7930/sftp/downloads/${serverId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json",  Authorization: `Bearer ${user?.token}` },
                body: JSON.stringify({ selectedFiles }),
            });

            if (!response.ok)  return dangerToast("Failed to download files");
            
            const blob = await response.blob(); 
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = "downloaded_files.zip"; 
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
            successToast("Downloaded Successfully");
            selectedFiles = [];
            closeModal("downloadModal");

        }
         catch (error) {
            console.error("Download Error:", error);
            dangerToast("An error occurred while downloading files.");
            selectedFiles = [];
            closeModal("downloadModal"); 
        }
    }
 
    function navigateTo(path) {
        console.log('Navigating to:', path);
    }
    // function closeModal() {
    //     document.getElementById("addFolderModal").classList.remove("show");
    //     document.getElementById("addFolderModal").style.display = "none";
    //     document.getElementById("uploadModal").classList.remove("show");
    //     document.getElementById("uploadModal").style.display = "none";
    //     document.getElementById("downloadModal").classList.remove("show");
    //     document.getElementById("downloadModal").style.display = "none";
    // }
    function closeModal(id){
        let modal = new bootstrap.Modal(document.getElementById(id));
        modal.hide();
    }
    
    
    onMount(() => {
        const storedUser = Cookies.get("user");
        if (storedUser) {
            user = JSON.parse(storedUser);
            userStore.set(user);
        } else {
            goto('/login'); 
        };
        fetchFiles();
    });
   
</script>


    <div class="container">    
    <header class="py-3">
            <nav class="breadcrumb-container px-5" aria-label="breadcrumb">
                <ol class="breadcrumb">
                    {#each breadcrumbPaths as path, i}
                        <li class="breadcrumb-item">
                            {#if i < breadcrumbPaths.length - 1}
                                <a href="#" on:click|preventDefault={() => fetchFiles(path.path)}>{path.name}</a>
                            {:else}
                                {path.name}
                            {/if}
                        </li>
                    {/each}
                </ol>
            </nav>
        </header> 
        
    <main class="container mt-2">
            <section class="file-manager-actions my-2 px-3">
                <div class="file-manager-options">
                    <button class="btn btn-primary me-2" id="uploadBtn" data-bs-toggle="modal" data-bs-target="#uploadModal">
                        <i class="bi bi-cloud-arrow-up"></i> Upload
                    </button>
                    <button class="btn btn-primary me-2" id="addFolderBtn" data-bs-toggle="modal" data-bs-target="#addFolderModal">
                        <i class="bi bi-folder-plus"></i> Add Folder
                    </button>
                    <button class="btn me-2" on:click={toggleMultiCopy}>
                        <i class="bi bi-files me-2"></i> Select
                    </button>
                    <button class="btn me-2" id="downloadBtn" data-bs-toggle="modal" data-bs-target="#downloadModal" >  <!-- on:click={fetchFiles} -->
                        <i class="bi bi-cloud-arrow-down"></i> Download
                    </button>
                </div>
            </section>
            
            <section class="file-manager-container file-manager-col-view py-3 my-3" data-server-id={server.id} on:contextmenu|preventDefault={(e)=> rightClickContextMenu(e)} on:click={onPageClick} >
                <!-- <div class="row"> -->
                    {#if files && files.length > 0}
                        {#each files as file}
                            <article class="col-4 col-sm-3 col-md-2 file-item" data-path={file.path}>
                                <input id="fileSelect" type="checkbox" class="file-select-checkbox hidden" value={file.path} />
                                {#if file.type === "folder"}
                                    <a class="folder" href="#" on:click|preventDefault={confirmFolderOpen(file.path)} >     <!--     {`http/sftp/sftpLoading/${server.id}?path=${encodeURIComponent(file.path)}`} -->
                                        <figure>
                                            <div class="file-item-img text-secondary" style={`background-image: url('${file.icon}');`}></div>
                                            <figcaption class="file-item-name">{file.name}</figcaption>
                                        </figure>
                                    </a>
                                {:else}
                                    <figure>
                                        <div class="file-item-img" style={`background-image: url('${file.icon}');`}></div>
                                        <figcaption class="file-item-name">{file.name}</figcaption>
                                    </figure>
                                {/if}
                            </article>
                        {/each}
                    {:else}
                        <p>No File Found</p>
                    {/if}
                <!-- </div> -->
            </section>
        </main>
    </div>  
    <div id="multiCopyActions" class="d-flex justify-content-center">
        <button id="confirmCopy" class="hidden btn btn-primary mx-2" type="button" on:click={copySelectedItems}>Copy</button>
        <button id="cancelMultiCopy" class="hidden btn btn-secondary mx-2" type="button" on:click={cancelMultiCopy}>Close</button>
    </div>
  <!-- Upload Modal -->

  <div id="uploadModal" class="modal fade" tabindex="1" role="dialog">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Upload Files & Folders</h5>
                <button class="btn-close" type="button" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <form on:submit={uploadFiles}>
                    <div class="form-group">
                        <label for="files">Select Files To Upload:</label>
                        <input class="form-control" type="file" id="files" multiple bind:this={files} on:change={handleFileSelection} required />
                    </div>
                    <!-- <div class="progress mt-3" style="height: 20px;">
                        {#each files as file (file.name)}
                            <div class="progress-bar bg-success" role="progressbar" style="width: {progress[file.name] || 0}%;">
                                {progress[file.name] || 0}%
                            </div>
                        {/each}
                    </div> -->
                    <div class="modal-footer">
                        <button class="btn btn-primary" type="submit">Upload</button>
                        <button class="btn btn-secondary" type="button" data-bs-dismiss="modal">Close</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div> 

    
   <!-- Download Modal -->
<div id="downloadModal" class="modal fade" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Download Files & folders</h5>
                    <button class="btn-close" type="button" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="downloadForm">
                        <ul id="downloadFileList" class="list-group">
                            {#each files as file}
                                {#if file.type === 'file'}
                                    <li class="list-group-item">
                                        <input type="checkbox" class="download-checkbox me-2" value={file.path} id={"dl-" + file.name} />
                                        <label for={"dl-" + file.name}>
                                            <img src={file.icon} alt={file.type} width="20" class="me-2" />
                                            {file.name}
                                        </label>
                                    </li>
                                {/if}
                            {/each}
                        </ul>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" type="button" on:click={downloadSelectedFiles}>Download</button>
                    <button class="btn btn-secondary" type="button" data-bs-dismiss="modal">Close</button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Folder Creation Modal -->
 <div id="addFolderModal" class="modal fade" tabindex="-1" role="dialog">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Create New Folder</h5>
                    <button class="btn-close" type="button" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form on:submit={createFolder} method="POST">
                        <div class="form-group">
                            <label for="folderName">Folder Name:</label>
                            <input class="form-control" type="text" id="folderName" name="folderName" bind:value={folderName} required />
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-primary" type="submit">Create</button>
                            <button class="btn btn-secondary" type="button" data-bs-dismiss="modal">Close</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>



{#if showMenu}
<nav use:getContextMenuDimension style="position: absolute; top:{pos.y}px; left:{pos.x}px">
    <div class="navbar" id="navbar">
        <ul>
            {#each menuItems as item}
                {#if item.name == "hr"}
                    <hr>
                {:else}
                    <li><button on:click={item.onClick}><i class={item.class}></i>{item.displayText}</button></li>
                {/if}
            {/each}
        </ul>
    </div>
</nav>
{/if}



<style>
  
 
</style>
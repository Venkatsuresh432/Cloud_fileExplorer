
    const serverId = document.getElementById("serverId").value;
    console.log("Server ID:", serverId);
    const currentPath = document.getElementById("currentPath").value;
    console.log("Current Path:", currentPath);
    let selectedPath = "";
    let copiedPath = "";

    const socket = io("http://localhost:7930");
    const currentFolderPath = "path";
// fetch all functions
    window.onload = function () {
        fetchData();
    };

async function fetchData() {
    try {
        const response = await fetch(`http://127.0.0.1:7930/sftp/files/${serverId}?path=${currentPath}`); // Replace with your API URL
        const data = await response.json();
        console.log("Fetched Data:", data);
        alert("file loading")
        if(!data)
        {
            document.querySelector(".file-manager-container").innerHTML = "<h3>No files found!</h3>"
        }
        // update breadcrumb dynamically
        let breadCrumbHtml = `<li class ="breadcrumb-item"><a href="/sftp/sftpLoading2/${serverId}?path=/>root</a></li>`
        data.breadcrumbPaths.forEach(( breadcrumb, index ) => {
                if( index === data.breadcrumbPaths.length-1){
                    breadCrumbHtml += `<li class="breadcrumb-item active">${breadcrumb.name} (active)</li>`;
                }
                else{
                    breadCrumbHtml += `<li class = "breadcrumb-item"><a href="/sftp/sftpLoading2/${serverId}?path=${breadcrumb.path}">${breadcrumb.name}</a></li>`;
                };
        });
        document.querySelector(".breadcrumb").innerHTML = breadCrumbHtml;

        // update files dynamically
        let fileHtml = "";
        data.files.forEach((file => {
            if(file.type ===  "folder"){
                fileHtml += `<article class ="col-4 col-sm-3 col-md-2 file-item" data-path="${file.path}">
                                <input id = "fileselect" type="checkbox" class ="file-select-checkbox hidden" value ="${file.path}"/> 
                                <a class = "folder" href="/sftp/sftpLoading2/${serverId}?path=${file.path}" onclick="confirmFolderOpen(event, this)">
                                    <figure>
                                            <div class = "file-item-img text-secondary" style="background-image:url('${file.icon}');"></div>
                                            <figcaption class = "file-item-name">${file.name}</figcaption> 
                                    </figure>
                                </a>
                             </article>`;
            }
            else{
                fileHtml += `<article class= "col-4 col-sm-3 col-md-2 file-item" data-path = "${file.path}"  >
                                <input id = "fileselect" type="checkbox" class ="file-select-checkbox hidden" value ="${file.path}" /> 
                                <figure>
                                    <div class= "file-item-img text-secondary" style="background-image:url('${file.icon}');"></div>
                                            <figcaption class ="file-item-name">${file.name}</figcaption>
                                    </figure>
                            </article>`;
            }
        }));
        document.querySelector(".row").innerHTML = fileHtml

    } catch (error) {
        console.error("Error fetching data:", error.message);
        alert(error.message)
    }
}

  // for file open close 
    function confirmFolderOpen(event, element) {
        event.preventDefault(); // Stop the default folder opening

        const userConfirmed = confirm("Do you want to open this folder?");
        if (userConfirmed) {
            window.location.href = element.href; // Navigate to folder if user clicks OK
        }
    }

        //  Copy Function
    //     function copyItem() {
    //         const copyButton = document.getElementById("copyButton"); // Ensure this button exists in your HTML
    //         const fileManagerContainer = document.querySelector(".file-manager-container");
    //         fileManagerContainer.addEventListener("contextmenu", function (event) {
    //             event.preventDefault(); // Disable default right-click menu
        
    //             const fileItem = event.target.closest(".file-item");
    //             if (fileItem) { 
    //                 selectedPath = fileItem.dataset.path; // Store the file/folder path
    //                 console.log(selectedPath)
    //                 copyButton.setAttribute("onclick", `copyItem('${selectedPath}')`); // Update button dynamically
    //             } else {
    //                 selectedPath = null;
    //                 console.log(selectedPath)
    //                 copyButton.setAttribute("onclick", "copyItem(null)"); // Prevent error when clicking empty space
    //             };
    //         });
    //     if (!selectedPath) return alert("No file selected to copy!");   
    //     fetch("/sftp/copy", {
    //         method: "POST",
    //         credentials: "include",
    //         headers: { "Content-Type": "application/json" },
    //         body: JSON.stringify({ remotePath: selectedPath })
    //     })
    //     .then(res => res.json())
    //     .then(data => {
    //         console.log(data);
    //         if (data.message) {
    //             copiedPath = selectedPath;
    //             console.log("Copied Path:", copiedPath);
    //             // document.getElementById("paste").classList.remove("disabled"); 
    //             alert("Success:" + data.message);}
    //     })
    //     .catch(err => console.error("Copy API Error:", err));
        
    // }



    document.querySelector(".file-manager-container").addEventListener("contextmenu", function (event) {
        event.preventDefault(); // Prevent default right-click menu
    
        const fileItem = event.target.closest(".file-item"); // Find closest file item
        if (fileItem) { 
            selectedPath = fileItem.getAttribute("data-path"); // Get path from data attribute
            console.log("Selected Path:", selectedPath);
        } else {
            selectedPath = null;
            console.log("No file selected.");
        }
    });
        function cutItem (){
            if(!selectedPath){
                alert("No file/folder selected to cut ")
            } 
            console.log(selectedPath);
            fetch("/sftp/cut" ,{
                method:"POST",
                credentials:"include",
                headers:{"Content-Type" : "application/json"},
                body:  JSON.stringify({ remotePath: selectedPath, action:"cut" })
            })
            .then(res => res.json)
            .then(data => {
                alert(data)
                showToast(data.message, "info");
            })
            .catch(err  => console.error("Cut Api Error :",err.message))
        }

    function copyItem() {
        if (!selectedPath) {
            alert("No file/folder selected to copy!");
            return;
        }
    
        fetch("/sftp/copy", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ remotePath: selectedPath, action: "copy"})
        })
        .then(res => res.json())
        .then(data => {
            console.log(data);
            if (data.message) {
                alert("Success: " + data.message);
            }
        })
        .catch(err => console.error("Copy API Error:", err));
    }

     function pasteItem() {
        //- if (!copiedPath) return alert(" No file copied!"); // Ensure destination is selected
        var destPath = currentPath;
             alert(destPath)

        fetch(`/sftp/paste/${serverId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ destinationPath: destPath })
        })
        .then(res => res.json())
        .then(data => {
            if (data.message) {
                console.log(" Pasted to:", destPath);
                alert("Success: " + data.message);
            }
        })
        .catch(err => console.error(" Paste API Error:", err));
        showToast("file Pasted Successfully" ,"info")
    }

      //  Rename Function
      function renameItem() {
        const fileManagerContainer = document.querySelector(".file-manager-container");
            fileManagerContainer.addEventListener("contextmenu", function (event) {
                event.preventDefault(); // Disable default right-click menu
        
                const fileItem = event.target.closest(".file-item");
                if (fileItem) {
                    selectedPath = fileItem.dataset.path; // Store the file/folder path
                    copyButton.setAttribute("onclick", `copyItem('${selectedPath}')`); // Update button dynamically
                } else {
                    selectedPath = null;
                    copyButton.setAttribute("onclick", "copyItem(null)"); // Prevent error when clicking empty space
                };
            });
          if (!selectedPath) return alert("No file selected!");
          const newName = prompt("Enter new name:");
          if (!newName) return;

          const parentPath = selectedPath.substring(0, selectedPath.lastIndexOf("/"));
          const newPath = `${parentPath}/${newName}`;
            alert("Renamed Successfully!")
          sendRequest("/sftp/rename", { serverId, oldPath: selectedPath, newPath });
      }

      async function fetchFiles() {
        try {
            const response = await fetch(`http://127.0.0.1:7930/sftp/files/${serverId}?path=${currentPath}`);
            const data = await response.json();
    
            if (!data || !data.files || data.files.length === 0) {
                alert("File/Folder not found");
                return;
            }
    
            const fileList = document.getElementById("downloadFileList");
            fileList.innerHTML = ""; // Clear previous files
    
            data.files.forEach(file => {
                const listItem = document.createElement("li");
                listItem.className = "list-group-item";
    
                listItem.innerHTML = `
                    <label>
                        <input type="checkbox" class="download-checkbox" name="selectedFiles" value="${file.path}" />
                        ${file.name}
                    </label>
                `;
    
                fileList.appendChild(listItem); //  Corrected appendChild()
            });
            showToast("File fetched successfully")
        } catch (error) {
            console.error("Error fetching files:", error);
            alert("Error: " + error.message);
        }
    }
    
      //  Delete Function
      function deleteItem() {
        const fileManagerContainer = document.querySelector(".file-manager-container");
        fileManagerContainer.addEventListener("contextmenu", function (event) {
            event.preventDefault(); // Disable default right-click menu
    
            const fileItem = event.target.closest(".file-item");
            if (fileItem) {
                selectedPath = fileItem.dataset.path; // Store the file/folder path
                copyButton.setAttribute("onclick", `copyItem('${selectedPath}')`); // Update button dynamically
            } else {
                selectedPath = null;
                copyButton.setAttribute("onclick", "copyItem(null)"); // Prevent error when clicking empty space
            };
        });

          if (!selectedPath || !confirm("Are you sure you want to delete this file?")) return;
          sendRequest("/sftp/delete", { serverId, filePath: selectedPath });
      }

      //  Generic Fetch Function
      function sendRequest(url, bodyData) {
          fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(bodyData)
          })
          .then(res => res.json())
          .then(data => console.log(data))
          .catch(err => console.error("Request Error:", err));
      }

      //  Modal Handling
      document.getElementById("addFolderBtn").addEventListener("click", () => {
          document.getElementById("addFolderModal").classList.add("show");
      });

      document.getElementById("downloadBtn").addEventListener("click", () => {
          document.getElementById("downloadModal").classList.add("show");
      });
      function openUploadModal() {
        let modal = new bootstrap.Modal(document.getElementById("uploadModal"));
        modal.show();
    }
    
      function closeModal(modalId) {
          document.getElementById(modalId).classList.remove("show");
      }
    //download selected files
    function downloadSelectedFiles() {
        alert("Download Initiated");
        let selectedFiles = [];
        document.querySelectorAll(".download-checkbox:checked").forEach(checkbox => {
            selectedFiles.push(checkbox.value);
        });
        
        if (selectedFiles.length === 0) {
            alert("Please select at least one file to download.");
            return;
        }
        
        fetch(`/sftp/downloads/${serverId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ selectedFiles })
        }).then(response => {
            if (!response.ok) {
                throw new Error("Download failed.");
            }
            return response.blob();
        }).then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "downloaded_files.zip";
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            showToast("File Downloaded Successfully","info")
        }).catch(error => {
            alert(error.message);
        });
        }
        document.getElementById("uploadForm").addEventListener("submit", async function (e) {
            e.preventDefault();
            alert("file loading")
            const fileInput = document.getElementById("files");
            const file = fileInput.files[0];
            if (!file) return alert("Please select a file.");

            const progressBar = document.querySelector(".progress-bar");
            updateProgressBar(progressBar, 0);
            const uploadId = Date.now().toString(); // Unique ID to track progress
            const formData = new FormData();
            formData.append("files", file);
            formData.append("uploadId", uploadId);
              
            // Upload file using fetch
           try {
            const response = await fetch(`/sftp/uploadFile/${serverId}?path=${currentPath}&uploadId=${uploadId}`, {
                method: "POST",
                body: formData
            });
    
            const result = await response.json();
            
            socket.on(`uploadProgress-${uploadId}`, (progress) => {
                updateProgressBar(progressBar, progress)
                console.log(progressBar, progress)
                if(progress >= 100){
                    socket.off(`uploadProgress-${result.uploadId}`)
                }
            })
            alert(result.message)
            fetchData();
           } 
           catch (error) {
                console.error("Upload Error: ", error.message);
                alert("upload failed")
           }
        });

        function updateProgressBar (progressBar, percent){
            progressBar.style.width = percent + "%";
            progressBar.textContent = percent + "%";   
        }

     
        function toggleMultiCopy() {
            const checkboxes = document.querySelectorAll(".file-select-checkbox");
            const confirmCopy = document.getElementById("confirmCopy");
            const cancelMultiCopy = document.getElementById("cancelMultiCopy");
            // Toggle checkbox visibility
            checkboxes.forEach(checkbox => {
                checkbox.classList.toggle("hidden");
            });
        
            // Toggle visibility of multiCopyActions div
            confirmCopy.classList.toggle("hidden");
            cancelMultiCopy.classList.toggle("hidden");
        }
    // multiple copied items
        function copySelectedItems() {
            alert(serverId)
            let copiedFiles = [];
            document.querySelectorAll(".file-select-checkbox:checked").forEach((checkbox) => {
                copiedFiles.push(checkbox.value);
            });

            if (copiedFiles.length === 0) {
                alert("Select at least one file or folder.");
                return;
            }

            if (copiedFiles.length > 3) {
                alert("You can copy a maximum of 3 items at a time.");
                return;
            }
            
            toggleMultiCopy();
            fetch("/sftp/copied", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ files: copiedFiles, action:"copy" }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert("Files copied successfully!");
                    cancelMultiCopy();
                    if (data.copiedFiles && data.copiedFiles.length > 0) {
                        document.getElementById("pasteButton").classList.remove("hidden");
                    }
                }
            })
            .catch(error => console.error("Error copying files:", error));
            showToast("Files copied successfully!", "info");
        }

        // multiple copied items
        function cutSelectedItems() {
            alert(serverId)
            let cuttedFiles = [];
            document.querySelectorAll(".file-select-checkbox:checked").forEach((checkbox) => {
                cuttedFiles.push(checkbox.value);
            });

            if (cuttedFiles.length === 0) {
                alert("Select at least one file or folder.");
                return;
            }

            if (cuttedFiles.length > 3) {
                alert("You can copy a maximum of 3 items at a time.");
                return;
            }
            
            toggleMultiCopy();
            fetch("/sftp/cutted", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ files: cuttedFiles, action:"cut" }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert("Files copied successfully!");
                    cancelMultiCopy();
                    if (data.cuttedFiles && data.cuttedFiles.length > 0) {
                        document.getElementById("pasteButton").classList.remove("hidden");
                    }
                }
            })
            .catch(error => console.error("Error copying files:", error));
            showToast("Files copied successfully!", "info");
        }




        function cancelMultiCopy() {
            document.querySelectorAll(".file-select-checkbox").forEach((checkbox) => {
                checkbox.classList.add("hidden");
                checkbox.checked = false;
            });

            document.getElementById("multiCopyActions").classList.add("hidden");
            alert("Multi-copy cancelled!");
        }
        // paste copied items
        function pasteItems() {
            alert(serverId)
            showToast("Files pasted successfully!", "info");
            fetch(`/sftp/pasted/${serverId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(`${data.pastedCount} items pasted successfully!`);
                }
            })
            .catch(error => console.error("Error pasting files:", error));
            showToast("File Pasted Successfully","info")
        }

        // Toast Function
        function showToast(message, type = "success") {
                const toastBody = document.getElementById("toastBody");
                const toastElement = document.getElementById("dynamicToast");

                toastBody.textContent = message;

                let bgClass = "bg-success";
                if (type === "error") bgClass = "bg-danger";
                else if (type === "warning") bgClass = "bg-warning text-dark";
                else if (type === "info") bgClass = "bg-primary";

                // Remove previous classes and add new one
                toastElement.className = `toast align-items-center text-white ${bgClass} border-0 show`;

                // Show toast
                let toast = new bootstrap.Toast(toastElement);
                toast.show();
            }


        

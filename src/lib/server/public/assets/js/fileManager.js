const contextMenu = document.getElementById("context-menu");
        let selectedPath = "";
        let copiedPath = "";
        const serverId = "#{server.id}"; 
        const currentFolderPath = "#{path}";

        // ✅ Show Context Menu on Right Click
        document.addEventListener("contextmenu", function(event) {
            event.preventDefault();

            // ✅ Check if a file or folder is clicked
            const fileItem = event.target.closest(".file-item");
            selectedPath = fileItem ? fileItem.dataset.path : currentFolderPath;

            console.log("Selected Path:", selectedPath);

            // ✅ Enable/Disable Context Menu Options
            document.getElementById("copy").classList.toggle("disabled", !fileItem);
            document.getElementById("rename").classList.toggle("disabled", !fileItem);
            document.getElementById("delete").classList.toggle("disabled", !fileItem);
            document.getElementById("paste").classList.toggle("disabled", !copiedPath);

            // ✅ Show Context Menu at Mouse Position
            contextMenu.style.top = `${event.pageY}px`;
            contextMenu.style.left = `${event.pageX}px`;
            contextMenu.classList.remove("hidden");
        });

        // ✅ Hide Context Menu when clicking elsewhere
        document.addEventListener("click", () => contextMenu.classList.add("hidden"));

        // ✅ Copy Function
        function copyItem() {
        if (!selectedPath) return alert("No file selected to copy!");
        //- alert(selectedPath)

        fetch("/sftp/copy", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ remotePath: selectedPath })
        })
        .then(res => res.json())
        .then(data => {
            if (data.message) {
                copiedPath = selectedPath;
                console.log("Copied Path:", copiedPath);
                document.getElementById("paste").classList.remove("disabled"); // Enable Paste
                alert("success: " + data.message);
            }
        })
        .catch(err => console.error("❌ Copy API Error:", err));
    }

     function pasteItem() {
        //- if (!copiedPath) return alert("❌ No file copied!");
        let destPath =  "/home/newuser"; // Ensure destination is selected
        //-     alert(currentPath)
        fetch(`/sftp/paste/${serverId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ destinationPath: destPath })
        })
        .then(res => res.json())
        .then(data => {
            if (data.message) {
                console.log("📂 Pasted to:", destPath);
                alert("✅ " + data.message);
            }
        })
        .catch(err => console.error("❌ Paste API Error:", err));
    }

        // ✅ Generic Fetch Function
        function sendRequest(url, bodyData) {
            fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bodyData)
            })
            .then(res => res.json())
            .then(() => location.reload())
            .catch(err => console.error("❌ Request Error:", err));
        }

      //  Rename Function
      function renameItem() {
          if (!selectedPath) return alert("No file selected!");
          const newName = prompt("Enter new name:");
          if (!newName) return;

          const parentPath = selectedPath.substring(0, selectedPath.lastIndexOf("/"));
          const newPath = `${parentPath}/${newName}`;

          sendRequest("/sftp/rename", { serverId, oldPath: selectedPath, newPath });
      }

      //  Delete Function
      function deleteItem() {
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
          .then(() => location.reload())
          .catch(err => console.error("Request Error:", err));
      }

      //  Modal Handling
      document.getElementById("addFolderBtn").addEventListener("click", () => {
          document.getElementById("addFolderModal").classList.add("show");
      });

      document.getElementById("downloadBtn").addEventListener("click", () => {
          document.getElementById("downloadModal").classList.add("show");
      });

      function closeModal(modalId) {
          document.getElementById(modalId).classList.remove("show");
      }
    //download selected files
    function downloadSelectedFiles() {
        alert("dadadsadas");
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
        }).catch(error => {
            alert(error.message);
        });
        }
          $(document).ready(function() {
            $("#addFolderBtn").click(function() {
                $("#addFolderModal").modal("show");
            });

            $("#downloadBtn").click(function() {
                $("#downloadModal").modal("show");
            });
        });

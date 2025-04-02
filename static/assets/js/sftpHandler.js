document.getElementById("addFolderBtn").addEventListener("click", function () {
    let folderName = prompt("Enter folder name:");
    if (!folderName) return alert("Folder name is required!");

    fetch("/create-folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: `/remote/path/${folderName}` }) // Change "/remote/path/" as needed
    })
    .then(response => response.json())
    .then(data => alert(data.message))
    .catch(error => alert("Error creating folder: " + error));
});


//  download button
document.getElementById("downloadBtn").addEventListener("click", function () {
    let filePath = document.getElementById("filePathInput").value;
    if (!filePath) return alert("Enter file path!");

    window.location.href = `/download?path=${encodeURIComponent(filePath)}`;
});

// right click 
let selectedPath = "";
    
$(".file-item").contextmenu(function(event) {
    event.preventDefault();
    selectedPath = $(this).data("path");

    $("#context-menu").css({
        top: event.pageY + "px",
        left: event.pageX + "px"
    }).removeClass("hidden");
});

$(document).click(() => $("#context-menu").addClass("hidden"));
$("#copy").click(() => localStorage.setItem("copyPath", selectedPath));

$("#paste").click(() => {
    let copyPath = localStorage.getItem("copyPath");
    if (!copyPath) return alert("No file copied!");
    
    $.post("/server/copy", { serverId: "#{server._id}", srcPath: copyPath, destPath: selectedPath })
        .done(() => location.reload());
});

$("#rename").click(() => {
    let newName = prompt("Enter new name:");
    if (!newName) return;
    
    let newPath = selectedPath.substring(0, selectedPath.lastIndexOf("/")) + "/" + newName;
    $.post("/server/rename", { serverId: "#{server._id}", oldPath: selectedPath, newPath })
        .done(() => location.reload());
});

$("#delete").click(() => {
    if (!confirm("Are you sure?")) return;
    
    $.post("/server/delete", { serverId: "#{server._id}", filePath: selectedPath })
        .done(() => location.reload());
});
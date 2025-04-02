document.addEventListener("DOMContentLoaded", function () {
    const contextMenu = document.getElementById("context-menu");

    document.addEventListener("contextmenu", function (event) {
        event.preventDefault(); // Prevent the default right-click menu

        const fileItem = event.target.closest(".file-item");
        if (!fileItem) return; // Exit if not right-clicking on a file/folder

        let posX = event.clientX;
        let posY = event.clientY;
        const menuWidth = contextMenu.offsetWidth;
        const menuHeight = contextMenu.offsetHeight;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        let adjustedX = posX + 10;
        let adjustedY = posY + 10;

        if (adjustedX + menuWidth > windowWidth) {
            adjustedX = posX - menuWidth - 10;
        }

        if (adjustedY + menuHeight > windowHeight) {
            adjustedY = posY - menuHeight - 10;
        }

        //  Show menu at calculated position
        contextMenu.style.top = `${adjustedY}px`;
        contextMenu.style.left = `${adjustedX}px`;
        contextMenu.style.display = "block"; // Show menu
    });

    // Hide menu when clicking anywhere outside
    document.addEventListener("click", () => {
        contextMenu.style.display = "none";
    });

    //  Hide menu when clicking a button inside it
    contextMenu.addEventListener("click", function (event) {
        if (event.target.tagName === "BUTTON") {
            contextMenu.style.display = "none"; // Hide menu after button click
        }
    });
});

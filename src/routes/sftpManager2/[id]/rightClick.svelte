<script>

let pos = { x:0, y:0 }

let menu = { h:0, y:0}

let browser = { h:0, y:0 }

let showMenu = false;

let content;


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
}

function onPageClick(e){
    showMenu = false;
}

function getContextMenuDimension(node){
    let height = node.offsetHeight
    let width = node.offsetWidth

    menu = {
        h: height,
        w: width
    }
}
function copyItem(){
    content.textContent = "CopyItem"
}
function pasteItem(){
    content.textContent = "pasteItem"
}

function renameItem(){
    content.textContent = "printed"
}

function deleteItem(){
    content.textContent = "delete"
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

</script>
<svelte:head>

</svelte:head>
<style>
    * {
        padding: 0;
        margin: 0;
    }
    .navbar{
        display: inline-flex;
        border: 1px #999 solid;
        width: 170px;
        background-color: #fff;
        border-radius: 10px;
        overflow: hidden;
        flex-direction: column;
    }
    .navbar ul{
        margin: 6px;
    }
    ul li{
        display: block;
        list-style-type: none;
        width: 1fr;
    }
    ul li button{
        font-size: 1rem;
        color: #222;
        width: 100%;
        height: 30px;
        text-align: left;
        border: 0px;
        background-color: #fff;
    }
    ul li button:hover{
        color: #000;
        text-align: left;
        border-radius: 5px;
        background-color: #eee;
    }
    ul li button i{
        padding: 0px 15px 0px 10px;
    }
    ul li button i.fa-square{
        color: #fff;
    }
    ul li button:hover > i.fa-square{
        color: #eee;
    }
    ul li button:hover > i.warning{
        color: crimson;
    }
    :global(ul li button.info:hover){
        color: navy;
    }
    hr{
        border: none;
        border-bottom: 1px solid #ccc;
        margin: 5px 0px;
    }
</style>
<div class="content" bind:this={content}>Right click somewhere!</div>

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

<svelte:window on:contextmenu|preventDefault={rightClickContextMenu} 
on:click={onPageClick} />
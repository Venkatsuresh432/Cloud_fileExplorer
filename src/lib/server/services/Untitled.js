[
    pradeep,
    kumar,
    sampel.txt,
]


[
    {
        name:sabari,
        type:folder,
        path:/home/pradeep/sabari
        icon:get_icons_for_folder('default')
    },
    {
        name:kumar,
        type:folder
        path:/home/pradeep/kumar
    }
    ,
    {
        name:saple.txt,
        type:file
        path:/home/pradeep/sample.txt,
        ext: get_extension(name)
        icon: get_icons_for_file( get_extension(name))
    }
]


helper.js

check_is_file(){

}

check_is_folder(){

}

get_extension(var file_name){
    
    return filename.split('.')[1];
}


get_icons_for_folder(file_type){

    var folder_icons ={
        default:"imagepath"
    }
    return folder_icons.file_type
    
}


get_icons_for_file(file_ext){

    var file_icon = {
        jpg:
        png:
        js:
        txt:
    }

    return file_icon.file_ext

}

file_manager_icon folder

import { toast } from '@zerodevx/svelte-toast'
import Server from '../routes/servers/+page.svelte'

export function dangerToast(message){
    toast.push(message, { theme: {
        '--toastColor': '#721C24',
        '--toastBackground': '#F8D7DA',
        '--toastBarBackground': '#DC3545'
      },pausable:true})
}

export function warningToast(message){
    toast.push(message, { theme: {
        '--toastColor': '#856404',
        '--toastBackground': '#FFF3CD',
        '--toastBarBackground': '#FFA500'
        },pausable:true}); 
}

export function successToast(message){
    toast.push(message, { theme: {
        '--toastColor': '#155724',
        '--toastBackground': '#DFF6DD',
        '--toastBarBackground': '#28A745'
      }, pausable:true})
}

export function infoToast(message){
    toast.push(message, { theme: {
        '--toastColor': '#0C5460',
        '--toastBackground': '#D1ECF1',
        '--toastBarBackground': '#17A2B8'
      },pausable:true});
}


export function alertToast(){
    toast.push({
        component: {
          src: Server, // Your Svelte component for the toast
          props: {
            title: 'Are you sure?',
            message: 'This action cannot be undone.',
            confirmText: 'Yes',
            cancelText: 'No',
            onConfirm: () => {
              console.log('User confirmed action!');
 
            },
            onCancel: () => {
              console.log('User canceled action!');
            }
          }
        },
        dismissable: false, 
        initial: 0, 
        theme: {
          '--toastPadding': '1rem',
          '--toastMsgPadding': '1rem',
          '--toastBackground': '#FFF3CD', 
          '--toastColor': '#856404', 
          '--toastBorder': '2px solid #FFA500' 
        }
      });
      
}
  

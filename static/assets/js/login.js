
const sendData = async (data)=>{
 try{
   
    await fetch('http://127.0.0.1:8080/api/v1/users/login',{
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        
      },
      body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(data => console.log(data))

 }
 catch(err)
      {
        console.log(err)
      }
}

// Print data to the browser console when the form is submitted
document.querySelector('form').addEventListener('submit', function(event) {
  event.preventDefault();  // Prevent default form submission
  const email = document.querySelector('#yourEmail').value;
  const password = document.querySelector('#yourPassword').value;
  const rememberMe = document.querySelector("#rememberMe").value;

  const data = {email, password}
  // Print the data to the browser console
  console.log("User Data submitted:", { email, password });
  if(rememberMe){
    sendData(data)
    
  }
});
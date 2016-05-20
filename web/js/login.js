/**
 * Created by vikas on 5/20/2016.
 */
function submitForm() {
    var form = document.forms[0];
    if((form.user.value == "demouser1" && form.passwd.value == "passw0rd") || (form.user.value == "demouser2" && form.passwd.value == "passw0rd"))
    {
        if (form.localServer.checked)
        {
            window.location = 'mft-home.html?user=' + form.user.value + '&local=true';/*opens the target page with user value*/
        }
        else
        {
            window.location = 'mft-home.html?user=' + form.user.value + '&local=false';
        }

    } else
    {
        alert("Error: Invalid Password or Username. Please try again.")/*displays error message*/
    }
}

function setUser(user) {
    var form = document.forms[0];
    form.user.value = user;
    form.passwd.value = "passw0rd";
    form.localServer.checked = true;
}
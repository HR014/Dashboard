function login(user, role){
  sessionStorage.setItem("user", user);
  sessionStorage.setItem("role", role);
  window.location = "index.html";
}
function logout(){
  sessionStorage.clear();
  window.location = "login.html";
}
function checkAuth(){
  if(!sessionStorage.getItem("user")){
    window.location = "login.html";
  }
}
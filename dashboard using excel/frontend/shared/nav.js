function buildNav(active){
const pages = [
  {id:"index", name:"Home", link:"index.html"},
  {id:"leads", name:"Leads", link:"leads.html"},
  {id:"projects", name:"Projects", link:"projects.html"},
  {id:"services", name:"Service", link:"services.html"},
  {id:"design", name:"Design", link:"design.html"},
  {id:"accounts", name:"Accounts", link:"accounts.html"}
];
const nav = document.getElementById("mainNav");
nav.innerHTML = pages.map(p=>`
  <a href="${p.link}" style="margin:0 10px;color:${p.id===active?'#3b82f6':'#aaa'};text-decoration:none;">${p.name}</a>
`).join("");
}
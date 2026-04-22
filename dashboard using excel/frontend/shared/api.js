const API = "http://localhost:3000/api";
async function fetchData(endpoint){
  try{
    const res = await fetch(`${API}/${endpoint}`);
    return await res.json();
  }catch(e){
    console.error("API Error:", e);
    return { data: [] };
  }
}
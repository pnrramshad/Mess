let roommates = [];
let expenses = [];
let roomRent = 0;
let users = [];
let githubSha = "";

async function loadData() {
try {
const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE}?ref=${GITHUB_BRANCH}`);
if(res.status === 404) { saveData(); return; }
const data = await res.json();
githubSha = data.sha;
const content = JSON.parse(atob(data.content));
roommates = content.roommates || [];
expenses = content.expenses || [];
roomRent = content.roomRent || 0;
users = content.users || [];
document.getElementById("rentValue").textContent = `Room Rent: ${roomRent} AED`;
renderExpenses(); renderRoommates();
} catch(e){ console.error(e); }
}

async function saveData() {
try{
const body = {
message: "Update data",
content: btoa(JSON.stringify({ roommates, expenses, roomRent, users }, null,2)),
branch: GITHUB_BRANCH
};
if(githubSha) body.sha = githubSha;
const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE}`, {
method:"PUT",
headers:{ Authorization:`token ${GITHUB_TOKEN}`, "Content-Type":"application/json" },
body: JSON.stringify(body)
});
const data = await res.json();
githubSha = data.content.sha;
} catch(e){ console.error(e); }
}

// LOGIN
document.getElementById("loginBtn").addEventListener("click",()=>{
const username = document.getElementById("username").value.trim();
const password = document.getElementById("password").value.trim();
const user = users.find(u=>u.username===username && u.password===password);
if(user){ document.getElementById("loginPage").style.display="none"; document.getElementById("mainPage").style.display="block"; }
else document.getElementById("loginMsg").textContent="❌ Wrong username or password!";
});

// ADD EXPENSE
document.getElementById("addEntryBtn").addEventListener("click",()=>{
const modal = document.getElementById("entryModal"); modal.style.display="flex";
const nameSelect = document.getElementById("entryName"); nameSelect.innerHTML='';
roommates.forEach(r=>nameSelect.innerHTML+=`<option value="${r}">${r}</option>`);
document.getElementById("entryDate").value = new Date().toISOString().split('T')[0];
});
document.getElementById("saveEntryBtn").addEventListener("click",()=>{
const name=document.getElementById("entryName").value;
const date=document.getElementById("entryDate").value;
const type=document.getElementById("entryType").value;
const amount=parseFloat(document.getElementById("entryAmount").value);
if(!name || !date || !type || isNaN(amount)) return alert("Fill all fields!");
expenses.push({name,date,type,amount});
renderExpenses(); saveData(); closeEntryModal();
});
function renderExpenses(){
const tbody=document.getElementById("expenseBody"); tbody.innerHTML='';
expenses.forEach(e=>{
const tr=document.createElement("tr");
tr.innerHTML=`<td>${e.name}</td><td>${e.date}</td><td>${e.type}</td><td>${e.amount.toFixed(2)}</td>`;
tbody.appendChild(tr);
});
}
function closeEntryModal(){document.getElementById("entryModal").style.display="none";}

// ROOMMATES
document.getElementById("usersBtn").addEventListener("click",()=>{document.getElementById("userModal").style.display="flex";});
document.getElementById("addRoommateBtn").addEventListener("click",()=>{
const name=document.getElementById("newRoommate").value.trim();
if(!name) return alert("Enter name");
roommates.push(name);
const userId=generateUserId(name);
users.push({username:userId,password:"12345",role:"user"});
alert(`Roommate added!\nUserID:${userId}\nPassword:12345`);
document.getElementById("newRoommate").value='';
renderRoommates(); saveData();
});
function renderRoommates(){
const div=document.getElementById("roommateList"); div.innerHTML='';
roommates.forEach(r=>{ const d=document.createElement("div"); d.textContent=r; div.appendChild(d); });
}
function closeUserModal(){document.getElementById("userModal").style.display="none";}

// RENT
document.getElementById("setRentBtn").addEventListener("click",()=>{document.getElementById("rentModal").style.display="flex";});
document.getElementById("saveRentBtn").addEventListener("click",()=>{
const rent=parseFloat(document.getElementById("rentInput").value);
if(!isNaN(rent)){ roomRent=rent; document.getElementById("rentValue").textContent=`Room Rent: ${roomRent} AED`; saveData(); closeRentModal();}
else alert("Enter valid number");
});
function closeRentModal(){document.getElementById("rentModal").style.display="none";}

// UTILITY
function generateUserId(name){ return name.trim().slice(0,3).toLowerCase()+Date.now().toString(36); }

// INIT
loadData();

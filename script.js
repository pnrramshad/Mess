

// ---------- VARIABLES ----------
let roommates = [];
let roomRent = 0;
let expenses = [];
let githubSha = ""; // To track file version

// ---------- GITHUB FUNCTIONS ----------
async function loadData() {
try {
const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE}?ref=${GITHUB_BRANCH}`);
if (res.status === 404) {
// File not exist, initialize empty
roommates = [];
expenses = [];
roomRent = 0;
githubSha = "";
saveData();
return;
}
const data = await res.json();
githubSha = data.sha;
const content = JSON.parse(atob(data.content));
roommates = content.roommates || [];
expenses = content.expenses || [];
roomRent = content.roomRent || 0;
document.getElementById("rentValue").textContent = `Room Rent: ${roomRent} AED`;
renderExpenses();
} catch (e) {
console.error("Load Error:", e);
}
}

async function saveData() {
try {
const body = {
message: "Update data",
content: btoa(JSON.stringify({ roommates, expenses, roomRent }, null, 2)),
branch: GITHUB_BRANCH
};
if (githubSha) body.sha = githubSha;
const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_FILE}`, {
method: "PUT",
headers: {
Authorization: `token ${GITHUB_TOKEN}`,
"Content-Type": "application/json"
},
body: JSON.stringify(body)
});
const data = await res.json();
githubSha = data.content.sha;
} catch (e) {
console.error("Save Error:", e);
}
}

// ---------- LOGIN ----------
document.getElementById("loginBtn").addEventListener("click", () => {
const user = document.getElementById("username").value.trim();
const pass = document.getElementById("password").value.trim();
if (user === "admin" && pass === "ramshad") {
document.getElementById("loginPage").style.display = "none";
document.getElementById("mainPage").style.display = "block";
loadData();
} else {
document.getElementById("loginMsg").textContent = "❌ Wrong username or password!";
}
});

// ---------- ADD ENTRY ----------
document.getElementById("addEntryBtn").addEventListener("click", openEntryModal);
function openEntryModal() {
document.getElementById("entryModal").style.display = "flex";
const nameSelect = document.getElementById("entryName");
nameSelect.innerHTML = '<option value="">Select Name</option>';
roommates.forEach(r => nameSelect.innerHTML += `<option value="${r}">${r}</option>`);
document.getElementById("entryDate").value = new Date().toISOString().split('T')[0];
document.getElementById("entryType").value = "";
document.getElementById("entryAmount").value = "";
}
function closeEntryModal() { document.getElementById("entryModal").style.display = "none"; }

document.getElementById("saveEntryBtn").addEventListener("click", () => {
const name = document.getElementById("entryName").value;
const date = document.getElementById("entryDate").value;
const type = document.getElementById("entryType").value;
const amount = parseFloat(document.getElementById("entryAmount").value);
if (!name || !date || !type || isNaN(amount)) {
alert("Please fill all fields!");
return;
}
expenses.push({ name, date, type, amount });
renderExpenses();
saveData(); // Save to GitHub
closeEntryModal();
});

// ---------- RENDER EXPENSES ----------
function renderExpenses() {
const tbody = document.getElementById("expenseBody");
tbody.innerHTML = "";
expenses.forEach(e => {
const tr = document.createElement("tr");
tr.innerHTML = `<td>${e.name}</td><td>${e.date}</td><td>${e.type}</td><td>${e.amount.toFixed(2)}</td>`;
tbody.appendChild(tr);
});
}

// ---------- USERS MANAGEMENT ----------
document.getElementById("usersBtn").addEventListener("click", () => {
document.getElementById("userModal").style.display = "flex";
document.getElementById("roommatesDiv").style.display = "none";
document.getElementById("userAdminName").value = "";
document.getElementById("userAdminPass").value = "";
document.getElementById("userLoginMsg").textContent = "";
});
function closeUserModal() { document.getElementById("userModal").style.display = "none"; }

document.getElementById("userLoginBtn").addEventListener("click", () => {
const user = document.getElementById("userAdminName").value.trim();
const pass = document.getElementById("userAdminPass").value.trim();
if (user === "admin" && pass === "ramshad") {
document.getElementById("userLoginMsg").textContent = "";
document.getElementById("roommatesDiv").style.display = "block";
loadRoommates();
} else {
document.getElementById("userLoginMsg").textContent = "❌ Wrong credentials!";
}
});

function loadRoommates() {
const listDiv = document.getElementById("roommateList");
listDiv.innerHTML = "";
roommates.forEach((r, i) => {
const div = document.createElement("div");
div.className = "member-item";
div.innerHTML = `<span contenteditable="true">${r}</span>
<button onclick="deleteRoommate(${i})">Delete</button>`;
listDiv.appendChild(div);
});
}

document.getElementById("addRoommateBtn").addEventListener("click", () => {
const newName = document.getElementById("newRoommate").value.trim();
if (newName) {
roommates.push(newName);
document.getElementById("newRoommate").value = "";
loadRoommates();
saveData();
}
});

function deleteRoommate(index) {
roommates.splice(index, 1);
loadRoommates();
saveData();
}

document.getElementById("saveRoommatesBtn").addEventListener("click", () => {
const spans = document.querySelectorAll("#roommateList .member-item span");
roommates = [];
spans.forEach(s => { if (s.textContent.trim() !== "") roommates.push(s.textContent.trim()); });
alert("Roommates saved successfully!");
saveData();
});

// ---------- RENT ----------
document.getElementById("setRentBtn").addEventListener("click", openRentModal);
function openRentModal() {
document.getElementById("rentModal").style.display = "flex";
document.getElementById("rentInput").value = roomRent || "";
}
function closeRentModal() { document.getElementById("rentModal").style.display = "none"; }
document.getElementById("saveRentBtn").addEventListener("click", () => {
const rent = parseFloat(document.getElementById("rentInput").value);
if (!isNaN(rent)) {
roomRent = rent;
document.getElementById("rentValue").textContent = `Room Rent: ${roomRent} AED`;
closeRentModal();
alert("Room rent saved!");
saveData();
} else alert("Enter a valid number!");
});

// ---------- REPORT ----------
document.getElementById("reportBtn").addEventListener("click", showCalculations);
function showCalculations() {
document.getElementById("trackSection").style.display = "none";
document.getElementById("calcSection").style.display = "block";

const totals = {};
roommates.forEach(r => totals[r] = 0);
expenses.forEach(e => { if (totals[e.name] !== undefined) totals[e.name] += e.amount; });

const totalExpenses = Object.values(totals).reduce((a, b) => a + b, 0);
const expenseShare = totalExpenses / roommates.length;
const rentShare = roomRent / roommates.length;

const tbody = document.getElementById("calcTableBody");
tbody.innerHTML = "";
const tfoot = document.getElementById("calcTableFoot");
tfoot.innerHTML = "";

roommates.forEach(r => {
const toPay = (rentShare + expenseShare - totals[r]).toFixed(2);
const tr = document.createElement("tr");
tr.innerHTML = `<td>${r}</td><td>${totals[r].toFixed(2)}</td><td>${expenseShare.toFixed(2)}</td><td>${rentShare.toFixed(2)}</td>
<td style="font-weight:bold;color:${toPay > 0 ? '#d9534f' : '#28a745'};">${toPay}</td>`;
tbody.appendChild(tr);
});

tfoot.innerHTML = `<tr><td colspan="2">Total Expenses</td><td colspan="3">${totalExpenses.toFixed(2)} AED</td></tr>`;
}

// ---------- INIT ----------
loadData();

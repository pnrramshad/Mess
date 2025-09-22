# Mess
Mess calculation
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Room Expense Tracker</title>
<style>
body { font-family: Arial; background: #f0f8ff; padding: 20px; }
.container { max-width: 700px; margin: auto; background: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 0 15px rgba(0,0,0,0.2); }
h2, h3 { text-align: center; }
table { width: 100%; border-collapse: collapse; margin: 10px 0; }
th, td { border: 1px solid #aaa; padding: 6px; text-align: center; }
th { background-color: #007bff; color: #fff; }
input, select, button { padding: 5px; margin: 2px; border-radius: 5px; }
button { cursor: pointer; background-color: #28a745; color: #fff; border: none; }
button:hover { background-color: #218838; }
</style>
</head>
<body>
<div class="container">
<h2>Room Expense Tracker</h2>
<label>Total Room Rent (AED):</label>
<input type="number" id="rent" placeholder="Enter total rent">

<h3>Expenses Table</h3>
<table id="expenseTable">
<thead>
<tr>
<th>Person</th><th>Amount (AED)</th>
</tr>
</thead>
<tbody></tbody>
</table>
<button onclick="addExpenseRow()">Add Row</button>

<button onclick="calculate()">Calculate Payments</button>

<h3>Payment Summary</h3>
<table id="resultTable">
<thead>
<tr>
<th>Person</th><th>Total Paid</th><th>Share of Total Expenses</th><th>Rent Share</th><th>Amount to Pay</th>
</tr>
</thead>
<tbody></tbody>
</table>
</div>

<script>
const people = ["RAMSHAD","ASHIR","ZAKKI","ASEEF","KUTTAPI"];

// Add a new row to the expense table
function addExpenseRow() {
    const tbody = document.querySelector("#expenseTable tbody");
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>
            <select class="person-select">
                ${people.map(p => `<option value="${p}">${p}</option>`).join('')}
            </select>
        </td>
        <td><input type="number" class="amount" placeholder="0"></td>
    `;
    tbody.appendChild(row);
}

// Calculate payments
function calculate() {
    const rent = parseFloat(document.getElementById('rent').value);
    if(!rent){ alert("Enter total rent!"); return; }

    const totals = {};
    people.forEach(p => totals[p]=0);

    // Sum expenses per person
    document.querySelectorAll("#expenseTable tbody tr").forEach(row=>{
        const person = row.querySelector(".person-select").value;
        const amount = parseFloat(row.querySelector(".amount").value) || 0;
        totals[person] += amount;
    });

    // Total expenses and rent
    const totalExpenses = Object.values(totals).reduce((sum,v)=>sum+v,0);
    const expenseShare = totalExpenses / people.length;
    const rentShare = rent / people.length;

    // Display results
    const tbody = document.querySelector("#resultTable tbody");
    tbody.innerHTML = "";
    people.forEach(p=>{
        const amountToPay = rentShare + expenseShare - totals[p];
        const row = `<tr>
            <td>${p}</td>
            <td>${totals[p].toFixed(2)}</td>
            <td>${expenseShare.toFixed(2)}</td>
            <td>${rentShare.toFixed(2)}</td>
            <td>${amountToPay.toFixed(2)}</td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

// Initialize one row per person
people.forEach(_ => addExpenseRow());
</script>
</body>
</html>

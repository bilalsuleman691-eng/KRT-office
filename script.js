// ============================================ //
// ============== DATA STORE ================== //
// ============================================ //
let stockData = JSON.parse(localStorage.getItem('stockData')) || [];
let accountData = JSON.parse(localStorage.getItem('accountData')) || [];
let rentData = JSON.parse(localStorage.getItem('rentData')) || [];
let settings = JSON.parse(localStorage.getItem('settings')) || { company: 'My Office', currency: 'Rs.' };

// ============================================ //
// ============== LOGIN LOGIC ================= //
// ============================================ //
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const user = document.getElementById('username').value;
            const pass = document.getElementById('password').value;
            if (user === 'admin' && pass === 'admin123') {
                document.getElementById('loginPage').style.display = 'none';
                document.getElementById('dashboardPage').style.display = 'block';
                loadDashboard();
                loadTodayEntries();
                loadBalance();
                loadAccountBook();
                loadRentBook();
                loadSettings();
                setupSidebarNavigation();
                setupStockForms();
                setupLogout();
            } else {
                alert('❌ Invalid credentials! Use admin / admin123');
            }
        });
    }
});

// ============================================ //
// ============== SIDEBAR NAVIGATION ========== //
// ============================================ //
function setupSidebarNavigation() {
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelectorAll('.sidebar-nav a').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            const page = this.dataset.page;
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            document.getElementById('page-' + page).classList.add('active');
            if (page === 'dashboard') loadDashboard();
            if (page === 'balance') loadBalance();
            if (page === 'account-book') loadAccountBook();
            if (page === 'rent-book') loadRentBook();
        });
    });
}

// ============================================ //
// ============== NAVIGATE FUNCTION =========== //
// ============================================ //
function navigateTo(page) {
    document.querySelectorAll('.sidebar-nav a').forEach(l => l.classList.remove('active'));
    document.querySelector(`.sidebar-nav a[data-page="${page}"]`).classList.add('active');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');
    if (page === 'dashboard') loadDashboard();
    if (page === 'balance') loadBalance();
    if (page === 'account-book') loadAccountBook();
    if (page === 'rent-book') loadRentBook();
}

// ============================================ //
// ============== STOCK FORMS ================= //
// ============================================ //
function setupStockForms() {
    // Stock In Form
    const inForm = document.getElementById('stockInForm');
    if (inForm) {
        inForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const item = document.getElementById('inItem').value.trim();
            const qty = parseInt(document.getElementById('inQty').value);
            const rate = parseInt(document.getElementById('inRate').value) || 0;
            const person = document.getElementById('inPerson').value.trim() || 'Supplier';
            if (!item || !qty) { alert('Please fill all required fields!'); return; }
            const entry = {
                id: Date.now(),
                type: 'in',
                item, qty, rate, person,
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString(),
                timestamp: Date.now()
            };
            stockData.push(entry);
            localStorage.setItem('stockData', JSON.stringify(stockData));
            alert('✅ Stock In Added!');
            this.reset();
            loadTodayEntries();
            loadDashboard();
            loadBalance();
        });
    }

    // Stock Out Form
    const outForm = document.getElementById('stockOutForm');
    if (outForm) {
        outForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const item = document.getElementById('outItem').value.trim();
            const qty = parseInt(document.getElementById('outQty').value);
            const rate = parseInt(document.getElementById('outRate').value) || 0;
            const person = document.getElementById('outPerson').value.trim() || 'Customer';
            if (!item || !qty) { alert('Please fill all required fields!'); return; }
            const balance = getItemBalance(item);
            if (qty > balance) {
                alert('❌ Insufficient Stock! Available: ' + balance);
                return;
            }
            const entry = {
                id: Date.now(),
                type: 'out',
                item, qty, rate, person,
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString(),
                timestamp: Date.now()
            };
            stockData.push(entry);
            localStorage.setItem('stockData', JSON.stringify(stockData));
            alert('✅ Stock Out Added!');
            this.reset();
            loadTodayEntries();
            loadDashboard();
            loadBalance();
        });
    }
}

// ============================================ //
// ============== LOGOUT ====================== //
// ============================================ //
function setupLogout() {
    document.getElementById('logoutBtn').addEventListener('click', function() {
        if (confirm('Are you sure you want to logout?')) {
            document.getElementById('dashboardPage').style.display = 'none';
            document.getElementById('loginPage').style.display = 'flex';
            document.getElementById('loginForm').reset();
        }
    });
}

// ============================================ //
// ============== HELPER FUNCTIONS ============ //
// ============================================ //
function getItemBalance(item) {
    const ins = stockData.filter(e => e.type === 'in' && e.item.toLowerCase() === item.toLowerCase());
    const outs = stockData.filter(e => e.type === 'out' && e.item.toLowerCase() === item.toLowerCase());
    const totalIn = ins.reduce((sum, e) => sum + e.qty, 0);
    const totalOut = outs.reduce((sum, e) => sum + e.qty, 0);
    return totalIn - totalOut;
}

function getAllItems() {
    const items = {};
    stockData.forEach(e => {
        if (!items[e.item]) items[e.item] = { in: 0, out: 0 };
        if (e.type === 'in') items[e.item].in += e.qty;
        else items[e.item].out += e.qty;
    });
    return items;
}

// ============================================ //
// ============== DASHBOARD =================== //
// ============================================ //
function loadDashboard() {
    const items = getAllItems();
    let totalIn = 0, totalOut = 0;
    Object.values(items).forEach(v => { totalIn += v.in; totalOut += v.out; });
    document.getElementById('totalIn').textContent = totalIn;
    document.getElementById('totalOut').textContent = totalOut;
    document.getElementById('totalBalance').textContent = totalIn - totalOut;
}

// ============================================ //
// ============== TODAY ENTRIES =============== //
// ============================================ //
function loadTodayEntries() {
    const today = new Date().toLocaleDateString();
    const todayEntries = stockData.filter(e => e.date === today);
    const inBody = document.getElementById('inTableBody');
    const outBody = document.getElementById('outTableBody');
    inBody.innerHTML = '';
    outBody.innerHTML = '';
    todayEntries.forEach(e => {
        const row = `<tr><td>${e.item}</td><td>${e.qty}</td><td>${e.rate}</td><td>${e.person}</td><td>${e.time}</td></tr>`;
        if (e.type === 'in') inBody.innerHTML += row;
        else outBody.innerHTML += row;
    });
}

// ============================================ //
// ============== BALANCE ===================== //
// ============================================ //
function loadBalance() {
    const items = getAllItems();
    const body = document.getElementById('balanceTableBody');
    body.innerHTML = '';
    Object.entries(items).forEach(([item, data]) => {
        body.innerHTML += `<tr><td>${item}</td><td>${data.in}</td><td>${data.out}</td><td>${data.in - data.out}</td></tr>`;
    });
}

function searchBalance() {
    const search = document.getElementById('balanceSearch').value.toLowerCase();
    const items = getAllItems();
    const body = document.getElementById('balanceTableBody');
    body.innerHTML = '';
    Object.entries(items).forEach(([item, data]) => {
        if (item.toLowerCase().includes(search)) {
            body.innerHTML += `<tr><td>${item}</td><td>${data.in}</td><td>${data.out}</td><td>${data.in - data.out}</td></tr>`;
        }
    });
}

function printBalance() {
    window.print();
}

// ============================================ //
// ============== DAILY REPORT ================ //
// ============================================ //
function generateReport() {
    const from = document.getElementById('reportFrom').value;
    const to = document.getElementById('reportTo').value;
    const person = document.getElementById('reportPerson').value.toLowerCase();
    const result = document.getElementById('reportResult');
    let filtered = stockData;
    if (from) {
        const fromDate = new Date(from);
        filtered = filtered.filter(e => {
            const d = new Date(e.date);
            return d >= fromDate;
        });
    }
    if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59);
        filtered = filtered.filter(e => {
            const d = new Date(e.date);
            return d <= toDate;
        });
    }
    if (person) {
        filtered = filtered.filter(e => e.person.toLowerCase().includes(person));
    }
    if (filtered.length === 0) {
        result.innerHTML = '<p style="text-align:center;padding:30px;color:#636e72;">No records found</p>';
        return;
    }
    let html = '<table><thead><tr><th>Type</th><th>Item</th><th>Qty</th><th>Rate</th><th>Person</th><th>Date</th><th>Time</th></tr></thead><tbody>';
    filtered.forEach(e => {
        html += `<tr><td>${e.type.toUpperCase()}</td><td>${e.item}</td><td>${e.qty}</td><td>${e.rate}</td><td>${e.person}</td><td>${e.date}</td><td>${e.time}</td></tr>`;
    });
    html += '</tbody></table>';
    result.innerHTML = html;
}

function printReport() {
    window.print();
}

// ============================================ //
// ============== SEARCH HISTORY ============== //
// ============================================ //
function searchHistory() {
    const from = document.getElementById('historyFrom').value;
    const to = document.getElementById('historyTo').value;
    const search = document.getElementById('historySearch').value.toLowerCase();
    const result = document.getElementById('historyResult');
    let filtered = stockData;
    if (from) {
        const fromDate = new Date(from);
        filtered = filtered.filter(e => {
            const d = new Date(e.date);
            return d >= fromDate;
        });
    }
    if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59);
        filtered = filtered.filter(e => {
            const d = new Date(e.date);
            return d <= toDate;
        });
    }
    if (search) {
        filtered = filtered.filter(e => 
            e.item.toLowerCase().includes(search) || 
            e.person.toLowerCase().includes(search)
        );
    }
    if (filtered.length === 0) {
        result.innerHTML = '<p style="text-align:center;padding:30px;color:#636e72;">No records found</p>';
        return;
    }
    let html = '<table><thead><tr><th>Type</th><th>Item</th><th>Qty</th><th>Rate</th><th>Person</th><th>Date</th><th>Time</th></tr></thead><tbody>';
    filtered.forEach(e => {
        html += `<tr><td>${e.type.toUpperCase()}</td><td>${e.item}</td><td>${e.qty}</td><td>${e.rate}</td><td>${e.person}</td><td>${e.date}</td><td>${e.time}</td></tr>`;
    });
    html += '</tbody></table>';
    result.innerHTML = html;
}

function printHistory() {
    window.print();
}

// ============================================ //
// ============== ACCOUNT BOOK ================ //
// ============================================ //
function calcAccountAmount() {
    const qty = parseInt(document.getElementById('accQty').value) || 0;
    const rate = parseInt(document.getElementById('accRate').value) || 0;
    document.getElementById('accAmount').value = qty * rate;
}

function addAccountEntry() {
    const person = document.getElementById('accPerson').value.trim();
    const item = document.getElementById('accItem').value.trim() || 'N/A';
    const qty = parseInt(document.getElementById('accQty').value) || 0;
    const rate = parseInt(document.getElementById('accRate').value) || 0;
    const amount = parseInt(document.getElementById('accAmount').value) || 0;
    if (!person) { alert('Please enter person name!'); return; }
    const entry = {
        id: Date.now(),
        person, item, qty, rate, amount,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString()
    };
    accountData.push(entry);
    localStorage.setItem('accountData', JSON.stringify(accountData));
    alert('✅ Account Entry Added!');
    document.getElementById('accPerson').value = '';
    document.getElementById('accItem').value = '';
    document.getElementById('accQty').value = '';
    document.getElementById('accRate').value = '';
    document.getElementById('accAmount').value = '';
    loadAccountBook();
}

function loadAccountBook() {
    const body = document.getElementById('accountTableBody');
    body.innerHTML = '';
    accountData.forEach(e => {
        body.innerHTML += `
            <tr>
                <td>${e.person}</td>
                <td>${e.item}</td>
                <td>${e.qty}</td>
                <td>${e.rate}</td>
                <td>${e.amount}</td>
                <td>${e.date}</td>
                <td>
                    <button class="btn-danger" style="padding:5px 12px;font-size:12px;" onclick="deleteAccountEntry(${e.id})">Delete</button>
                </td>
            </tr>
        `;
    });
}

function deleteAccountEntry(id) {
    if (confirm('Delete this entry?')) {
        accountData = accountData.filter(e => e.id !== id);
        localStorage.setItem('accountData', JSON.stringify(accountData));
        loadAccountBook();
    }
}

// ============================================ //
// ============== RENT BOOK =================== //
// ============================================ //
function addRentEntry() {
    const person = document.getElementById('rentPerson').value.trim();
    const month = document.getElementById('rentMonth').value;
    const amount = parseInt(document.getElementById('rentAmount').value) || 0;
    if (!person) { alert('Please enter tenant name!'); return; }
    const entry = {
        id: Date.now(),
        person, month, amount,
        status: amount > 0 ? 'Paid' : 'Pending',
        date: new Date().toLocaleDateString()
    };
    rentData.push(entry);
    localStorage.setItem('rentData', JSON.stringify(rentData));
    alert('✅ Rent Entry Added!');
    document.getElementById('rentPerson').value = '';
    document.getElementById('rentMonth').value = '';
    document.getElementById('rentAmount').value = '';
    loadRentBook();
}

function loadRentBook() {
    const body = document.getElementById('rentTableBody');
    body.innerHTML = '';
    rentData.forEach(e => {
        const statusColor = e.status === 'Paid' ? 'green' : 'red';
        body.innerHTML += `
            <tr>
                <td>${e.person}</td>
                <td>${e.month || 'N/A'}</td>
                <td>${e.amount}</td>
                <td style="color:${statusColor};font-weight:700;">${e.status}</td>
                <td>${e.date}</td>
                <td>
                    <button class="btn-danger" style="padding:5px 12px;font-size:12px;" onclick="deleteRentEntry(${e.id})">Delete</button>
                </td>
            </tr>
        `;
    });
}

function deleteRentEntry(id) {
    if (confirm('Delete this rent entry?')) {
        rentData = rentData.filter(e => e.id !== id);
        localStorage.setItem('rentData', JSON.stringify(rentData));
        loadRentBook();
    }
}

// ============================================ //
// ============== SETTINGS ==================== //
// ============================================ //
function loadSettings() {
    document.getElementById('companyName').value = settings.company || '';
    document.getElementById('currency').value = settings.currency || 'Rs.';
}

function saveSettings() {
    settings.company = document.getElementById('companyName').value.trim();
    settings.currency = document.getElementById('currency').value.trim();
    localStorage.setItem('settings', JSON.stringify(settings));
    alert('✅ Settings Saved!');
}

function clearAllData() {
    if (confirm('⚠️ Are you sure? This will delete ALL data permanently!')) {
        if (confirm('Final confirmation: Delete everything?')) {
            stockData = [];
            accountData = [];
            rentData = [];
            localStorage.removeItem('stockData');
            localStorage.removeItem('accountData');
            localStorage.removeItem('rentData');
            alert('🗑️ All data cleared!');
            loadDashboard();
            loadTodayEntries();
            loadBalance();
            loadAccountBook();
            loadRentBook();
        }
    }
}

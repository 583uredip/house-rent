// ==========================================
// 1. Data Constants & Configuration
// ==========================================
const ROOMS = [
    { id: 'master', name: 'Master Bedroom', members: 'Sikto & Bikash', baseRent: 3875 },
    { id: 'semi', name: 'Semi-Master Bedroom', members: 'Sajol & Redip', baseRent: 3375 },
    { id: 'bed', name: 'Bedroom', members: 'Shanto & Soham', baseRent: 3250 },
    { id: 'dining', name: 'Dining Room', members: 'Prosanto', baseRent: 2000 }
];

const FIXED_BILLS = {
    khala: 800,
    wifi: 150
};

const ADMIN_CRED = {
    user: 'sikto',
    pass: 'gusi1234'
};

// ==========================================
// 2. Theme Management
// ==========================================
function toggleTheme() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    document.getElementById('theme-btn').innerText = newTheme === 'dark' ? '☀️' : '🌙';
}

(function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    const body = document.body;
    // Safety check if body exists (in case script runs in head)
    if (body) {
        body.setAttribute('data-theme', savedTheme);
        const themeBtn = document.getElementById('theme-btn');
        if (themeBtn) {
            themeBtn.innerText = savedTheme === 'dark' ? '☀️' : '🌙';
        }
    }
})();

// ==========================================
// 3. Initialization & Sample Data
// ==========================================
function initSampleData() {
    const existingHistory = localStorage.getItem('rent_history_list');

    if (!existingHistory) {
        console.log("No data found. Initializing sample data...");

        // Sample Data for a previous month
        const sampleMonth = "2024-01";
        const sampleTotalRent = 32000;
        const serviceCharge = (sampleTotalRent - 25000) / 7;

        const sampleData = {
            month: sampleMonth,
            totalRent: sampleTotalRent,
            serviceCharge: serviceCharge,
            driveLink: "https://docs.google.com/spreadsheets/u/0/",
            rooms: ROOMS.map(room => ({
                id: room.id,
                name: room.name,
                members: room.members,
                baseParams: {
                    base: room.baseRent,
                    khala: FIXED_BILLS.khala,
                    wifi: FIXED_BILLS.wifi,
                    service: serviceCharge
                },
                totalPerPerson: room.baseRent + FIXED_BILLS.khala + FIXED_BILLS.wifi + serviceCharge
            }))
        };

        localStorage.setItem(`rent_data_${sampleMonth}`, JSON.stringify(sampleData));
        localStorage.setItem('rent_history_list', JSON.stringify([sampleMonth]));
        localStorage.setItem('latest_month', sampleMonth);
    }
}

// ==========================================
// 4. Admin Functions
// ==========================================
function adminLogin() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const errorMsg = document.getElementById('login-error');

    if (user === ADMIN_CRED.user && pass === ADMIN_CRED.pass) {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('admin-dashboard').classList.remove('hidden');

        // IMPORTANT: Load data immediately after login
        loadHistoryDropdown();
        loadLatestData();
    } else {
        errorMsg.innerText = "Invalid credentials!";
    }
}

function logout() {
    location.reload();
}

function calculateAndSave() {
    const month = document.getElementById('rent-month').value;
    const totalRentInput = parseFloat(document.getElementById('total-flat-rent').value);
    const driveLink = document.getElementById('drive-link').value;

    if (!month || !totalRentInput) {
        alert("Please select a month and enter total rent.");
        return;
    }

    // Formula: (Total Rent - 25000) / 7 members
    const serviceCharge = (totalRentInput - 25000) / 7;

    const summaryTable = document.getElementById('summary-body');
    summaryTable.innerHTML = '';

    const monthlyData = {
        month: month,
        totalRent: totalRentInput,
        serviceCharge: serviceCharge,
        driveLink: driveLink,
        rooms: []
    };

    ROOMS.forEach(room => {
        const finalPerPerson = room.baseRent + FIXED_BILLS.khala + FIXED_BILLS.wifi + serviceCharge;

        monthlyData.rooms.push({
            id: room.id,
            name: room.name,
            members: room.members,
            baseParams: {
                base: room.baseRent,
                khala: FIXED_BILLS.khala,
                wifi: FIXED_BILLS.wifi,
                service: serviceCharge
            },
            totalPerPerson: finalPerPerson
        });

        // Add to live table view
        const row = `<tr>
            <td>${room.name}</td>
            <td>${room.members}</td>
            <td>${room.baseRent}</td>
            <td>${serviceCharge.toFixed(2)}</td>
            <td>${FIXED_BILLS.wifi}</td>
            <td>${FIXED_BILLS.khala}</td>
            <td><strong>${Math.round(finalPerPerson)}</strong> /person</td>
        </tr>`;
        summaryTable.innerHTML += row;
    });

    // Save Data
    localStorage.setItem(`rent_data_${month}`, JSON.stringify(monthlyData));
    localStorage.setItem('latest_month', month);

    // Update History List
    let history = JSON.parse(localStorage.getItem('rent_history_list')) || [];
    if (!history.includes(month)) {
        history.push(month);
        history.sort().reverse(); // Newest first
        localStorage.setItem('rent_history_list', JSON.stringify(history));
    }

    // UI Updates
    document.getElementById('result-section').classList.remove('hidden');
    loadHistoryDropdown(); // Refresh dropdown
    alert("Calculation Saved Successfully!");
}

function deleteHistory() {
    const historySelect = document.getElementById('history-select');
    const selectedMonth = historySelect.value;

    if (!selectedMonth) {
        alert("Please select a month to delete.");
        return;
    }

    if (confirm(`Are you sure you want to delete rent data for ${selectedMonth}?`)) {
        // 1. Remove data key
        localStorage.removeItem(`rent_data_${selectedMonth}`);

        // 2. Update list
        let history = JSON.parse(localStorage.getItem('rent_history_list')) || [];
        history = history.filter(m => m !== selectedMonth);
        localStorage.setItem('rent_history_list', JSON.stringify(history));

        // 3. Update 'latest_month' pointer if needed
        const currentLatest = localStorage.getItem('latest_month');
        if (currentLatest === selectedMonth) {
            // Fallback to the first available month, or remove if none
            const nextLatest = history.length > 0 ? history[0] : '';
            if (nextLatest) {
                localStorage.setItem('latest_month', nextLatest);
            } else {
                localStorage.removeItem('latest_month');
            }
        }

        alert("Deleted successfully.");

        // 4. Refresh internal state
        historySelect.value = ""; // Clear selection
        loadHistoryDropdown();    // Re-render dropdown

        // 5. Refresh view
        // If we have data left, load the new 'latest'; otherwise clear the dashboard view
        const newLatest = localStorage.getItem('latest_month');
        if (newLatest) {
            loadMonthData(newLatest);
        } else {
            // Clear the view if no data exists
            const summaryTable = document.getElementById('summary-body');
            if (summaryTable) summaryTable.innerHTML = '';
            document.getElementById('result-section').classList.add('hidden');
        }
    }
}

// ==========================================
// 5. Data Loading & UI Population
// ==========================================
function loadHistoryDropdown() {
    const historySelect = document.getElementById('history-select');
    if (!historySelect) return;

    const history = JSON.parse(localStorage.getItem('rent_history_list')) || [];

    // Clear and rebuild options
    historySelect.innerHTML = '<option value="" disabled selected>Select Month</option>';

    if (history.length === 0) {
        const option = document.createElement('option');
        option.text = "No history available";
        option.disabled = true;
        historySelect.appendChild(option);
    } else {
        history.forEach(month => {
            const option = document.createElement('option');
            option.value = month;
            option.innerText = month;
            historySelect.appendChild(option);
        });
    }

    // Bind Delete Button Logic
    const deleteBtn = document.getElementById('delete-btn');
    if (deleteBtn) {
        deleteBtn.onclick = deleteHistory;
    }

    // Bind Change Event
    historySelect.onchange = function () {
        if (this.value) loadMonthData(this.value);
    };
}

function loadMonthData(month) {
    const data = JSON.parse(localStorage.getItem(`rent_data_${month}`));
    if (!data) return;

    // A. Admin View Update
    if (document.getElementById('total-flat-rent')) {
        document.getElementById('rent-month').value = data.month;
        document.getElementById('total-flat-rent').value = data.totalRent;
        if (data.driveLink) document.getElementById('drive-link').value = data.driveLink;

        const summaryTable = document.getElementById('summary-body');
        if (summaryTable) {
            summaryTable.innerHTML = '';
            data.rooms.forEach(room => {
                const row = `<tr>
                    <td>${room.name}</td>
                    <td>${room.members}</td>
                    <td>${room.baseParams.base}</td>
                    <td>${room.baseParams.service.toFixed(2)}</td>
                    <td>${room.baseParams.wifi}</td>
                    <td>${room.baseParams.khala}</td>
                    <td><strong>${Math.round(room.totalPerPerson)}</strong> /person</td>
                </tr>`;
                summaryTable.innerHTML += row;
            });
            document.getElementById('result-section').classList.remove('hidden');
        }
    }

    // B. User View Update
    const container = document.getElementById('rooms-container');
    if (container) {
        container.innerHTML = '';

        const monthHeader = document.createElement('div');
        monthHeader.style.gridColumn = "1 / -1";
        monthHeader.innerHTML = `<h3>Month: ${data.month}</h3>`;
        container.appendChild(monthHeader);

        data.rooms.forEach(room => {
            const card = document.createElement('div');
            card.className = 'card room-card';
            card.innerHTML = `
                <h3>${room.name}</h3>
                <div class="member-names">Parties: ${room.members}</div>
                <div class="rent-details">
                    <div class="detail-row"><span>Base Rent</span> <span>${room.baseParams.base}</span></div>
                    <div class="detail-row"><span>Khala Bill</span> <span>${room.baseParams.khala}</span></div>
                    <div class="detail-row"><span>WiFi Bill</span> <span>${room.baseParams.wifi}</span></div>
                    <div class="detail-row"><span>Service Chg</span> <span>${room.baseParams.service.toFixed(2)}</span></div>
                    <div class="detail-row total"><span>Total /person</span> <span>${Math.round(room.totalPerPerson)}</span></div>
                </div>
            `;
            container.appendChild(card);
        });

        // Update total rent display
        const totalRentDisplay = document.getElementById('total-rent-display');
        if (totalRentDisplay) {
            totalRentDisplay.textContent = `৳${data.totalRent.toLocaleString()}`;
        }

        const driveLinkElement = document.querySelector('.btn-link');
        if (driveLinkElement && data.driveLink) {
            driveLinkElement.href = data.driveLink;
        }
    }
}

function loadLatestData() {
    const latestMonth = localStorage.getItem('latest_month');
    if (latestMonth) {
        loadMonthData(latestMonth);
    }
}

// ==========================================
// 6. Download Screenshot Function
// ==========================================
function downloadRentData() {
    const selectedMonth = localStorage.getItem('latest_month');
    const historySelect = document.getElementById('history-select');
    const month = (historySelect && historySelect.value) ? historySelect.value : selectedMonth;

    // Hide elements we don't want in the screenshot
    const themeToggle = document.querySelector('.theme-toggle');
    const downloadBtn = document.querySelector('button[onclick="downloadRentData()"]');
    const logoutBtn = document.querySelector('a.btn-secondary');
    const historySelectElem = document.getElementById('history-select');

    if (themeToggle) themeToggle.style.display = 'none';
    if (downloadBtn) downloadBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (historySelectElem) historySelectElem.style.display = 'none';

    // Capture the screenshot
    html2canvas(document.body, {
        backgroundColor: getComputedStyle(document.body).backgroundColor,
        scale: 2, // Higher quality
        logging: false,
        useCORS: true
    }).then(canvas => {
        // Convert to blob and download
        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Rent_Screenshot_${month || 'latest'}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Restore hidden elements
            if (themeToggle) themeToggle.style.display = '';
            if (downloadBtn) downloadBtn.style.display = '';
            if (logoutBtn) logoutBtn.style.display = '';
            if (historySelectElem) historySelectElem.style.display = '';
        });
    }).catch(error => {
        console.error('Screenshot failed:', error);
        alert('Failed to capture screenshot. Please try again.');

        // Restore hidden elements even on error
        if (themeToggle) themeToggle.style.display = '';
        if (downloadBtn) downloadBtn.style.display = '';
        if (logoutBtn) logoutBtn.style.display = '';
        if (historySelectElem) historySelectElem.style.display = '';
    });
}

// ==========================================
// 7. Entry Point
// ==========================================
window.onload = function () {
    // 1. Initialize data if empty
    initSampleData();

    // 2. Load Dropdown if present (User & Admin)
    // We populate it immediately so it's ready. 
    // On Admin it remains hidden until login. 
    // On User it is visible immediately.
    if (document.getElementById('history-select')) {
        loadHistoryDropdown();
    }

    // 3. Initial Data Load
    // User Page: Load data immediately
    if (document.getElementById('rooms-container')) {
        loadLatestData();
    }

    // Admin Page: Data loading is triggered by adminLogin() to ensure security/ux flow.

    // 4. Global Theme Check
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
};

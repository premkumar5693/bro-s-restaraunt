let socket;
import { io } from "socket.io-client";
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
let orders = [];
let menuItems = [];
let reservations = [];
let soundEnabled = false;

// Helpers
function getToken() { return localStorage.getItem('bros_admin_token'); }
function setToken(token) { localStorage.setItem('bros_admin_token', token); }
function logout() { localStorage.removeItem('bros_admin_token'); window.location.reload(); }

function checkAuth() {
    if(!getToken()) {
        document.getElementById('admin-login-overlay').classList.remove('hidden');
    } else {
        document.getElementById('admin-login-overlay').classList.add('hidden');
        initializeApp();
    }
}

// ----------------------------------------
// Booting Application
// ----------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    // Login form handler
    document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const phone = document.getElementById('admin-phone').value;
        const password = document.getElementById('admin-password').value;
        
        try {
            const res = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password })
            });
            const data = await res.json();
            if(data.success && data.user.role === 'admin') {
                setToken(data.token);
                checkAuth(); // Boots app
            } else {
                alert('Invalid Credentials or Not an Admin.');
            }
        } catch(err) {
            alert('Cannot reach backend!');
        }
    });

    document.getElementById('logout-btn').addEventListener('click', logout);
});

function initializeApp() {
    setupSockets();
    setupTabs();
    fetchAnalytics();
    fetchOrders();
    fetchMenu();
    fetchReservations();
    setupSound();
    setupMenuForm();
}

// ----------------------------------------
// Tab System
// ----------------------------------------
function setupTabs() {
    const btns = document.querySelectorAll('.admin-tab-btn');
    const views = document.querySelectorAll('.admin-view');
    const titleText = document.getElementById('view-title');

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Style active
            btns.forEach(b => {
                b.classList.remove('bg-white/10', 'text-custom-yellow');
                b.classList.add('text-gray-400');
            });
            btn.classList.add('bg-white/10', 'text-custom-yellow');
            btn.classList.remove('text-gray-400');
            
            // Switch view
            const targetId = btn.getAttribute('data-target');
            views.forEach(v => {
                if(v.id === targetId) v.classList.remove('hidden');
                else v.classList.add('hidden');
            });
            
            // Set Header
            if(targetId === 'view-dashboard') titleText.innerText = 'Analytics Dashboard';
            if(targetId === 'view-orders') titleText.innerText = 'Live Orders';
            if(targetId === 'view-history') titleText.innerText = 'Order History';
            if(targetId === 'view-menu') titleText.innerText = 'Menu Management';
            if(targetId === 'view-reservations') titleText.innerText = 'Table Reservations';
        });
    });
}

// ----------------------------------------
// Live Orders (Sockets)
// ----------------------------------------
function setupSockets() {
    if(socket) return;
    try {
        socket = io(API_BASE);
        const connStatus = document.getElementById('connection-status');
        
        socket.on('connect', () => {
            connStatus.innerHTML = '<div class="w-2 h-2 rounded-full bg-green-500 relative"><div class="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></div></div> Connected';
            connStatus.className = 'flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full border border-green-200 text-xs font-bold shadow-sm uppercase tracking-wider';
            // Resync data just in case the browser slept the tab and missed events
            fetchOrders();
            fetchAnalytics();
            fetchReservations();
        });

        socket.on('disconnect', () => {
            connStatus.innerHTML = '<div class="w-2 h-2 rounded-full bg-red-500 relative"></div> Disconnected';
            connStatus.className = 'flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-full border border-red-200 text-xs font-bold shadow-sm uppercase tracking-wider';
        });

        socket.on('new_order', (newOrder) => {
            orders.unshift(newOrder);
            renderOrders();
            fetchAnalytics();
            playNotification();
        });

        socket.on('status_update', (updatedOrder) => {
            const idx = orders.findIndex(o => o.id === updatedOrder.id);
            if(idx !== -1) {
                orders[idx] = updatedOrder;
                renderOrders();
            }
            fetchAnalytics();
        });

        socket.on('new_reservation', (newRes) => {
            reservations.unshift(newRes);
            renderReservations();
            playNotification();
        });
    } catch(e) { console.error('Sockets error', e); }
}

async function fetchOrders() {
    const res = await fetch(`${API_BASE}/api/orders`);
    orders = await res.json();
    renderOrders();
    if(orders.some(o => o.status === 'Pending')) playNotification();
}

let popularItemsChartInstance = null;
async function fetchAnalytics() {
    try {
        const res = await fetch(`${API_BASE}/api/orders/all`);
        const allOrders = await res.json();
        
        let revenue = 0;
        let deliveredCount = 0;
        const itemsMap = {};
        
        const todayStr = new Date().toLocaleDateString();
        
        allOrders.forEach(o => {
            const orderDateStr = new Date(o.createdAt).toLocaleDateString();
            
            // Only aggregate Today's orders for Analytics Dashboard
            if(orderDateStr === todayStr) {
                if(o.status === 'Delivered') {
                    revenue += o.totalAmount;
                    deliveredCount++;
                }
                if(o.status !== 'Cancelled') {
                    (o.items || []).forEach(i => {
                        itemsMap[i.name] = (itemsMap[i.name] || 0) + i.quantity;
                    });
                }
            }
        });
        
        document.getElementById('stat-revenue').textContent = `₹${revenue}`;
        document.getElementById('stat-orders').textContent = deliveredCount;
        
        const topItems = Object.keys(itemsMap).map(k => ({name: k, qty: itemsMap[k]})).sort((a,b) => b.qty - a.qty).slice(0, 5);
        renderChart(topItems);
        
        // Render Order History full list
        renderOrderHistory(allOrders);
    } catch(e) { console.error('Analytics error', e); }
}

function renderChart(items) {
    const ctx = document.getElementById('popularItemsChart')?.getContext('2d');
    if(!ctx) return;
    
    if(popularItemsChartInstance) popularItemsChartInstance.destroy();
    
    popularItemsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: items.map(i => i.name),
            datasets: [{
                label: 'Units Sold',
                data: items.map(i => i.qty),
                backgroundColor: 'rgba(255, 119, 0, 0.85)',
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { 
                y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } }, 
                x: { grid: { display: false } } 
            }
        }
    });
}

function renderOrders() {
    const container = document.getElementById('orders-container');
    const emptyState = document.getElementById('empty-orders-state');
    
    if(!orders.length) {
        emptyState.classList.remove('hidden');
        emptyState.classList.add('flex');
        container.innerHTML = '';
        return;
    }
    
    emptyState.classList.add('hidden');
    emptyState.classList.remove('flex');
    
    let html = '';
    orders.forEach(order => {
        const timeStr = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const badges = {
            'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-300',
            'Accepted': 'bg-blue-100 text-blue-800 border-blue-300',
            'Preparing': 'bg-purple-100 text-purple-800 border-purple-300',
            'Out for Delivery': 'bg-orange-100 text-orange-800 border-orange-300',
            'Delivered': 'bg-green-100 text-green-800 border-green-300',
            'Cancelled': 'bg-red-100 text-red-800 border-red-300'
        };
        const badgeClass = badges[order.status] || badges['Pending'];
        
        const itemsList = (order.items || []).map(item => `
            <div class="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 font-medium">
                <span>${item.quantity}x ${item.name}</span>
                <span class="text-gray-500">₹${item.price * item.quantity}</span>
            </div>
        `).join('');

        let actions = '';
        const btnClass = "px-4 py-2 font-bold transition-all shadow-sm active:scale-95 border bg-white hover:bg-gray-50 text-gray-700 rounded-lg";
        if(order.status === 'Pending') {
            actions = `<button onclick="window.setOrder('${order.id}', 'Accepted')" class="${btnClass} text-blue-600 border-blue-200">Accept</button> <button onclick="window.setOrder('${order.id}', 'Cancelled')" class="${btnClass} text-red-600 border-red-200">Cancel</button>`;
        } else if(order.status === 'Accepted') {
            actions = `<button onclick="window.setOrder('${order.id}', 'Preparing')" class="${btnClass} text-purple-600 border-purple-200">Start Preparing</button>`;
        } else if(order.status === 'Preparing') {
            actions = `<button onclick="window.setOrder('${order.id}', 'Out for Delivery')" class="${btnClass} text-orange-600 border-orange-200">Out for Delivery</button>`;
        } else if(order.status === 'Out for Delivery') {
            actions = `<button onclick="window.setOrder('${order.id}', 'Delivered')" class="${btnClass} text-green-600 border-green-200">Mark Delivered</button>`;
        } else {
            actions = `<span class="font-bold uppercase text-xs tracking-wider text-gray-400">Archived</span>`;
        }

        html += `
        <div class="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">
            <div class="flex-1 space-y-4">
                <div class="flex flex-wrap items-center gap-3">
                    <h3 class="font-black text-xl">#${order.id.slice(-6)}</h3>
                    <span class="px-2 py-1 text-[10px] font-bold rounded-md border uppercase tracking-wider ${badgeClass}">${order.status}</span>
                    <span class="text-sm text-gray-400 font-medium">${timeStr}</span>
                </div>
                <div class="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div class="font-bold text-gray-900">${order.customerDetails.name} <span class="font-normal text-gray-500">(${order.customerDetails.phone})</span></div>
                    <div class="text-sm text-gray-600 mt-1">${order.customerDetails.address || 'Dine-In / Pickup'}</div>
                </div>
            </div>
            <div class="flex-1 flex flex-col justify-between space-y-4">
                <div class="bg-gray-50 p-3 text-sm rounded-xl border border-gray-100">${itemsList}</div>
                <div class="flex items-center justify-between border-t pt-4">
                    <div class="font-black text-xl text-custom-orange">₹${order.totalAmount}</div>
                    <div class="flex gap-2">${actions}</div>
                </div>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

function renderOrderHistory(allOrdersData = []) {
    const tbody = document.getElementById('history-table-body');
    const totalEarningsEl = document.getElementById('history-total-earned');
    
    if(!allOrdersData.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-gray-400">No order history available</td></tr>';
        if(totalEarningsEl) totalEarningsEl.textContent = '₹0';
        return;
    }
    
    let lifecycleEarnings = 0;
    
    tbody.innerHTML = allOrdersData.map(order => {
        if(order.status === 'Delivered') {
            lifecycleEarnings += order.totalAmount;
        }
        
        const orderDateObj = new Date(order.createdAt);
        const dateStr = orderDateObj.toLocaleDateString();
        const timeStr = orderDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const itemsList = (order.items || []).map(item => `${item.quantity}x ${item.name}`).join(', ');
        const badges = {
            'Pending': 'bg-yellow-50 text-yellow-700 border-yellow-200',
            'Accepted': 'bg-blue-50 text-blue-700 border-blue-200',
            'Preparing': 'bg-purple-50 text-purple-700 border-purple-200',
            'Out for Delivery': 'bg-orange-50 text-orange-700 border-orange-200',
            'Delivered': 'bg-green-50 text-green-700 border-green-200',
            'Cancelled': 'bg-red-50 text-red-700 border-red-200'
        };
        const badgeClass = badges[order.status] || badges['Pending'];
        const payment = 'Pay at Counter';
        
        return `<tr class="hover:bg-gray-50 transition-colors">
            <td class="p-4">
               <div class="font-bold text-gray-900">${order.customerDetails.name || 'Anonymous'}</div>
               <div class="text-[10px] text-gray-500">${order.customerDetails.phone || ''}</div>
            </td>
            <td class="p-4">
               <div class="font-bold text-gray-700 text-sm">${dateStr}</div>
               <div class="text-[10px] text-gray-400 font-medium">${timeStr}</div>
            </td>
            <td class="p-4 text-gray-600 font-medium text-sm max-w-sm">${itemsList}</td>
            <td class="p-4 font-black text-custom-orange text-center">₹${order.totalAmount}</td>
            <td class="p-4 font-bold text-gray-700 text-center text-xs uppercase tracking-wider">${payment}</td>
            <td class="p-4 text-center">
                 <span class="px-2 py-1 text-[10px] font-bold rounded-md border uppercase tracking-wider ${badgeClass}">${order.status}</span>
            </td>
        </tr>`;
    }).join('');
    
    if(totalEarningsEl) totalEarningsEl.textContent = `₹${lifecycleEarnings}`;
}

window.setOrder = function(id, status) {
    if(socket) socket.emit('update_status', { id, status });
    stopNotification();
}


// ----------------------------------------
// Menu Management
// ----------------------------------------
async function fetchMenu() {
    const res = await fetch(`${API_BASE}/api/menu`);
    const data = await res.json();
    menuItems = [];
    if(data.success) {
        data.menuData.forEach(cat => cat.items.forEach(i => {
           i.category = cat.category;
           menuItems.push(i); 
        }));
    }
    renderMenu();
}

function renderMenu() {
    const tbody = document.getElementById('menu-table-body');
    if(!menuItems.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-gray-400">No menu items found</td></tr>';
        return;
    }
    tbody.innerHTML = menuItems.map(item => `
        <tr class="hover:bg-gray-50 transition-colors group">
            <td class="p-4 font-bold text-gray-600 uppercase text-xs tracking-wider">${item.category}</td>
            <td class="p-4 font-bold text-gray-900">${item.name}</td>
            <td class="p-4 font-bold text-custom-orange">₹${item.price}</td>
            <td class="p-4">
                <span class="px-2 py-1 text-[10px] font-bold rounded-md border uppercase tracking-wider ${item.type === 'veg' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}">${item.type}</span>
            </td>
            <td class="p-4 text-right space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="window.editMenu('${item.id}')" class="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 font-medium">Edit</button>
                <button onclick="window.deleteMenu('${item.id}')" class="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium">Delete</button>
            </td>
        </tr>
    `).join('');
}

let isEditing = false;
let currentEditId = null;

function setupMenuForm() {
    document.getElementById('menu-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = {
            id: document.getElementById('mi-slug').value,
            name: document.getElementById('mi-name').value,
            category: document.getElementById('mi-category').value.toUpperCase(),
            price: document.getElementById('mi-price').value,
            type: document.getElementById('mi-type').value
        };

        const url = isEditing ? `${API_BASE}/api/menu/${currentEditId}` : `${API_BASE}/api/menu`;
        const method = isEditing ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method, headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${getToken()}` },
            body: JSON.stringify(body)
        });
        const dt = await res.json();
        if(dt.success) {
            document.getElementById('menu-modal').classList.add('hidden');
            fetchMenu();
        } else {
            alert(dt.message || 'Error saving menu item');
        }
    });

    // Reset logic when modal closes or opens add
    window.addEventListener('click', e => {
        if(e.target.innerText && e.target.innerText.includes('Add Item')) {
            isEditing = false;
            document.getElementById('menu-form').reset();
            document.getElementById('mi-slug').readOnly = false;
        }
    });
}

window.editMenu = function(id) {
    isEditing = true;
    currentEditId = id;
    const item = menuItems.find(i => i.id === id);
    document.getElementById('mi-slug').value = item.id;
    document.getElementById('mi-slug').readOnly = true; // Don't change IDs easily
    document.getElementById('mi-name').value = item.name;
    document.getElementById('mi-category').value = item.category;
    document.getElementById('mi-price').value = item.price;
    document.getElementById('mi-type').value = item.type;
    document.getElementById('menu-modal').classList.remove('hidden');
}

window.deleteMenu = async function(id) {
    if(!confirm('Permanently delete this item?')) return;
    const res = await fetch(`${API_BASE}/api/menu/${id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if((await res.json()).success) fetchMenu();
}


// ----------------------------------------
// Table Reservations
// ----------------------------------------
async function fetchReservations() {
    const res = await fetch(`${API_BASE}/api/reservations`);
    reservations = await res.json();
    renderReservations();
    if(reservations.some(r => r.status === 'Pending')) playNotification();
}

function renderReservations() {
    const tbody = document.getElementById('res-table-body');
    if(!reservations.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="p-6 text-center text-gray-400">No incoming reservations</td></tr>';
        return;
    }
    tbody.innerHTML = reservations.map(r => `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="p-4">
                <div class="font-bold text-gray-900 text-base">${r.date}</div>
                <div class="text-custom-orange font-bold text-xs">${r.time}</div>
            </td>
            <td class="p-4">
                <div class="font-bold text-gray-900">${r.name}</div>
                <div class="text-gray-500 font-medium text-xs mt-1"><i class="ph-fill ph-phone text-gray-400"></i> ${r.phone}</div>
                <div class="text-gray-500 font-medium text-xs mt-0.5"><i class="ph-fill ph-users text-gray-400"></i> ${r.guests} guests</div>
            </td>
            <td class="p-4 text-center">
                <span class="px-3 py-1 font-bold text-[10px] uppercase tracking-widest rounded-full border ${r.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : (r.status === 'Confirmed' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200')}">
                    ${r.status}
                </span>
            </td>
            <td class="p-4 text-right space-x-2">
                ${r.status === 'Pending' ? `
                    <button onclick="window.resStatus('${r.id}', 'Confirmed')" class="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-bold border border-green-200">Confirm</button>
                    <button onclick="window.resStatus('${r.id}', 'Cancelled')" class="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-bold border border-red-200">Deny</button>
                ` : `<span class="text-xs text-gray-400 font-bold uppercase tracking-widest">Locked</span>`}
            </td>
        </tr>
    `).join('');
}

window.resStatus = async function(id, status) {
    const res = await fetch(`${API_BASE}/api/reservations/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ status })
    });
    if((await res.json()).success) {
        fetchReservations();
        stopNotification();
    }
}


// ----------------------------------------
// Sound Permissions
// ----------------------------------------
function setupSound() {
    const enableSoundBtn = document.getElementById('enable-sound-btn');
    const ringtone = document.getElementById('order-ringtone');
    
    function unlockAudio() {
        if(soundEnabled) return;
        soundEnabled = true;
        ringtone.volume = 0; 
        ringtone.play().then(() => {
            ringtone.pause(); ringtone.volume = 1; ringtone.currentTime = 0;
            if(enableSoundBtn) {
                enableSoundBtn.innerHTML = '<i class="ph-bold ph-speaker-high text-lg"></i> Sound Active';
                enableSoundBtn.classList.replace('bg-custom-orange', 'bg-green-500');
                enableSoundBtn.classList.replace('hover:bg-[#FF7700]', 'hover:bg-green-600');
            }
        }).catch(e => console.error(e));
        document.removeEventListener('click', unlockAudio);
    }
    
    document.addEventListener('click', unlockAudio, { once: true });
    if(enableSoundBtn) enableSoundBtn.addEventListener('click', unlockAudio);
}

function playNotification() {
    const ringtone = document.getElementById('order-ringtone');
    if(soundEnabled && ringtone) {
        ringtone.currentTime = 0;
        ringtone.loop = true;
        ringtone.play().catch(e => console.log("Audio block"));
    }
}

function stopNotification() {
    const ringtone = document.getElementById('order-ringtone');
    if(ringtone) { ringtone.pause(); ringtone.currentTime = 0; }
}

import { io } from "socket.io-client";
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
import './style.css';

// Professional Mobile Menu Logic
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const closeMenuBtn = document.getElementById('close-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

const toggleMenu = () => {
    const isHidden = mobileMenu.classList.contains('hidden');
    
    if (isHidden) {
        mobileMenu.classList.remove('hidden');
        // Small delay to allow display block to apply before transform over time
        setTimeout(() => {
            mobileMenu.classList.remove('translate-x-full');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        }, 10);
    } else {
        mobileMenu.classList.add('translate-x-full');
        setTimeout(() => {
            mobileMenu.classList.add('hidden');
            document.body.style.overflow = '';
        }, 300); // Matches Tailwind transition duration
    }
};

mobileMenuBtn?.addEventListener('click', toggleMenu);
closeMenuBtn?.addEventListener('click', toggleMenu);

document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', toggleMenu);
});

// Premium Sticky Navbar Logic (Solidifies on scroll)
const navbar = document.getElementById('navbar');
const brandText = document.getElementById('brand-text');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('bg-custom-charcoal/95', 'backdrop-blur-xl', 'shadow-2xl');
        navbar.classList.remove('bg-transparent', 'border-transparent');
        navbar.classList.replace('h-24', 'h-20');
        
        // Brand text adjustment
        if(brandText) brandText.classList.replace('text-white', 'text-white'); // Keep white on dark navbar
        
    } else {
        navbar.classList.remove('bg-custom-charcoal/95', 'backdrop-blur-xl', 'shadow-2xl');
        navbar.classList.add('bg-transparent', 'border-transparent');
        navbar.classList.replace('h-20', 'h-24');
    }
});

// High-end Scroll Reveal Intersections
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15
};

const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target); // Only animate once
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
    const elementsToReveal = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');
    elementsToReveal.forEach(el => revealObserver.observe(el));
});

// ==========================================
// CART & REAL-TIME ORDER TRACKING LOGIC
// ==========================================

const cartBtnDesktop = document.getElementById('floating-cart-btn');
const cartBtnMobile = document.getElementById('mobile-cart-btn');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartOverlay = document.getElementById('cart-overlay');
const cartSidebar = document.getElementById('cart-sidebar');
const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
const cartItemsList = document.getElementById('cart-items-list');
const cartEmptyState = document.getElementById('cart-empty-state');
const checkoutSection = document.getElementById('checkout-section');
const cartSubtotal = document.getElementById('cart-subtotal');
const checkoutForm = document.getElementById('checkout-form');
const checkoutBtn = checkoutForm?.querySelector('button[type="submit"]');

const trackingModal = document.getElementById('tracking-modal');
const closeTrackingBtn = document.getElementById('close-tracking-btn');
const trackOrderId = document.getElementById('track-order-id');

let cart = [];
let socket = null;
let currentTrackingOrderId = null;

// Connect Socket for Live Tracking
try {
    socket = io(API_BASE);
    socket.on('status_update', (updatedOrder) => {
        if(updatedOrder.id === currentTrackingOrderId) {
            updateTrackingUI(updatedOrder.status);
        }
    });
} catch(e) {
    console.log("Tracking socket offline.");
}

function updateTrackingUI(status) {
    const steps = ['pending', 'accepted', 'preparing', 'out', 'delivered'];
    const statusMap = {
        'Pending': 'pending',
        'Accepted': 'accepted',
        'Preparing': 'preparing',
        'Out for Delivery': 'out',
        'Delivered': 'delivered'
    };
    
    const cancelledMsg = document.getElementById('cancelled-state-msg');
    const stepsContainer = document.getElementById('tracking-steps');
    
    if (status === 'Cancelled') {
        if(stepsContainer) stepsContainer.classList.add('hidden');
        if(cancelledMsg) cancelledMsg.classList.remove('hidden');
        return;
    } else {
        if(stepsContainer) stepsContainer.classList.remove('hidden');
        if(cancelledMsg) cancelledMsg.classList.add('hidden');
    }

    const activeStepIndex = steps.indexOf(statusMap[status]);
    const progressLine = document.getElementById('tracking-progress-line');
    if(progressLine) {
        progressLine.style.height = (activeStepIndex * 25) + "%";
    }
    
    steps.forEach((step, index) => {
        const stepEl = document.querySelector(`.step-${step}`);
        if(!stepEl) return;
        
        const iconDiv = stepEl.querySelector('.tracking-icon-container');
        const iconI = iconDiv.querySelector('i');
        const defaultIcon = iconDiv.getAttribute('data-default-icon');
        
        if (index < activeStepIndex) {
            // Completed step
            stepEl.classList.remove('opacity-50', 'grayscale');
            iconDiv.className = `tracking-icon-container w-12 h-12 rounded-full border-4 border-white flex items-center justify-center font-bold text-xl shadow-md bg-green-500 text-white transition-all duration-500 z-10`;
            iconI.className = `ph-bold ph-check text-xl`;
        } else if (index === activeStepIndex) {
            // Current step
            stepEl.classList.remove('opacity-50', 'grayscale');
            iconDiv.className = `tracking-icon-container w-12 h-12 rounded-full border-4 border-white flex items-center justify-center font-bold text-xl shadow-lg bg-custom-orange text-white ring-4 ring-custom-orange/20 transition-all duration-500 scale-110 z-10`;
            iconI.className = `ph-bold ${defaultIcon} text-xl animate-pulse`;
        } else {
            // Future step
            stepEl.classList.add('opacity-50', 'grayscale');
            iconDiv.className = `tracking-icon-container w-12 h-12 rounded-full border-4 border-white flex items-center justify-center font-bold text-lg shadow-sm bg-gray-200 text-gray-500 transition-all duration-500 z-10`;
            iconI.className = `ph-bold ${defaultIcon} text-xl`;
        }
    });
}

function toggleCart() {
    const isHidden = cartSidebar.classList.contains('translate-x-full');
    if(isHidden) {
        cartOverlay.classList.remove('hidden');
        setTimeout(() => {
            cartOverlay.classList.remove('opacity-0');
            cartSidebar.classList.remove('translate-x-full');
        }, 10);
    } else {
        cartOverlay.classList.add('opacity-0');
        cartSidebar.classList.add('translate-x-full');
        setTimeout(() => {
            cartOverlay.classList.add('hidden');
        }, 300);
    }
}

cartBtnDesktop?.addEventListener('click', toggleCart);
cartBtnMobile?.addEventListener('click', toggleCart);
closeCartBtn?.addEventListener('click', toggleCart);
cartOverlay?.addEventListener('click', toggleCart);
// Empty state browse btn
document.getElementById('cart-browse-btn')?.addEventListener('click', () => {
    toggleCart();
    document.getElementById('menu').scrollIntoView({ behavior: 'smooth' });
});

function updateCartUI() {
    const badges = [document.getElementById('floating-cart-badge'), document.getElementById('mobile-cart-badge')];
    const mobileText = document.getElementById('mobile-cart-text');
    
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    badges.forEach(b => {
        if(b) {
            b.textContent = totalItems;
            if(totalItems > 0) b.classList.remove('hidden'); else b.classList.add('hidden');
        }
    });
    
    if(mobileText) mobileText.textContent = totalItems > 0 ? `₹${totalPrice}` : 'Your Order';
    if(cartSubtotal) cartSubtotal.textContent = `₹${totalPrice}`;
    
    if(totalItems === 0) {
        cartItemsList.classList.add('hidden');
        checkoutSection.classList.add('hidden');
        cartEmptyState.classList.remove('hidden');
    } else {
        cartEmptyState.classList.add('hidden');
        cartItemsList.classList.remove('hidden');
        checkoutSection.classList.remove('hidden');
        
        cartItemsList.innerHTML = '';
        cart.forEach(item => {
            cartItemsList.innerHTML += `
                <div class="flex gap-4 items-center bg-gray-50 p-3 rounded-2xl border border-gray-100 transform transition-all hover:shadow-sm">
                    <div class="flex-1">
                        <h4 class="font-bold text-gray-900 text-sm">${item.name}</h4>
                        <p class="text-custom-orange font-bold text-sm">₹${item.price}</p>
                    </div>
                    <div class="flex items-center gap-3 bg-white px-2 py-1 rounded-full shadow-sm border border-gray-100">
                        <button class="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-custom-orange hover:bg-orange-50 rounded-full font-bold transition-colors" onclick="window.updateCartQty('${item.id}', -1)">-</button>
                        <span class="font-bold text-sm text-gray-800 min-w-[1rem] text-center">${item.quantity}</span>
                        <button class="w-7 h-7 flex items-center justify-center text-gray-500 hover:text-custom-orange hover:bg-orange-50 rounded-full font-bold transition-colors" onclick="window.updateCartQty('${item.id}', 1)">+</button>
                    </div>
                </div>
            `;
        });
    }
}

window.updateCartQty = (id, change) => {
    const idx = cart.findIndex(i => i.id === id);
    if(idx !== -1) {
        cart[idx].quantity += change;
        if(cart[idx].quantity <= 0) cart.splice(idx, 1);
        updateCartUI();
    }
}

addToCartBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const id = e.target.dataset.id;
        const name = e.target.dataset.name;
        const price = parseInt(e.target.dataset.price);
        
        const existing = cart.find(i => i.id === id);
        if(existing) {
            existing.quantity++;
        } else {
            cart.push({ id, name, price, quantity: 1 });
        }
        
        const ogHTML = btn.innerHTML;
        btn.innerHTML = '<i class="ph-bold ph-check"></i> Added';
        btn.classList.add('!bg-green-500', '!text-white', '!border-green-500');
        setTimeout(() => {
            btn.innerHTML = ogHTML;
            btn.classList.remove('!bg-green-500', '!text-white', '!border-green-500');
        }, 1000);
        
        updateCartUI();
        if(cart.length === 1) toggleCart();
    });
});

checkoutForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if(cart.length === 0) return;
    
    const ogBtnHTML = checkoutBtn.innerHTML;
    checkoutBtn.innerHTML = '<i class="ph-bold ph-spinner animate-spin text-xl"></i> Processing...';
    checkoutBtn.disabled = true;

    try {
        const orderData = {
            customerDetails: {
                name: document.getElementById('cust-name').value,
                phone: document.getElementById('cust-phone').value,
                address: document.getElementById('cust-address').value
            },
            items: cart,
            totalAmount: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
        };
        
        let headers = { 'Content-Type': 'application/json' };
        if (localStorage.getItem('bros_token')) {
            headers['Authorization'] = 'Bearer ' + localStorage.getItem('bros_token');
        }
        

        const res = await fetch(`${API_BASE}/api/orders`, {
            method: 'POST',
            headers,
            body: JSON.stringify(orderData)
        });
        
        const data = await res.json();
        if(data.success) {
            toggleCart();
            cart.length = 0;
            updateCartUI();
            
            // Start Tracking UI
            currentTrackingOrderId = data.order.id;
            trackOrderId.textContent = '#' + currentTrackingOrderId.slice(-6);
            updateTrackingUI('Pending');
            
            trackingModal.classList.remove('hidden');
            trackingModal.classList.add('flex');
            
            setTimeout(() => {
                document.getElementById('tracking-content').classList.remove('scale-95');
                document.getElementById('tracking-content').classList.add('scale-100');
            }, 10);
            
            checkoutForm.reset();
        }
    } catch(err) {
        console.error("Order failed", err);
        alert("Restaurant backend is offline. Make sure the Node server is running on port 3000.");
    } finally {
        checkoutBtn.innerHTML = ogBtnHTML;
        checkoutBtn.disabled = false;
    }
});

closeTrackingBtn?.addEventListener('click', () => {
    document.getElementById('tracking-content').classList.add('scale-95');
    document.getElementById('tracking-content').classList.remove('scale-100');
    setTimeout(() => {
        trackingModal.classList.add('hidden');
        trackingModal.classList.remove('flex');
    }, 300);
});

// ==========================================
// PERSISTENT ORDER TRACKING PROMPT
// ==========================================
async function promptForTracking() {
    const userStr = localStorage.getItem('bros_user');
    const token = localStorage.getItem('bros_token');
    
    // Auto-track for registered users
    if (userStr && token) {
        try {
            const res = await fetch(`${API_BASE}/api/orders/user/history`, {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const orders = await res.json();
            if (orders && orders.length > 0) {
                const latestOrder = orders[0];
                alert(`Auto-tracking your latest order ID: #${latestOrder.id.slice(-6)}`);
                openTrackingModal(latestOrder);
                return;
            }
        } catch(e) { console.error('Auto-track failed', e); }
    }
    
    // Fallback for guests
    const orderId = prompt("Please enter your Order ID (you can find this on your checkout screen):");
    if(!orderId) return;
    
    fetch(`${API_BASE}/api/orders/${orderId.trim()}`)
        .then(res => {
            if(!res.ok) throw new Error("Not found");
            return res.json();
        })
        .then(order => openTrackingModal(order))
        .catch(e => {
            alert("Order not found or Invalid ID. Please check and try again.");
        });
}

function openTrackingModal(order) {
    currentTrackingOrderId = order.id;
    if(trackOrderId) trackOrderId.textContent = '#' + order.id.slice(-6);
    updateTrackingUI(order.status);
    
    trackingModal.classList.remove('hidden');
    trackingModal.classList.add('flex');
    setTimeout(() => {
        document.getElementById('tracking-content').classList.remove('scale-95');
        document.getElementById('tracking-content').classList.add('scale-100');
    }, 10);
    
    document.getElementById('mobile-menu')?.classList.add('translate-x-full');
}

document.getElementById('track-nav-btn')?.addEventListener('click', promptForTracking);
document.getElementById('mobile-track-nav-btn')?.addEventListener('click', promptForTracking);

// ==========================================
// OPEN MENU CARD LOGIC
// ==========================================
const openMenuBtn = document.getElementById('open-menu-btn');
const openMenuContainer = document.getElementById('open-menu-container');
const menuContentWrapper = document.getElementById('menu-content-wrapper');

openMenuBtn?.addEventListener('click', () => {
    // Hide the button container
    openMenuContainer.style.display = 'none';
    
    // Show the menu content wrapper
    menuContentWrapper.classList.remove('hidden');
    menuContentWrapper.classList.add('flex');
    
    // Trigger animations after a small delay for DOM paint
    setTimeout(() => {
        menuContentWrapper.classList.remove('opacity-0', 'translate-y-8');
        menuContentWrapper.classList.add('opacity-100', 'translate-y-0');
        
        // Re-trigger reveal observer for newly visible menu items
        if (typeof revealObserver !== 'undefined') {
            document.querySelectorAll('#menu-content-wrapper .reveal-up').forEach(el => {
                // remove existing visibility to re-animate
                el.classList.remove('is-visible'); 
                revealObserver.observe(el);
            });
        }
    }, 50);
});

// ==========================================
// DYNAMIC ZOMATO-STYLE MENU RENDERING
// ==========================================
let menuData = [];

const menuCategoriesContainer = document.getElementById('menu-categories');
const menuItemsContainer = document.getElementById('menu-items-container');

async function renderMenu() {
    if(!menuCategoriesContainer || !menuItemsContainer) return;

    try {
        const res = await fetch(`${API_BASE}/api/menu`);
        const data = await res.json();
        if(data.success && data.menuData.length > 0) {
            menuData = data.menuData;
        } else {
            menuItemsContainer.innerHTML = '<p class="text-gray-500 col-span-full py-10">Updating menu... Please check back later.</p>';
            return;
        }
    } catch(err) {
        menuItemsContainer.innerHTML = '<p class="text-red-500 font-bold p-10">Server offline. Cannot load menu. Please start the node server.</p>';
        return;
    }

    let categoriesHTML = '';
    let itemsHTML = '';

    menuData.forEach((section, index) => {
        const sectionId = 'cat-' + index;

        // Render Category Tab
        categoriesHTML += `
            <button onclick="document.getElementById('${sectionId}').scrollIntoView({ behavior: 'smooth', block: 'start' });"
                    class="snap-start shrink-0 px-6 py-4 lg:px-5 lg:py-3.5 text-left font-bold text-gray-500 hover:text-custom-charcoal hover:bg-gray-50 rounded-xl transition-all border-b-2 lg:border-b-0 lg:border-l-4 border-transparent hover:border-custom-orange w-full whitespace-nowrap lg:whitespace-normal flex justify-between items-center group">
                <span class="font-outfit text-[15px]">${section.category}</span>
                <span class="text-xs bg-gray-100 group-hover:bg-custom-orange group-hover:text-white text-gray-400 py-1 px-2 rounded-lg ml-3 hidden lg:block transition-colors">${section.items.length}</span>
            </button>
        `;

        // Render Items Group
        let sectionItemsHTML = `
            <div id="${sectionId}" class="scroll-mt-36 mb-14 last:mb-0">
                <h3 class="font-outfit text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    ${section.category} 
                    <hr class="flex-1 border-gray-200">
                </h3>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4">
        `;

        section.items.forEach((item, itemIdx) => {
            const isVeg = item.type === 'veg';
            const iconSvg = isVeg 
                ? `<svg class="w-5 h-5 text-green-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="12" cy="12" r="4" fill="currentColor"></circle></svg>`
                : `<svg class="w-5 h-5 text-red-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M12 8l4 8H8l4-8z" fill="currentColor"></path></svg>`;
            
            // Stagger animations based on index for entry
            const animDelay = (itemIdx % 5) * 100;
            
            sectionItemsHTML += `
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-gray-100/80 hover:border-custom-orange/40 hover:shadow-[0_4px_20px_-10px_rgba(252,191,73,0.3)] transition-all duration-300 group bg-white reveal-up opacity-0" style="transition-delay: ${animDelay}ms">
                    <div class="flex items-start gap-3 flex-1">
                        ${iconSvg}
                        <div>
                            <h4 class="font-bold text-gray-900 text-lg leading-tight group-hover:text-custom-orange transition-colors">${item.name}</h4>
                            <span class="font-outfit font-black text-lg text-custom-charcoal block mt-1 tracking-tight pr-4">₹${item.price}</span>
                        </div>
                    </div>
                    <button class="add-to-cart-dynamic-btn shrink-0 w-full sm:w-28 py-2.5 rounded-xl bg-orange-50/50 text-custom-orange font-bold text-sm hover:bg-custom-orange hover:text-white transition-all shadow-sm active:scale-95 border border-orange-100 hover:border-custom-orange uppercase tracking-wide"
                        data-id="${item.id}" data-name="${item.name}" data-price="${item.price}">
                        ADD +
                    </button>
                </div>
            `;
        });

        sectionItemsHTML += `</div></div>`;
        itemsHTML += sectionItemsHTML;
    });

    menuCategoriesContainer.innerHTML = categoriesHTML;
    menuItemsContainer.innerHTML = itemsHTML;

    // Attach click handlers to newly generated buttons
    document.querySelectorAll('.add-to-cart-dynamic-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.dataset.id;
            const name = e.target.dataset.name;
            const price = parseInt(e.target.dataset.price);
            
            const existing = cart.find(i => i.id === id);
            if(existing) {
                existing.quantity++;
            } else {
                cart.push({ id, name, price, quantity: 1 });
            }
            
            const ogText = btn.innerHTML;
            btn.innerHTML = '<i class="ph-bold ph-check text-lg"></i> ADDED';
            btn.classList.replace('bg-orange-50/50', 'bg-green-500');
            btn.classList.replace('text-custom-orange', 'text-white');
            btn.classList.replace('border-orange-100', 'border-green-500');
            btn.classList.remove('hover:bg-custom-orange', 'hover:border-custom-orange');
            
            setTimeout(() => {
                btn.innerHTML = ogText;
                btn.classList.replace('bg-green-500', 'bg-orange-50/50');
                btn.classList.replace('text-white', 'text-custom-orange');
                btn.classList.replace('border-green-500', 'border-orange-100');
                btn.classList.add('hover:bg-custom-orange', 'hover:border-custom-orange');
            }, 1000);
            
            updateCartUI();
            if(cart.length === 1) toggleCart();
        });
    });

    // Re-observe newly injected reveal elements
    if (typeof revealObserver !== 'undefined') {
        document.querySelectorAll('.reveal-up').forEach(el => revealObserver.observe(el));
    }
}

// Trigger render after a slight delay
setTimeout(renderMenu, 100);

document.addEventListener('DOMContentLoaded', () => {
    const userStr = localStorage.getItem('bros_user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            if (user.name) document.getElementById('cust-name').value = user.name;
            if (user.phone) document.getElementById('cust-phone').value = user.phone;
        } catch(e) {}
    }
});

// ==========================================
// MY ACCOUNT & ORDER HISTORY
// ==========================================
const accountModal = document.getElementById('account-modal');
const closeAccountBtn = document.getElementById('close-account-btn');
const accountOrdersContainer = document.getElementById('account-orders-container');
const userProfileBtn = document.getElementById('user-profile-btn');

function openAccountModal() {
    if(!accountModal) return;
    accountModal.classList.remove('hidden');
    accountModal.classList.add('flex');
    setTimeout(() => {
        document.getElementById('account-content').classList.remove('scale-95');
        document.getElementById('account-content').classList.add('scale-100');
    }, 10);
    
    accountOrdersContainer.innerHTML = '<div class="flex justify-center p-8"><i class="ph-bold ph-spinner animate-spin text-3xl text-custom-orange"></i></div>';
    
    // Fetch History Natively
    const token = localStorage.getItem('bros_token');
    fetch(`${API_BASE}/api/orders/user/history`, {
        headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(res => res.json())
    .then(orders => {
        if(!orders || orders.length === 0) {
            accountOrdersContainer.innerHTML = '<div class="text-center text-gray-400 p-8 font-medium">No past orders found. Time to feast!</div>';
            return;
        }
        accountOrdersContainer.innerHTML = orders.map(order => {
             const items = (order.items||[]).map(i => `${i.quantity}x ${i.name}`).join(', ');
             const date = new Date(order.createdAt).toLocaleDateString();
             return `
                <div class="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div class="font-bold text-gray-900 border-b border-gray-50 pb-2 mb-2 flex items-center gap-3">
                            <span class="text-custom-orange uppercase tracking-wider text-xs border border-orange-200 px-2 rounded-md">#${order.id.slice(-6)}</span>
                            <span class="text-xs text-gray-400 font-medium">${date}</span>
                            <span class="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full ${order.status==='Delivered'?'bg-green-100 text-green-700':'bg-yellow-100 text-yellow-700'}">${order.status}</span>
                        </div>
                        <div class="text-sm text-gray-600 font-medium line-clamp-2">${items}</div>
                    </div>
                    <div class="font-black text-xl text-gray-900 md:text-right shrink-0">
                        ₹${order.totalAmount}
                    </div>
                </div>
             `;
        }).join('');
    })
    .catch(err => {
        accountOrdersContainer.innerHTML = '<div class="text-red-500 font-bold p-8">Error loading history.</div>';
    });
}

closeAccountBtn?.addEventListener('click', () => {
    document.getElementById('account-content').classList.remove('scale-100');
    document.getElementById('account-content').classList.add('scale-95');
    setTimeout(() => {
        accountModal.classList.add('hidden');
        accountModal.classList.remove('flex');
    }, 300);
});

userProfileBtn?.addEventListener('click', openAccountModal);

document.getElementById('account-logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem('bros_token');
    localStorage.removeItem('bros_user');
    window.location.reload();
});

const DEFAULT_PRODUCTS = [
    { id: 1, name: "عطر عود موناكو الملكي", price: 580, notes: "دهن العود الهندي، ورد طائفي", image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80" },
    { id: 2, name: "بلاكبيري & باودر فرنسي", price: 420, notes: "توت أسود، مسك أبيض", image: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=500&q=80" },
    { id: 3, name: "توباكو آند ليذر نيش", price: 650, notes: "تبغ كوبي، جلد فاخر", image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=500&q=80" }
];

let currentUser = JSON.parse(localStorage.getItem('scent_current_user')) || null;
let cart = [];
let currentBlend = { base: null, heart: null, top: null };

document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    renderProducts();
    renderNotes();
});

function updateAuthUI() {
    const area = document.getElementById('userAuthArea');
    if (currentUser) {
        area.innerHTML = `<div class="flex items-center gap-2 text-xs">
            <span class="text-gold-400 font-bold">${currentUser.email}</span>
            <button onclick="logoutUser()" class="bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg">خروج</button>
        </div>`;
    } else {
        area.innerHTML = `<button onclick="openAuthModal()" class="gold-bg text-black font-bold text-xs px-4 py-2.5 rounded-xl">حسابي / دخول</button>`;
    }
}

function openAuthModal() { document.getElementById('authModal').classList.remove('hidden'); }
function closeAuthModal() { document.getElementById('authModal').classList.add('hidden'); }

function handleAuthSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('authEmail').value;
    currentUser = { email: email };
    localStorage.setItem('scent_current_user', JSON.stringify(currentUser));
    closeAuthModal();
    updateAuthUI();
    alert('تم تسجيل الدخول بنجاح!');
}

function logoutUser() {
    currentUser = null;
    localStorage.removeItem('scent_current_user');
    updateAuthUI();
    showSection('store');
}

function showSection(sec) {
    document.getElementById('secStore').classList.add('hidden');
    document.getElementById('secBlender').classList.add('hidden');
    document.getElementById('secMyOrders').classList.add('hidden');

    if (sec === 'store') document.getElementById('secStore').classList.remove('hidden');
    if (sec === 'blender') document.getElementById('secBlender').classList.remove('hidden');
    if (sec === 'myOrders') {
        if (!currentUser) {
            alert('برجاء تسجيل الدخول أولاً لمتابعة طلباتك!');
            openAuthModal();
            return;
        }
        renderCustomerOrders();
        document.getElementById('secMyOrders').classList.remove('hidden');
    }
}

function renderProducts() {
    let prods = JSON.parse(localStorage.getItem('scent_products')) || DEFAULT_PRODUCTS;
    document.getElementById('productsGrid').innerHTML = prods.map(p => `
        <div class="glass-card rounded-3xl overflow-hidden p-5 flex flex-col justify-between space-y-4">
            <img src="${p.image}" class="h-52 w-full object-cover rounded-2xl" alt="${p.name}">
            <div>
                <h3 class="font-bold text-white text-lg font-amiri">${p.name}</h3>
                <p class="text-xs text-gray-400 mt-1">${p.notes}</p>
            </div>
            <div class="flex items-center justify-between border-t border-gray-800 pt-3">
                <span class="text-xl font-black text-gold-400">${p.price} ج.م</span>
                <button onclick="addToCart(${p.id})" class="gold-bg text-black p-3 rounded-xl font-bold"><i class="fa-solid fa-cart-plus"></i></button>
            </div>
        </div>
    `).join('');
}

function renderNotes() {
    const notesDB = {
        base: ["دهن العود الصافي", "العنبر الملكي", "خشب الصندل"],
        heart: ["الورد الطائفي", "الياسمين البلدي"],
        top: ["البرغموت الإيطالي", "الافندر الفرنسي"]
    };
    const renderSet = (arr, id, type) => {
        document.getElementById(id).innerHTML = arr.map(n => `
            <button onclick="selectNote('${type}', '${n}')" class="p-3 bg-[#0a0c10] border border-gray-800 hover:border-gold-500 rounded-xl text-xs font-bold text-right text-gray-300">${n}</button>
        `).join('');
    };
    renderSet(notesDB.base, 'baseNotesContainer', 'base');
    renderSet(notesDB.heart, 'heartNotesContainer', 'heart');
    renderSet(notesDB.top, 'topNotesContainer', 'top');
}

function selectNote(type, name) {
    currentBlend[type] = name;
}

function addToCart(id) {
    let prods = JSON.parse(localStorage.getItem('scent_products')) || DEFAULT_PRODUCTS;
    const p = prods.find(x => x.id === id);
    cart.push({ id: p.id, name: p.name, price: p.price, qty: 1 });
    updateCartUI();
    toggleCart(true);
}

function updateCartUI() {
    document.getElementById('cartBadge').textContent = cart.reduce((a, b) => a + b.qty, 0);
    document.getElementById('cartItemsContainer').innerHTML = cart.map((i, idx) => `
        <div class="flex justify-between items-center bg-[#0a0c10] p-3 rounded-xl border border-gray-800 text-xs">
            <span>${i.name} (${i.price} ج.م)</span>
        </div>
    `).join('');
    document.getElementById('cartTotal').textContent = `${cart.reduce((a, b) => a + (b.price * b.qty), 0)} ج.م`;
}

function toggleCart(s) { document.getElementById('cartDrawer').classList.toggle('hidden', !s); }
function openCheckout() {
    if (!currentUser) { alert('يجب تسجيل الدخول لإتمام الطلب!'); openAuthModal(); return; }
    toggleCart(false);
    document.getElementById('checkoutModal').classList.remove('hidden');
}
function closeCheckout() { document.getElementById('checkoutModal').classList.add('hidden'); }

function confirmOrder(e) {
    e.preventDefault();
    let orders = JSON.parse(localStorage.getItem('scent_orders')) || [];
    const order = {
        id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
        userEmail: currentUser.email,
        name: document.getElementById('custName').value,
        phone: document.getElementById('custPhone').value,
        address: document.getElementById('custAddr').value,
        items: [...cart],
        total: document.getElementById('cartTotal').textContent,
        date: new Date().toLocaleDateString('ar-EG')
    };
    orders.unshift(order);
    localStorage.setItem('scent_orders', JSON.stringify(orders));
    cart = [];
    updateCartUI();
    closeCheckout();
    alert('تم إرسال طلبك بنجاح!');
}

function renderCustomerOrders() {
    let orders = JSON.parse(localStorage.getItem('scent_orders')) || [];
    let myOrders = orders.filter(o => o.userEmail === currentUser.email);
    document.getElementById('customerOrdersList').innerHTML = myOrders.length ? myOrders.map(o => `
        <div class="glass-card p-5 rounded-2xl border border-gray-800 space-y-2 text-xs">
            <div class="flex justify-between"><strong class="text-gold-400">${o.id}</strong><span>${o.date}</span></div>
            <p>الإجمالي: <strong>${o.total}</strong></p>
        </div>
    `).join('') : '<p class="text-gray-400 text-xs">لا توجد طلبات سابقة لك.</p>';
}

window.addEventListener('storage', () => renderProducts());

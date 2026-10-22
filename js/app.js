let currentUser = null;
let cart = [];
let currentBlend = { base: null, heart: null, top: null };

document.addEventListener('DOMContentLoaded', async () => {
    await checkUserSession();
    await renderProducts();
    await renderNotes();
    calcPrice();
    await loadStoreSettings();
});

async function checkUserSession() {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (session) currentUser = session.user;
    updateAuthUI();
}

function updateAuthUI() {
    const area = document.getElementById('userAuthArea');
    if (currentUser) {
        area.innerHTML = `<div class="flex items-center gap-2 text-xs">
            <span class="text-gold-400 font-bold hidden sm:block">${currentUser.email}</span>
            <button onclick="logoutUser()" class="bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg">خروج</button>
        </div>`;
    } else {
        area.innerHTML = `<button onclick="openAuthModal()" class="gold-bg text-black font-bold text-xs px-4 py-2.5 rounded-xl">حسابي / دخول</button>`;
    }
}

function openAuthModal() { document.getElementById('authModal').classList.remove('hidden'); }
function closeAuthModal() { document.getElementById('authModal').classList.add('hidden'); }

async function handleAuthSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPass').value;
    const btn = e.target.querySelector('button[type="submit"]');
    btn.textContent = 'جاري التحميل...';

    let { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
    if (error && error.message.includes('Invalid login credentials')) {
        const { data: signUpData, error: signUpError } = await window.supabaseClient.auth.signUp({ email, password });
        if (signUpError) { alert('خطأ: ' + signUpError.message); btn.textContent = 'دخول / تسجيل'; return; }
        data = signUpData;
        alert('تم إنشاء حسابك بنجاح!');
    } else if (error) {
        alert('خطأ: ' + error.message); btn.textContent = 'دخول / تسجيل'; return;
    }
    currentUser = data.user;
    closeAuthModal();
    updateAuthUI();
    btn.textContent = 'دخول / تسجيل';
}

async function logoutUser() {
    await window.supabaseClient.auth.signOut();
    currentUser = null;
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
        if (!currentUser) { alert('برجاء تسجيل الدخول أولاً لمتابعة طلباتك!'); openAuthModal(); return; }
        renderCustomerOrders();
        document.getElementById('secMyOrders').classList.remove('hidden');
    }
}

async function renderProducts() {
    const { data: prods, error } = await window.supabaseClient.from('products').select('*').order('created_at', { ascending: false });
    if (error) return;
    if (prods.length === 0) {
        document.getElementById('productsGrid').innerHTML = '<p class="text-gray-400 text-center col-span-3">لا توجد منتجات حالياً.</p>';
        return;
    }
    document.getElementById('productsGrid').innerHTML = prods.map(p => `
        <div class="glass-card rounded-3xl overflow-hidden p-5 flex flex-col justify-between space-y-4">
            <img src="${p.image_url}" class="h-52 w-full object-cover rounded-2xl" alt="${p.name}">
            <div>
                <h3 class="font-bold text-white text-lg font-amiri">${p.name}</h3>
                <p class="text-xs text-gray-400 mt-1">${p.notes || ''}</p>
            </div>
            <div class="flex items-center justify-between border-t border-gray-800 pt-3">
                <span class="text-xl font-black text-gold-400">${p.price} ج.م</span>
                <button onclick="addToCart(${p.id}, '${p.name}', ${p.price})" class="gold-bg text-black p-3 rounded-xl font-bold"><i class="fa-solid fa-cart-plus"></i></button>
            </div>
        </div>
    `).join('');
}

async function renderNotes() {
    const { data: notes, error } = await window.supabaseClient.from('perfume_notes').select('*');
    if (error) return;

    const renderSet = (type, id) => {
        const filtered = notes.filter(n => n.type === type);
        document.getElementById(id).innerHTML = filtered.map(n => `
            <button onclick="selectNote('${type}', '${n.name}')" id="note-${type}-${n.name}" class="p-3 bg-[#0a0c10] border border-gray-800 hover:border-gold-500 rounded-xl text-xs font-bold text-right text-gray-300 transition-all">${n.name}</button>
        `).join('');
    };
    renderSet('base', 'baseNotesContainer');
    renderSet('heart', 'heartNotesContainer');
    renderSet('top', 'topNotesContainer');
}

function selectNote(type, name) {
    currentBlend[type] = name;
    document.querySelectorAll(`[id^="note-${type}-"]`).forEach(btn => btn.classList.remove('border-gold-500', 'bg-gold-500/10'));
    const el = document.getElementById(`note-${type}-${name}`);
    if(el) el.classList.add('border-gold-500', 'bg-gold-500/10');
}

function calcPrice() {
    const sizeSelect = document.getElementById('bSize');
    const concSelect = document.getElementById('bConc');
    if(!sizeSelect || !concSelect) return;
    const total = Math.round(350 * parseFloat(sizeSelect.options[sizeSelect.selectedIndex].dataset.f) * parseFloat(concSelect.options[concSelect.selectedIndex].dataset.f));
    document.getElementById('customPrice').textContent = `${total} ج.م`;
    updateBottleUI();
}

function updateBottleUI() {
    const name = document.getElementById('bEngrave').value || 'اسم العطر';
    document.getElementById('prevText').textContent = name;
    document.getElementById('prevSpecs').textContent = `${document.getElementById('bSize').value}ml - ${document.getElementById('bConc').value}`;
}

function addCustomToCart() {
    if(!currentBlend.base || !currentBlend.heart || !currentBlend.top) return alert('برجاء اختيار النوتات الثلاثة!');
    const price = parseInt(document.getElementById('customPrice').textContent.replace(/[^\d]/g, ''));
    const name = document.getElementById('bEngrave').value || 'تركيب مخصص';
    cart.push({ id: Date.now(), name: `تركيب: ${name} (${currentBlend.top} + ${currentBlend.heart} + ${currentBlend.base})`, price: price, qty: 1 });
    updateCartUI();
    toggleCart(true);
    showSection('store');
}

function addToCart(id, name, price) {
    const existingItem = cart.find(item => item.id === id);
    if (existingItem) existingItem.qty += 1;
    else cart.push({ id: id, name: name, price: price, qty: 1 });
    updateCartUI();
    toggleCart(true);
}

function updateCartUI() {
    document.getElementById('cartBadge').textContent = cart.reduce((a, b) => a + b.qty, 0);
    document.getElementById('cartItemsContainer').innerHTML = cart.map((i, idx) => `
        <div class="flex flex-col bg-[#0a0c10] p-3 rounded-xl border border-gray-800 text-xs gap-2">
            <div class="flex justify-between items-center">
                <span class="font-bold text-white">${i.name}</span>
                <button onclick="removeFromCart(${idx})" class="text-red-400"><i class="fa-solid fa-trash"></i></button>
            </div>
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-2 bg-gray-900 rounded-lg p-1">
                    <button onclick="changeQty(${idx}, -1)" class="w-6 h-6 flex items-center justify-center text-white">-</button>
                    <span class="w-4 text-center font-bold">${i.qty}</span>
                    <button onclick="changeQty(${idx}, 1)" class="w-6 h-6 flex items-center justify-center text-white">+</button>
                </div>
                <span class="text-gold-400 font-bold">${i.price * i.qty} ج.م</span>
            </div>
        </div>
    `).join('');
    document.getElementById('cartTotal').textContent = `${cart.reduce((a, b) => a + (b.price * b.qty), 0)} ج.م`;
}

function changeQty(idx, amount) { cart[idx].qty += amount; if (cart[idx].qty <= 0) cart.splice(idx, 1); updateCartUI(); }
function removeFromCart(idx) { cart.splice(idx, 1); updateCartUI(); }
function toggleCart(s) { document.getElementById('cartDrawer').classList.toggle('hidden', !s); }

function openCheckout() {
    if (cart.length === 0) return alert('سلتك فارغة!');
    if (!currentUser) { alert('يجب تسجيل الدخول!'); openAuthModal(); return; }
    toggleCart(false);
    document.getElementById('checkoutModal').classList.remove('hidden');
}
function closeCheckout() { document.getElementById('checkoutModal').classList.add('hidden'); }

async function confirmOrder(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.textContent = 'جاري تأكيد الطلب...';
    const orderId = 'ORD-' + Math.floor(1000 + Math.random() * 9000);
    const total = parseInt(document.getElementById('cartTotal').textContent.replace(/[^\d]/g, ''));

    const { error: orderError } = await window.supabaseClient.from('orders').insert([{
        id: orderId, user_id: currentUser.id, customer_name: document.getElementById('custName').value,
        phone: document.getElementById('custPhone').value, address: document.getElementById('custAddr').value, total: total
    }]);

    if (orderError) { alert('حدث خطأ: ' + orderError.message); btn.textContent = 'تأكيد'; return; }

    const itemsToInsert = cart.map(item => ({ order_id: orderId, product_name: item.name, price: item.price, quantity: item.qty }));
    await window.supabaseClient.from('order_items').insert(itemsToInsert);

    cart = []; updateCartUI(); closeCheckout(); e.target.reset(); btn.textContent = 'تأكيد وإرسال الأوردر';
    alert('تم إرسال طلبك بنجاح!'); showSection('myOrders');
}

async function renderCustomerOrders() {
    const container = document.getElementById('customerOrdersList');
    container.innerHTML = '<p class="text-center text-gray-400">جاري التحميل...</p>';
    const { data: orders, error } = await window.supabaseClient.from('orders').select(`*, order_items (*)`).eq('user_id', currentUser.id).order('created_at', { ascending: false });
    if (error) return;
    container.innerHTML = orders.length === 0 ? '<p class="text-gray-400 text-xs">لا توجد طلبات.</p>' : orders.map(o => `
        <div class="glass-card p-5 rounded-2xl border border-gray-800 space-y-3 text-xs">
            <div class="flex justify-between border-b border-gray-800 pb-2">
                <strong class="text-gold-400">${o.id}</strong>
                <span class="px-2 py-1 rounded bg-gray-800 text-gray-300">${o.status === 'pending' ? 'قيد المراجعة' : o.status}</span>
            </div>
            <div class="space-y-1">${o.order_items.map(i => `<p class="text-gray-300">- ${i.product_name} <span class="text-gold-400">(${i.quantity}x)</span></p>`).join('')}</div>
            <p class="text-left font-black text-white pt-2 border-t border-gray-800">الإجمالي: ${o.total} ج.م</p>
        </div>
    `).join('');
}

async function loadStoreSettings() {
    const { data: set } = await window.supabaseClient.from('settings').select('*').eq('id', 1).single();
    if (set) {
        if (document.getElementById('brandHeaderName')) document.getElementById('brandHeaderName').textContent = set.brand_name;
        if (document.getElementById('bannerTitle')) document.getElementById('bannerTitle').textContent = set.banner_title;
        if (document.getElementById('bannerDesc')) document.getElementById('bannerDesc').textContent = set.banner_desc;
    }
}

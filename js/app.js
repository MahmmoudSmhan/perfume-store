const PRODUCTS = [
    { id: 1, name: "عطر عود موناكو الملكي", price: 580, notes: "دهن العود الهندي، ورد طائفي، عنبر بلتيك", image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=500&q=80" },
    { id: 2, name: "بلاكبيري & باودر فرنسي", price: 420, notes: "توت أسود، مسك أبيض، مسك الروم", image: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=500&q=80" },
    { id: 3, name: "توباكو آند ليذر نيش", price: 650, notes: "تبغ كوبي، جلد فاخر، فانيليا مدغشقر", image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=500&q=80" }
];

const NOTES_DB = {
    base: ["دهن العود الصافي", "العنبر الملكي", "خشب الصندل", "الفانيليا السوداء"],
    heart: ["الورد الطائفي", "الياسمين البلدي", "التبغ والتوابل"],
    top: ["البرغموت الإيطالي", "الافندر الفرنسي", "الحمضيات الفواحة"]
};

let cart = [];
let currentBlend = { base: null, heart: null, top: null };

document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    renderNotes();
});

function showSection(sec) {
    document.getElementById('secStore').classList.add('hidden');
    document.getElementById('secBlender').classList.add('hidden');

    if (sec === 'store') document.getElementById('secStore').classList.remove('hidden');
    if (sec === 'blender') document.getElementById('secBlender').classList.remove('hidden');
}

function renderProducts() {
    document.getElementById('productsGrid').innerHTML = PRODUCTS.map(p => `
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
    const renderSet = (arr, id, type) => {
        document.getElementById(id).innerHTML = arr.map(n => `
            <button onclick="selectNote('${type}', '${n}')" class="p-3 bg-obsidian border border-gray-800 hover:border-gold-500 rounded-xl text-xs font-bold text-right text-gray-300 transition">${n}</button>
        `).join('');
    };
    renderSet(NOTES_DB.base, 'baseNotesContainer', 'base');
    renderSet(NOTES_DB.heart, 'heartNotesContainer', 'heart');
    renderSet(NOTES_DB.top, 'topNotesContainer', 'top');
}

function selectNote(type, name) {
    currentBlend[type] = name;
    document.getElementById(`txt${type.charAt(0).toUpperCase() + type.slice(1)}`).textContent = name;
}

function updateBottleUI() {
    const val = document.getElementById('bEngrave').value;
    document.getElementById('prevText').textContent = val || "اسم العطر";
}

function calcPrice() {
    const sz = document.getElementById('bSize').value;
    const conc = document.getElementById('bConc').value;
    const p = (sz === "100" ? 560 : 350) * (conc === "Extrait" ? 1.35 : 1);
    document.getElementById('customPrice').textContent = `${Math.round(p)} ج.م`;
    document.getElementById('prevSpecs').textContent = `${sz}ml - ${conc}`;
}

function addCustomToCart() {
    if (!currentBlend.base || !currentBlend.heart || !currentBlend.top) {
        return alert('برجاء تحديد جميع النوتات العطرية لتركيبتك الملكية!');
    }
    const eng = document.getElementById('bEngrave').value || "تركيبة مخصصة";
    const price = parseInt(document.getElementById('customPrice').textContent);
    cart.push({ id: 'c_' + Date.now(), name: `تركيبة (${eng})`, price: price, qty: 1 });
    updateCartUI();
    toggleCart(true);
}

function addToCart(id) {
    const p = PRODUCTS.find(x => x.id === id);
    const found = cart.find(x => x.id === id);
    if (found) found.qty++;
    else cart.push({ id: p.id, name: p.name, price: p.price, qty: 1 });
    updateCartUI();
    toggleCart(true);
}

function updateCartUI() {
    document.getElementById('cartBadge').textContent = cart.reduce((a, b) => a + b.qty, 0);
    document.getElementById('cartItemsContainer').innerHTML = cart.map((i, idx) => `
        <div class="flex justify-between items-center bg-obsidian p-3.5 rounded-xl border border-gray-800 text-xs">
            <div>
                <p class="font-bold text-white">${i.name}</p>
                <p class="text-gray-400 mt-0.5">${i.price} ج.م × ${i.qty}</p>
            </div>
            <div class="flex gap-2 items-center">
                <button onclick="changeQty(${idx}, -1)" class="w-6 h-6 bg-gray-800 text-white rounded">-</button>
                <span>${i.qty}</span>
                <button onclick="changeQty(${idx}, 1)" class="w-6 h-6 bg-gray-800 text-white rounded">+</button>
            </div>
        </div>
    `).join('');
    const tot = cart.reduce((a, b) => a + (b.price * b.qty), 0);
    document.getElementById('cartTotal').textContent = `${tot} ج.م`;
}

function changeQty(idx, d) {
    cart[idx].qty += d;
    if (cart[idx].qty <= 0) cart.splice(idx, 1);
    updateCartUI();
}

function toggleCart(s) { document.getElementById('cartDrawer').classList.toggle('hidden', !s); }

function openCheckout() {
    if (cart.length === 0) return alert('السلة فارغة!');
    toggleCart(false);
    document.getElementById('checkoutModal').classList.remove('hidden');
}
function closeCheckout() { document.getElementById('checkoutModal').classList.add('hidden'); }

function confirmOrder(e) {
    e.preventDefault();
    let orders = JSON.parse(localStorage.getItem('scent_orders')) || [];
    const order = {
        id: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
        name: document.getElementById('custName').value,
        phone: document.getElementById('custPhone').value,
        address: document.getElementById('custAddr').value,
        items: [...cart],
        total: document.getElementById('cartTotal').textContent
    };
    orders.unshift(order);
    localStorage.setItem('scent_orders', JSON.stringify(orders));
    cart = [];
    updateCartUI();
    closeCheckout();
    alert('تم استلام أوردرك بنجاح! وسنتواصل معك فوراً لتجهيزه.');
}

function sendWA() {
    const n = document.getElementById('custName').value;
    const p = document.getElementById('custPhone').value;
    if (!n || !p) return alert('أدخل الاسم والرقم!');
    let m = `*طلب جديد من Scent Craft*%0A*الاسم:* ${n}%0A*الهاتف:* ${p}%0A%0A*الطلبات:*%0A`;
    cart.forEach(i => m += `- ${i.name} (${i.qty})%0A`);
    m += `%0A*المجموع:* ${document.getElementById('cartTotal').textContent}`;
    window.open(`https://wa.me/201000000000?text=${m}`, '_blank');
}

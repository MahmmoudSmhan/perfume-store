window.switchTab = function(tab) {
    const sections = ['secTabOrders', 'secTabProducts', 'secTabNotes', 'secTabSettings'];
    sections.forEach(id => document.getElementById(id)?.classList.add('hidden'));

    document.querySelectorAll('[id^="tab_"]').forEach(el => {
        el.classList.remove('border-gold-500', 'text-gold-400');
        el.classList.add('border-transparent', 'text-gray-400');
    });

    const activeSec = document.getElementById(`secTab${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
    const activeTab = document.getElementById(`tab_${tab}`);

    if (activeSec) activeSec.classList.remove('hidden');
    if (activeTab) {
        activeTab.classList.remove('border-transparent', 'text-gray-400');
        activeTab.classList.add('border-gold-500', 'text-gold-400');
    }
};

let orders = [];

document.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = localStorage.getItem('scent_admin_logged_in');
    if (isLoggedIn === 'true') {
        document.getElementById('authOverlay').classList.add('hidden');
        renderAdmin();
    } else {
        document.getElementById('authOverlay').classList.remove('hidden');
    }
});

function checkAdminAuth() {
    const pass = document.getElementById('adminPass').value;
    if (pass === '1234') {
        localStorage.setItem('scent_admin_logged_in', 'true');
        document.getElementById('authOverlay').classList.add('hidden');
        renderAdmin();
    } else {
        alert('كلمة المرور غير صحيحة!');
    }
}

function adminLogout() {
    localStorage.removeItem('scent_admin_logged_in');
    document.getElementById('authOverlay').classList.remove('hidden');
}

function renderAdmin() {
    orders = JSON.parse(localStorage.getItem('scent_orders')) || [];
    renderOrdersTable();
    renderProductsAdmin();
    renderNotesAdmin();
    loadSettingsForm();
}

window.addEventListener('storage', () => {
    renderAdmin();
});

// --- Orders ---
function renderOrdersTable() {
    const tbody = document.getElementById('ordersTbody');
    if (!tbody) return;
    tbody.innerHTML = orders.map((o, idx) => `
        <tr class="hover:bg-white/5 transition cursor-pointer" onclick="openOrderDetail(${idx})">
            <td class="p-3 text-gold-400 font-bold">${o.id}</td>
            <td class="p-3 font-bold text-white">${o.name}</td>
            <td class="p-3">${o.phone}</td>
            <td class="p-3 font-bold text-white">${o.total}</td>
            <td class="p-3">
                <button onclick="event.stopPropagation(); openOrderDetail(${idx})" class="bg-gold-500/20 text-gold-400 border border-gold-500/30 px-3 py-1 rounded-lg text-[10px] font-bold">تفاصيل</button>
                <button onclick="event.stopPropagation(); delOrder(${idx})" class="text-red-400 p-1 mr-2"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function openOrderDetail(idx) {
    const o = orders[idx];
    if (!o) return;
    document.getElementById('modalOrderId').textContent = `تفاصيل الطلب: ${o.id}`;
    document.getElementById('modalOrderBody').innerHTML = `
        <div class="bg-black/60 p-4 rounded-xl border border-gray-800 space-y-2">
            <p><strong class="text-gold-400">العميل:</strong> ${o.name}</p>
            <p><strong class="text-gold-400">الهاتف:</strong> ${o.phone}</p>
            <p><strong class="text-gold-400">العنوان:</strong> ${o.address}</p>
            <p><strong class="text-gold-400">التاريخ:</strong> ${o.date || 'اليوم'}</p>
        </div>
        <div class="space-y-2 mt-4">
            <p class="font-bold text-white">المنتجات:</p>
            ${o.items ? o.items.map(i => `
                <div class="flex justify-between items-center bg-gray-900 p-3 rounded-xl border border-gray-800">
                    <span>${i.name} (×${i.qty})</span>
                    <span class="text-gold-400 font-bold">${i.price * i.qty} ج.م</span>
                </div>
            `).join('') : ''}
        </div>
        <div class="flex justify-between text-base font-black text-white pt-4 mt-2 border-t border-gray-800">
            <span>الإجمالي:</span>
            <span class="text-gold-400">${o.total}</span>
        </div>
    `;
    document.getElementById('orderDetailModal').classList.remove('hidden');
}

function closeOrderDetail() {
    document.getElementById('orderDetailModal').classList.add('hidden');
}

function delOrder(idx) {
    if (confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
        orders.splice(idx, 1);
        localStorage.setItem('scent_orders', JSON.stringify(orders));
        renderAdmin();
    }
}

// --- Products ---
function saveProduct(e) {
    e.preventDefault();
    let prods = JSON.parse(localStorage.getItem('scent_products')) || [];
    const id = document.getElementById('pId').value;
    
    const prodData = {
        name: document.getElementById('pName').value,
        price: parseInt(document.getElementById('pPrice').value),
        notes: document.getElementById('pNotes').value,
        image: document.getElementById('pImg').value
    };

    if (id) {
        // تعديل منتج موجود
        const index = prods.findIndex(p => p.id == id);
        if (index > -1) {
            prods[index] = { ...prods[index], ...prodData };
        }
        alert('تم تعديل المنتج بنجاح!');
    } else {
        // إضافة منتج جديد
        prods.push({ id: Date.now(), ...prodData });
        alert('تم إضافة المنتج بنجاح!');
    }

    localStorage.setItem('scent_products', JSON.stringify(prods));
    renderProductsAdmin();
    resetProductForm();
}

function renderProductsAdmin() {
    let prods = JSON.parse(localStorage.getItem('scent_products')) || [];
    const container = document.getElementById('admProductsList');
    if (!container) return;
    container.innerHTML = prods.map((p, idx) => `
        <div class="bg-black/60 p-4 rounded-xl border border-gray-800 space-y-2 text-xs flex justify-between items-center">
            <div class="flex items-center gap-3">
                <img src="${p.image}" class="w-10 h-10 rounded-lg object-cover">
                <div>
                    <p class="font-bold text-white">${p.name}</p>
                    <p class="text-gold-400 font-bold">${p.price} ج.م</p>
                </div>
            </div>
            <div class="flex gap-2">
                <button onclick="editProduct(${p.id})" class="text-blue-400 bg-blue-500/10 p-2 rounded-lg"><i class="fa-solid fa-pen"></i></button>
                <button onclick="delProduct(${idx})" class="text-red-400 bg-red-500/10 p-2 rounded-lg"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function editProduct(id) {
    let prods = JSON.parse(localStorage.getItem('scent_products')) || [];
    const p = prods.find(x => x.id == id);
    if (p) {
        document.getElementById('pId').value = p.id;
        document.getElementById('pName').value = p.name;
        document.getElementById('pPrice').value = p.price;
        document.getElementById('pNotes').value = p.notes;
        document.getElementById('pImg').value = p.image;
        
        document.getElementById('productFormTitle').textContent = 'تعديل المنتج';
        document.getElementById('productSubmitBtn').textContent = 'تحديث المنتج';
        document.getElementById('productSubmitBtn').classList.replace('gold-bg', 'bg-blue-500');
        document.getElementById('productSubmitBtn').classList.replace('text-black', 'text-white');
    }
}

function resetProductForm() {
    document.getElementById('productForm').reset();
    document.getElementById('pId').value = '';
    document.getElementById('productFormTitle').textContent = 'إضافة منتج جديد';
    const btn = document.getElementById('productSubmitBtn');
    btn.textContent = 'حفظ المنتج';
    btn.classList.replace('bg-blue-500', 'gold-bg');
    btn.classList.replace('text-white', 'text-black');
}

function delProduct(idx) {
    if(!confirm('تأكيد حذف المنتج؟')) return;
    let prods = JSON.parse(localStorage.getItem('scent_products')) || [];
    prods.splice(idx, 1);
    localStorage.setItem('scent_products', JSON.stringify(prods));
    renderProductsAdmin();
}

// --- Notes ---
function saveNote(e) {
    e.preventDefault();
    let notes = JSON.parse(localStorage.getItem('scent_notes')) || { base: [], heart: [], top: [] };
    const type = document.getElementById('nType').value;
    const name = document.getElementById('nName').value;
    
    if (!notes[type]) notes[type] = [];
    notes[type].push(name);
    
    localStorage.setItem('scent_notes', JSON.stringify(notes));
    renderNotesAdmin();
    e.target.reset();
    alert('تم إضافة النوتة بنجاح!');
}

function renderNotesAdmin() {
    let notes = JSON.parse(localStorage.getItem('scent_notes')) || { base: [], heart: [], top: [] };
    const container = document.getElementById('admNotesList');
    if (!container) return;
    
    let html = '';
    ['base', 'heart', 'top'].forEach(t => {
        const arr = notes[t] || [];
        html += `<div class="bg-black/60 p-4 rounded-xl border border-gray-800 space-y-2">
            <h4 class="font-bold text-gold-400 border-b border-gray-800 pb-2 mb-2">${t.toUpperCase()} Notes</h4>
            ${arr.map((n, idx) => `
                <div class="flex justify-between items-center text-gray-300 text-xs">
                    <span>${n}</span>
                    <button onclick="delNote('${t}', ${idx})" class="text-red-400"><i class="fa-solid fa-trash"></i></button>
                </div>
            `).join('')}
        </div>`;
    });
    container.innerHTML = html;
}

function delNote(type, idx) {
    let notes = JSON.parse(localStorage.getItem('scent_notes')) || { base: [], heart: [], top: [] };
    notes[type].splice(idx, 1);
    localStorage.setItem('scent_notes', JSON.stringify(notes));
    renderNotesAdmin();
}

// --- Settings ---
function loadSettingsForm() {
    let set = JSON.parse(localStorage.getItem('scent_settings')) || {
        brandName: "SCENT CRAFT",
        bannerTitle: "عطرك.. توقيع شخصيتك الفريد",
        bannerDesc: "ابتكر زجاجة عطرك الخاصة عبر المعمل التفاعلي، اختر النوتات العطرية الفاخرة، واحفر اسمك بالليزر على الزجاجة.",
        waPhone: "201000000000"
    };
    if (document.getElementById('setBrandName')) document.getElementById('setBrandName').value = set.brandName;
    if (document.getElementById('setBannerTitle')) document.getElementById('setBannerTitle').value = set.bannerTitle;
    if (document.getElementById('setBannerDesc')) document.getElementById('setBannerDesc').value = set.bannerDesc;
    if (document.getElementById('setWA')) document.getElementById('setWA').value = set.waPhone;
}

function saveStoreSettings(e) {
    e.preventDefault();
    let set = {
        brandName: document.getElementById('setBrandName').value,
        bannerTitle: document.getElementById('setBannerTitle').value,
        bannerDesc: document.getElementById('setBannerDesc').value,
        waPhone: document.getElementById('setWA').value
    };
    localStorage.setItem('scent_settings', JSON.stringify(set));
    alert('تم حفظ إعدادات المتجر! التغييرات ستظهر في الصفحة الرئيسية فوراً.');
}

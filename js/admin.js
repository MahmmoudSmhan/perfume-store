window.switchTab = function(tab) {
    const secOrders = document.getElementById('secTabOrders');
    const secProducts = document.getElementById('secTabProducts');
    const secNotes = document.getElementById('secTabNotes');
    const secSettings = document.getElementById('secTabSettings');

    if (secOrders) secOrders.classList.add('hidden');
    if (secProducts) secProducts.classList.add('hidden');
    if (secNotes) secNotes.classList.add('hidden');
    if (secSettings) secSettings.classList.add('hidden');

    document.querySelectorAll('[id^="tab_"]').forEach(el => {
        el.classList.remove('border-gold-500', 'text-gold-400');
        el.classList.add('border-transparent', 'text-gray-400');
    });

    if (tab === 'orders' && secOrders) {
        secOrders.classList.remove('hidden');
        document.getElementById('tab_orders')?.classList.add('border-gold-500', 'text-gold-400');
    }
    if (tab === 'products' && secProducts) {
        secProducts.classList.remove('hidden');
        document.getElementById('tab_products')?.classList.add('border-gold-500', 'text-gold-400');
    }
    if (tab === 'notes' && secNotes) {
        secNotes.classList.remove('hidden');
        document.getElementById('tab_notes')?.classList.add('border-gold-500', 'text-gold-400');
    }
    if (tab === 'settings' && secSettings) {
        secSettings.classList.remove('hidden');
        document.getElementById('tab_settings')?.classList.add('border-gold-500', 'text-gold-400');
    }
};

let orders = [];

// التحقق من الجلسة وتأكيد الدخول
document.addEventListener('DOMContentLoaded', () => {
    const isLoggedIn = localStorage.getItem('scent_admin_logged_in');
    if (isLoggedIn === 'true') {
        const overlay = document.getElementById('authOverlay');
        if (overlay) overlay.classList.add('hidden');
        renderAdmin();
    } else {
        const overlay = document.getElementById('authOverlay');
        if (overlay) overlay.classList.remove('hidden');
    }
});

function checkAdminAuth() {
    const passInput = document.getElementById('adminPass');
    const pass = passInput ? passInput.value : '';
    if (pass === '1234') {
        localStorage.setItem('scent_admin_logged_in', 'true');
        const overlay = document.getElementById('authOverlay');
        if (overlay) overlay.classList.add('hidden');
        renderAdmin();
    } else {
        alert('كلمة المرور غير صحيحة!');
    }
}

function adminLogout() {
    localStorage.removeItem('scent_admin_logged_in');
    const overlay = document.getElementById('authOverlay');
    if (overlay) overlay.classList.remove('hidden');
}

function renderAdmin() {
    orders = JSON.parse(localStorage.getItem('scent_orders')) || [];
    const visits = localStorage.getItem('scent_visits') || '1';

    if (document.getElementById('admCnt')) document.getElementById('admCnt').textContent = orders.length;
    if (document.getElementById('admVisits')) document.getElementById('admVisits').textContent = `${visits} زائر`;

    const tot = orders.reduce((a, b) => a + parseInt(b.total || 0), 0);
    if (document.getElementById('admRev')) document.getElementById('admRev').textContent = `${tot} ج.م`;
    if (document.getElementById('admPrf')) document.getElementById('admPrf').textContent = `${Math.round(tot * 0.45)} ج.م`;

    renderOrdersTable();
    renderProductsAdmin();
    renderNotesAdmin();
    loadSettingsForm();
}

// التحديث التلقائي الفوري بين التبويبات
window.addEventListener('storage', () => {
    renderAdmin();
});

// جدول الطلبات
function renderOrdersTable() {
    const tbody = document.getElementById('ordersTbody');
    if (!tbody) return;
    tbody.innerHTML = orders.map((o, idx) => `
        <tr class="hover:bg-white/5 transition cursor-pointer" onclick="openOrderDetail(${idx})">
            <td class="p-3 text-gold-400 font-bold">${o.id}</td>
            <td class="p-3 font-bold text-white">${o.name}</td>
            <td class="p-3">${o.phone}</td>
            <td class="p-3">${o.address}</td>
            <td class="p-3 font-bold text-white">${o.total}</td>
            <td class="p-3">
                <button onclick="event.stopPropagation(); openOrderDetail(${idx})" class="bg-gold-500/20 text-gold-400 border border-gold-500/30 px-3 py-1 rounded-lg text-[10px] font-bold">عرض التفاصيل</button>
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
            <p><strong class="text-gold-400">اسم العميل:</strong> ${o.name}</p>
            <p><strong class="text-gold-400">رقم الهاتف:</strong> ${o.phone}</p>
            <p><strong class="text-gold-400">العنوان:</strong> ${o.address}</p>
            <p><strong class="text-gold-400">تاريخ الطلب:</strong> ${o.date || 'اليوم'}</p>
        </div>
        <div class="space-y-2">
            <p class="font-bold text-white">المنتجات المطلوبة:</p>
            ${o.items ? o.items.map(i => `
                <div class="flex justify-between items-center bg-gray-900 p-3 rounded-xl border border-gray-800">
                    <span>${i.name} (عدد: ${i.qty})</span>
                    <span class="text-gold-400 font-bold">${i.price * i.qty} ج.م</span>
                </div>
            `).join('') : ''}
        </div>
        <div class="flex justify-between text-base font-black text-white pt-2 border-t border-gray-800">
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
    if (confirm('هل أنت تأكد من حذف هذا الطلب؟')) {
        orders.splice(idx, 1);
        localStorage.setItem('scent_orders', JSON.stringify(orders));
        renderAdmin();
    }
}

// إدارة المنتجات (Products DocType)
function saveProduct(e) {
    e.preventDefault();
    let prods = JSON.parse(localStorage.getItem('scent_products')) || [];
    prods.push({
        id: Date.now(),
        name: document.getElementById('pName').value,
        price: parseInt(document.getElementById('pPrice').value),
        notes: document.getElementById('pNotes').value,
        image: document.getElementById('pImg').value
    });
    localStorage.setItem('scent_products', JSON.stringify(prods));
    renderProductsAdmin();
    alert('تم إضافة المنتج وتحديث المتجر فوراً!');
}

function renderProductsAdmin() {
    let prods = JSON.parse(localStorage.getItem('scent_products')) || [];
    const container = document.getElementById('admProductsList');
    if (!container) return;
    container.innerHTML = prods.map((p, idx) => `
        <div class="bg-black/60 p-4 rounded-xl border border-gray-800 space-y-2 text-xs flex justify-between items-center">
            <div>
                <p class="font-bold text-white">${p.name}</p>
                <p class="text-gold-400 font-bold">${p.price} ج.م</p>
            </div>
            <button onclick="delProduct(${idx})" class="text-red-400"><i class="fa-solid fa-trash"></i></button>
        </div>
    `).join('');
}

function delProduct(idx) {
    let prods = JSON.parse(localStorage.getItem('scent_products')) || [];
    prods.splice(idx, 1);
    localStorage.setItem('scent_products', JSON.stringify(prods));
    renderProductsAdmin();
}

// إدارة نوتات المعمل (Notes DocType)
function saveNote(e) {
    e.preventDefault();
    let notes = JSON.parse(localStorage.getItem('scent_notes')) || { base: [], heart: [], top: [] };
    const type = document.getElementById('nType').value;
    const name = document.getElementById('nName').value;
    if (!notes[type]) notes[type] = [];
    notes[type].push(name);
    localStorage.setItem('scent_notes', JSON.stringify(notes));
    renderNotesAdmin();
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
            <h4 class="font-bold text-gold-400">${t.toUpperCase()} Notes</h4>
            ${arr.map((n, idx) => `
                <div class="flex justify-between items-center text-gray-300">
                    <span>${n}</span>
                    <button onclick="delNote('${t}', ${idx})" class="text-red-400 text-[10px]"><i class="fa-solid fa-trash"></i></button>
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

// إعدادات المتجر
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
    alert('تم حفظ إعدادات المتجر!');
}

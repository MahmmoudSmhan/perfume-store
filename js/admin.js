let orders = [];

window.switchTab = function(tab) {
    ['secTabOrders', 'secTabProducts', 'secTabNotes', 'secTabSettings'].forEach(id => document.getElementById(id)?.classList.add('hidden'));
    document.querySelectorAll('[id^="tab_"]').forEach(el => { el.classList.remove('border-gold-500', 'text-gold-400'); el.classList.add('border-transparent', 'text-gray-400'); });
    document.getElementById(`secTab${tab.charAt(0).toUpperCase() + tab.slice(1)}`)?.classList.remove('hidden');
    document.getElementById(`tab_${tab}`)?.classList.remove('border-transparent', 'text-gray-400');
    document.getElementById(`tab_${tab}`)?.classList.add('border-gold-500', 'text-gold-400');
};

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (session) {
        const { data: profile } = await window.supabaseClient.from('profiles').select('role').eq('id', session.user.id).single();
        if (profile && profile.role === 'admin') {
            document.getElementById('authOverlay').classList.add('hidden');
            renderAdmin();
        } else {
            await window.supabaseClient.auth.signOut();
            alert('هذا الحساب ليس لديه صلاحيات أدمن!');
        }
    }
});

async function checkAdminAuth(e) {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPass').value;
    const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
    if (error) return alert('بيانات الدخول خاطئة!');
    const { data: profile } = await window.supabaseClient.from('profiles').select('role').eq('id', data.user.id).single();
    if (profile && profile.role === 'admin') {
        document.getElementById('authOverlay').classList.add('hidden');
        renderAdmin();
    } else {
        await window.supabaseClient.auth.signOut();
        alert('أنت لست أدمن!');
    }
}

async function adminLogout() { await window.supabaseClient.auth.signOut(); window.location.reload(); }

async function renderAdmin() {
    await renderOrdersTable();
    await renderProductsAdmin();
    await renderNotesAdmin();
    await loadSettingsForm();
}

async function renderOrdersTable() {
    const { data, error } = await window.supabaseClient.from('orders').select(`*, order_items(*)`).order('created_at', { ascending: false });
    if (error) return;
    orders = data;
    document.getElementById('ordersTbody').innerHTML = orders.map((o, idx) => `
        <tr class="hover:bg-white/5 transition cursor-pointer" onclick="openOrderDetail(${idx})">
            <td class="p-3 text-gold-400 font-bold">${o.id}</td>
            <td class="p-3 font-bold text-white">${o.customer_name}</td>
            <td class="p-3">${o.phone}</td>
            <td class="p-3 font-bold text-white">${o.total} ج.م</td>
            <td class="p-3">
                <button onclick="event.stopPropagation(); openOrderDetail(${idx})" class="bg-gold-500/20 text-gold-400 border border-gold-500/30 px-3 py-1 rounded-lg text-[10px] font-bold">تفاصيل</button>
                <button onclick="event.stopPropagation(); delOrder('${o.id}')" class="text-red-400 p-1 mr-2"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function openOrderDetail(idx) {
    const o = orders[idx];
    document.getElementById('modalOrderId').textContent = `تفاصيل الطلب: ${o.id}`;
    document.getElementById('modalOrderBody').innerHTML = `
        <div class="bg-black/60 p-4 rounded-xl border border-gray-800 space-y-2">
            <p><strong class="text-gold-400">العميل:</strong> ${o.customer_name}</p>
            <p><strong class="text-gold-400">الهاتف:</strong> ${o.phone}</p>
            <p><strong class="text-gold-400">العنوان:</strong> ${o.address}</p>
        </div>
        <div class="space-y-2 mt-4">
            <p class="font-bold text-white">المنتجات:</p>
            ${o.order_items ? o.order_items.map(i => `<div class="flex justify-between items-center bg-gray-900 p-3 rounded-xl border border-gray-800"><span>${i.product_name} (×${i.quantity})</span><span class="text-gold-400 font-bold">${i.price * i.quantity} ج.م</span></div>`).join('') : ''}
        </div>
        <div class="flex justify-between text-base font-black text-white pt-4 mt-2 border-t border-gray-800"><span>الإجمالي:</span><span class="text-gold-400">${o.total}</span></div>
    `;
    document.getElementById('orderDetailModal').classList.remove('hidden');
}

async function delOrder(id) {
    if (confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
        await window.supabaseClient.from('orders').delete().eq('id', id);
        renderAdmin();
    }
}

async function saveProduct(e) {
    e.preventDefault();
    const btn = document.getElementById('productSubmitBtn');
    btn.textContent = 'جاري الحفظ...';
    const id = document.getElementById('pId').value;
    const file = document.getElementById('pImgFile').files[0];
    let image_url = null;

    if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await window.supabaseClient.storage.from('product-images').upload(fileName, file);
        if (uploadError) { alert('خطأ في رفع الصورة: ' + uploadError.message); btn.textContent = 'حفظ'; return; }
        const { data } = window.supabaseClient.storage.from('product-images').getPublicUrl(fileName);
        image_url = data.publicUrl;
    }

    const prodData = {
        name: document.getElementById('pName').value,
        price: parseInt(document.getElementById('pPrice').value),
        notes: document.getElementById('pNotes').value
    };
    if (image_url) prodData.image_url = image_url;

    if (id) {
        await window.supabaseClient.from('products').update(prodData).eq('id', id);
    } else {
        if(!image_url) { alert('يجب رفع صورة للمنتج!'); btn.textContent = 'حفظ'; return; }
        await window.supabaseClient.from('products').insert([prodData]);
    }
    
    resetProductForm();
    await renderProductsAdmin();
    alert('تم الحفظ بنجاح!');
}

async function renderProductsAdmin() {
    const { data: prods } = await window.supabaseClient.from('products').select('*').order('id', { ascending: false });
    document.getElementById('admProductsList').innerHTML = prods.map(p => `
        <div class="bg-black/60 p-4 rounded-xl border border-gray-800 space-y-2 text-xs flex justify-between items-center">
            <div class="flex items-center gap-3">
                <img src="${p.image_url}" class="w-10 h-10 rounded-lg object-cover">
                <div><p class="font-bold text-white">${p.name}</p><p class="text-gold-400 font-bold">${p.price} ج.م</p></div>
            </div>
            <div class="flex gap-2">
                <button onclick="editProduct(${p.id})" class="text-blue-400 bg-blue-500/10 p-2 rounded-lg"><i class="fa-solid fa-pen"></i></button>
                <button onclick="delProduct(${p.id})" class="text-red-400 bg-red-500/10 p-2 rounded-lg"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

async function editProduct(id) {
    const { data: p } = await window.supabaseClient.from('products').select('*').eq('id', id).single();
    if (p) {
        document.getElementById('pId').value = p.id;
        document.getElementById('pName').value = p.name;
        document.getElementById('pPrice').value = p.price;
        document.getElementById('pNotes').value = p.notes;
        document.getElementById('pImgFile').required = false;
        document.getElementById('productFormTitle').textContent = 'تعديل المنتج';
        document.getElementById('productSubmitBtn').textContent = 'تحديث المنتج';
    }
}

function resetProductForm() {
    document.getElementById('productForm').reset();
    document.getElementById('pId').value = '';
    document.getElementById('pImgFile').required = true;
    document.getElementById('productFormTitle').textContent = 'إضافة منتج جديد';
    document.getElementById('productSubmitBtn').textContent = 'حفظ المنتج';
}

async function delProduct(id) {
    if(!confirm('تأكيد حذف المنتج؟')) return;
    await window.supabaseClient.from('products').delete().eq('id', id);
    renderProductsAdmin();
}

async function saveNote(e) {
    e.preventDefault();
    const type = document.getElementById('nType').value;
    const name = document.getElementById('nName').value;
    await window.supabaseClient.from('perfume_notes').insert([{ type, name }]);
    document.getElementById('nName').value = '';
    await renderNotesAdmin();
    alert('تم إضافة النوتة!');
}

async function renderNotesAdmin() {
    const { data: notes } = await window.supabaseClient.from('perfume_notes').select('*');
    if(!notes) return;
    let html = '';
    ['base', 'heart', 'top'].forEach(t => {
        const arr = notes.filter(n => n.type === t);
        html += `<div class="bg-black/60 p-4 rounded-xl border border-gray-800 space-y-2">
            <h4 class="font-bold text-gold-400 border-b border-gray-800 pb-2 mb-2">${t.toUpperCase()}</h4>
            ${arr.map(n => `<div class="flex justify-between items-center text-gray-300 text-xs"><span>${n.name}</span><button onclick="delNote(${n.id})" class="text-red-400"><i class="fa-solid fa-trash"></i></button></div>`).join('')}
        </div>`;
    });
    document.getElementById('admNotesList').innerHTML = html;
}

async function delNote(id) {
    await window.supabaseClient.from('perfume_notes').delete().eq('id', id);
    renderNotesAdmin();
}

async function loadSettingsForm() {
    const { data: set } = await window.supabaseClient.from('settings').select('*').eq('id', 1).single();
    if (set) {
        document.getElementById('setBrandName').value = set.brand_name || '';
        document.getElementById('setBannerTitle').value = set.banner_title || '';
        document.getElementById('setBannerDesc').value = set.banner_desc || '';
        document.getElementById('setWA').value = set.wa_phone || '';
    }
}

async function saveStoreSettings(e) {
    e.preventDefault();
    const set = {
        brand_name: document.getElementById('setBrandName').value,
        banner_title: document.getElementById('setBannerTitle').value,
        banner_desc: document.getElementById('setBannerDesc').value,
        wa_phone: document.getElementById('setWA').value
    };
    await window.supabaseClient.from('settings').update(set).eq('id', 1);
    alert('تم حفظ الإعدادات!');
}

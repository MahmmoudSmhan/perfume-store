let orders = JSON.parse(localStorage.getItem('scent_orders')) || [];

function checkAdminAuth() {
    const pass = document.getElementById('adminPass').value;
    if (pass === '1234') {
        document.getElementById('authOverlay').classList.add('hidden');
        renderAdmin();
    } else {
        alert('كلمة المرور غير صحيحة!');
    }
}

function renderAdmin() {
    orders = JSON.parse(localStorage.getItem('scent_orders')) || [];
    const visits = localStorage.getItem('scent_visits') || '12';

    document.getElementById('admCnt').textContent = orders.length;
    document.getElementById('admVisits').textContent = `${visits} زائر`;
    
    const tot = orders.reduce((a, b) => a + parseInt(b.total), 0);
    document.getElementById('admRev').textContent = `${tot} ج.م`;
    document.getElementById('admPrf').textContent = `${Math.round(tot * 0.45)} ج.م`;

    document.getElementById('ordersTbody').innerHTML = orders.map((o, idx) => `
        <tr class="hover:bg-white/5 transition cursor-pointer" onclick="openOrderDetail(${idx})">
            <td class="p-3 text-gold-400 font-bold">${o.id}</td>
            <td class="p-3 font-bold text-white">${o.name}</td>
            <td class="p-3">${o.phone}</td>
            <td class="p-3">${o.address}</td>
            <td class="p-3 font-bold text-white">${o.total}</td>
            <td class="p-3 flex items-center gap-2">
                <button onclick="event.stopPropagation(); openOrderDetail(${idx})" class="bg-gold-500/20 text-gold-400 border border-gold-500/30 px-3 py-1 rounded-lg text-[10px] font-bold">عرض التفاصيل</button>
                <button onclick="event.stopPropagation(); delOrder(${idx})" class="text-red-400 p-1"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function openOrderDetail(idx) {
    const o = orders[idx];
    document.getElementById('modalOrderId').textContent = `تفاصيل الطلب: ${o.id}`;
    document.getElementById('modalOrderBody').innerHTML = `
        <div class="bg-black/60 p-4 rounded-xl border border-gray-800 space-y-2">
            <p><strong class="text-gold-400">اسم العميل:</strong> ${o.name}</p>
            <p><strong class="text-gold-400">رقم الهاتف:</strong> ${o.phone}</p>
            <p><strong class="text-gold-400">العنوان:</strong> ${o.address}</p>
            <p><strong class="text-gold-400">تاريخ الطلب:</strong> ${o.date || 'اليوم'}</p>
        </div>
        <div class="space-y-2">
            <p class="font-bold text-white">المنتجات والتركيبات المطلوبة:</p>
            ${o.items.map(i => `
                <div class="flex justify-between items-center bg-gray-900 p-3 rounded-xl border border-gray-800">
                    <span>${i.name} (${i.qty} قطع)</span>
                    <span class="text-gold-400 font-bold">${i.price * i.qty} ج.م</span>
                </div>
            `).join('')}
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

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
    document.getElementById('admCnt').textContent = orders.length;
    const tot = orders.reduce((a, b) => a + parseInt(b.total), 0);
    document.getElementById('admRev').textContent = `${tot} ج.م`;
    document.getElementById('admPrf').textContent = `${Math.round(tot * 0.45)} ج.م`;

    document.getElementById('ordersTbody').innerHTML = orders.map((o, idx) => `
        <tr>
            <td class="p-3 text-gold-400 font-bold">${o.id}</td>
            <td class="p-3 font-bold text-white">${o.name}</td>
            <td class="p-3">${o.phone}</td>
            <td class="p-3">${o.address}</td>
            <td class="p-3">${o.items.map(i => i.name).join(', ')}</td>
            <td class="p-3 font-bold text-white">${o.total}</td>
            <td class="p-3"><button onclick="delOrder(${idx})" class="text-red-400 hover:text-red-300"><i class="fa-solid fa-trash"></i></button></td>
        </tr>
    `).join('');
}

function delOrder(idx) {
    orders.splice(idx, 1);
    localStorage.setItem('scent_orders', JSON.stringify(orders));
    renderAdmin();
}

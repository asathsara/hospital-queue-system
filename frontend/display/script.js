const socket = io(SOCKET_SERVER);

socket.emit('register_role', 'display');

// Request initial data
socket.emit('get_display_data');

socket.on('display_data', (data) => {
    const tbody = document.querySelector('tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="px-4 py-4 border-t border-slate-200">${row.opdNumber}</td>
            <td class="px-4 py-2 border-t border-slate-200">${row.currentPatient}</td>
        `;
        tbody.appendChild(tr);
    });
});

socket.on('opd_list_updated', () => {
    socket.emit('get_display_data');
});



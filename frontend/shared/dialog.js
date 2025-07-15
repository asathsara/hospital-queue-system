function showDisconnectedDialog() {
    const modal = document.createElement('div');
    modal.id = 'disconnect-dialog';
    modal.innerHTML = `
    <div class="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-white text-center p-8 rounded-xl shadow-xl max-w-sm w-full">
        <h2 class="text-2xl font-bold text-black mb-4">Connection Lost</h2>
        <p class="mb-6 text-gray-700">You've been disconnected from the server.</p>
        <button id="reload-btn" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer">
          Reload
        </button>
      </div>
    </div>
  `;
    document.body.appendChild(modal);

    document.getElementById('reload-btn').addEventListener('click', () => {
        location.reload();
    });
}

socket.on('disconnect', (reason) => {
    console.warn('Disconnected:', reason);
    showDisconnectedDialog();
});



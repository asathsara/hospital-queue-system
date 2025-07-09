const socket = io(SOCKET_SERVER);

socket.on('queue_update', () => {
    fetch(`${SOCKET_SERVER}/api/display`)
        .then(res => res.json())
        .then(data => {
            // Update table with OPD numbers
            console.log(data);
        });
});


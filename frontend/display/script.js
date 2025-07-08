<script src="https://cdn.socket.io/4.0.1/socket.io.min.js"></script>

const socket = io('http://192.168.1.5:3000');

socket.on('queue_update', () => {
    fetch('http://192.168.1.5:3000/api/display')
        .then(res => res.json())
        .then(data => {
            // Update table with OPD numbers
            console.log(data);
        });
});


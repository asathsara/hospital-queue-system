<script src="https://cdn.socket.io/4.0.1/socket.io.min.js"></script>

const socket = io('http://192.168.1.5:3000'); // your LAN IP

socket.emit('next_patient', 1); // OPD 1

socket.on('patient_called', (patient) => {
    if (patient) {
        // Show patient info
        console.log('Next patient:', patient);
    } else {
        console.log('No waiting patient');
    }
});


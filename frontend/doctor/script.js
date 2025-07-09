const socket = io(SOCKET_SERVER); 

socket.emit('next_patient', 1); // OPD 1

socket.on('patient_called', (patient) => {
    if (patient) {
        // Show patient info
        console.log('Next patient:', patient);
    } else {
        console.log('No waiting patient');
    }
});


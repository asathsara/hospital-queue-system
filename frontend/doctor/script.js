const socket = io(SOCKET_SERVER);

console.log("Registering doctor...");
socket.emit('register_doctor');

console.log("Registering role...");
socket.emit('register_role', 'doctor');

console.log("Requesting next patient...");
socket.emit('next_patient', 1);



socket.on('opd_assigned', (opd) => {
    console.log("This doctor is OPD:", opd);
    // Save this if needed in a global variable
});

socket.emit('next_patient', 1); // OPD 1

socket.on('patient_called', (patient) => {
    if (patient) {
        // Show patient info
        console.log('Next patient:', patient);
    } else {
        console.log('No waiting patient');
    }
});


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

// Get available OPDs
socket.emit('get_available_opds');

socket.on('available_opds', (opds) => {
  console.log('Available OPDs:', opds);
  // Show a dropdown to select one and emit 'select_opd' with selected opdNumber
});

function selectOpd(opdNumber) {
  socket.emit('select_opd', opdNumber);
}

socket.on('opd_assigned', (opdNumber) => {
  console.log('OPD assigned:', opdNumber);
  // Proceed to your doctor UI with this opdNumber
});



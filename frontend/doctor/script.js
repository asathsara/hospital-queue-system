const socket = io(SOCKET_SERVER);

let selectedOpd = null;
let selectedDoctor = null;

// Register as doctor
socket.emit('register_role', 'doctor');

// 1 - Fetch available OPDs on load and when list updates
function fetchAvailableOpds() {
    socket.emit('get_available_opds');
}
// run initial load
fetchAvailableOpds();

// 1 - response for get_available_opds from server
socket.on('available_opds', (opds) => {

    const select = document.getElementById('opd-select');
    select.innerHTML = '';

    opds.forEach(opd => {
        const option = document.createElement('option');
        option.value = opd.opdNumber;
        option.text = `OPD ${opd.opdNumber} - Dr. ${opd.doctorName}`;
        select.appendChild(option);
    });
});

// 2 - Handle OPD selection
document.getElementById('select-opd-btn').onclick = () => {

    const select = document.getElementById('opd-select');
    const opdNumber = select.value;
    if (!opdNumber) return alert('Please select an OPD');

    // Find doctor name for display
    const selectedOption = select.options[select.selectedIndex].text;

    // Extract doctor name from selected option
    selectedDoctor = selectedOption.split(' - Dr. ')[1];

    socket.emit('select_opd', Number(opdNumber));
};

// 2 - When OPD is assigned to this doctor (response for select_opd)
socket.on('opd_assigned', (opdNumber) => {

    // set selected OPD
    selectedOpd = opdNumber;

    // Hide OPD selection UI
    document.getElementById('opd-select-section').style.display = 'none';

    // Show doctor UI
    document.getElementById('doctor-ui').style.display = 'flex';

    document.getElementById('doctor-title').textContent = `Dr. ${selectedDoctor} - OPD ${opdNumber}`;
});

// 2 - assign patient to this opd when opd is selecting (response for select_opd)
socket.on('patient_called', (patient) => {

    console.log('Patient called:', patient);
    if (patient?.opd === selectedOpd) {
        document.getElementById('current-patient').textContent = patient ? patient.patientId : '-';
        document.getElementById('current-patient-name').textContent = patient ? patient.name : '-';
        document.getElementById('current-patient-nic').textContent = patient ? patient.nic : '-';
    }
});

// 3 - new OPD added by admin
socket.on('opd_list_updated', fetchAvailableOpds);


socket.on('opd_unassigned', (opd) => {

    // 5 - opd unassigned, reload available OPDs

    // The backend already verifies and emits this event only to the doctor assigned to the OPD.
    // This frontend check adds an extra layer of safety to ensure we only reload if the unassigned OPD matches the one currently selected by this doctor
    if (opd.opdNumber === selectedOpd) {
        window.location.reload();

    }

});

// Handle error if OPD is not available
socket.on('opd_error', (msg) => {
    alert(msg);
    fetchAvailableOpds();
});

// Handle "Next Patient" button
document.getElementById('next-patient-btn').onclick = () => {
    if (selectedOpd) {
        
        // 6 - Emit event to get next patient for this OPD
        socket.emit('next_patient', selectedOpd);
        // Wait for queue_update to refresh UI
    }
};

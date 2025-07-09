const socket = io(SOCKET_SERVER);

let selectedOpd = null;
let selectedDoctor = null;

// Register as doctor
socket.emit('register_role', 'doctor');

// Fetch available OPDs on load and when list updates
function fetchAvailableOpds() {
    socket.emit('get_available_opds');
}
fetchAvailableOpds();

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

// Listen for OPD list updates (e.g., when another doctor claims or releases an OPD)
socket.on('opd_list_updated', fetchAvailableOpds);

// Handle OPD selection
document.getElementById('select-opd-btn').onclick = () => {
    const select = document.getElementById('opd-select');
    const opdNumber = select.value;
    if (!opdNumber) return alert('Please select an OPD');
    // Find doctor name for display
    const selectedOption = select.options[select.selectedIndex].text;
    selectedDoctor = selectedOption.split(' - Dr. ')[1];
    socket.emit('select_opd', Number(opdNumber));
};

// When OPD is assigned to this doctor
socket.on('opd_assigned', (opdNumber) => {
    selectedOpd = opdNumber;
    document.getElementById('opd-select-section').style.display = 'none';
    document.getElementById('doctor-ui').style.display = 'flex';
    document.getElementById('doctor-title').textContent = `Dr. ${selectedDoctor} - OPD ${opdNumber}`;
    document.getElementById('current-patient').textContent = '-';
});

// Handle error if OPD is not available
socket.on('opd_error', (msg) => {
    alert(msg);
    fetchAvailableOpds();
});

// Update current patient information
function updateCurrentPatient() {
    if (selectedOpd) {
        socket.emit('get_current_patient', selectedOpd);
    }
}

socket.on('current_patient', (patient) => {
    document.getElementById('current-patient').textContent = patient ? patient.number : '-';
    document.getElementById('current-patient-name').textContent = patient ? patient.name : '-';
    document.getElementById('current-patient-nic').textContent = patient ? patient.nic : '-';
});

// Handle "Next Patient" button
document.getElementById('next-patient-btn').onclick = () => {
    if (selectedOpd) {
        socket.emit('next_patient', selectedOpd);
        // Wait for queue_update to refresh UI
    }
};

// Update patient queue
socket.on('queue_update', updateCurrentPatient);

window.addEventListener('beforeunload', function () {
    if (selectedOpd) {
        socket.emit('opd_release', selectedOpd);
    }
});



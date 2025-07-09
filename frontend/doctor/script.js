const socket = io(SOCKET_SERVER);

socket.emit('register_role', 'doctor');

// Fetch available OPDs
socket.emit('get_available_opds');

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

document.getElementById('select-opd-btn').onclick = () => {
  const opdNumber = document.getElementById('opd-select').value;
  socket.emit('select_opd', Number(opdNumber));
};

socket.on('opd_assigned', (opdNumber) => {
  document.getElementById('opd-select-section').style.display = 'none';
  document.getElementById('doctor-ui').style.display = 'block';
  // Now show the doctor UI for this OPD
});



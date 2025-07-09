const { Server } = require('socket.io');
const registerPatientHandlers = require('./patientHandlers');
const registerOpdHandlers = require('./opdHandlers');
const registerDisplayHandlers = require('./displayHandlers');

const activeOPDs = new Map(); // Shared across handlers

function setupSocket(server) {
  const io = new Server(server, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {

    socket.on('register_role', (role) => {
      if (role === 'doctor') {
        // register doctor logic
        console.log(`New OPD connected: ${socket.id}`);
        // ...
      } else if (role === 'display') {
        console.log(`New Display connected: ${socket.id}`);
        // ...
      } else {
        console.log(`Unknown client connected: ${socket.id} with role ${role}`);
      }
    });

    // Share io and activeOPDs between modules
    registerPatientHandlers(io, socket);
    registerOpdHandlers(io, socket, activeOPDs);
    registerDisplayHandlers(io, socket);
  });

  return io;
}

module.exports = setupSocket;

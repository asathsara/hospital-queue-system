const { Server } = require('socket.io');
const registerPatientHandlers = require('./patientHandlers');
const { handlerFunction: registerOpdHandlers, unassignOpdById } = require('./opdHandlers');
const registerDisplayHandlers = require('./displayHandlers');
const Opd = require('../models/Opd');

const activeOPDs = new Map(); // Shared across handlers

function setupSocket(server) {
  const io = new Server(server, {
    cors: { origin: 'http://localhost:5173' },
    pingInterval: 5000,   // Send a ping every 5 seconds
    pingTimeout: 2000     // Disconnect if no pong within 2 seconds
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
    registerPatientHandlers(io, socket, activeOPDs);
    registerOpdHandlers(io, socket, activeOPDs);
    registerDisplayHandlers(io, socket);


    socket.on('disconnect', async () => {
      console.log("Socket disconnected:", socket.id);

      const opdNumber = activeOPDs.get(socket.id);
      if (opdNumber) {
        try {
          const opd = await Opd.findOne({ opdNumber });
          if (opd) {
            await unassignOpdById(opd._id, io, activeOPDs);
            console.log(`Auto-unassigned OPD ${opdNumber} on disconnect`);

            // 3 - Notify all doctors, display and opd list that an OPD is unassigned
            io.emit('opd_list_updated');
          }
        } catch (err) {
          console.error('Error auto-unassigning OPD:', err);
        } finally {
          activeOPDs.delete(socket.id); // cleanup
        }
      }
    });

  });
  //autoAssigner(io);

  return io;
}

module.exports = setupSocket;

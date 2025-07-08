const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/hospital-queue');

// Your Mongoose models go here
const Patient = require('./models/Patient');
const Opd = require('./models/Opd');

// Socket.io logic
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Admin adds patient
    socket.on('add_patient', async (data) => {
        const { name, nic, opd } = data;

        const latest = await Patient.find({ opd }).sort({ number: -1 }).limit(1);
        const number = latest.length ? latest[0].number + 1 : 1;

        const patient = await Patient.create({ name, nic, opd, number, status: 'waiting' });

        io.emit('queue_update'); // Notify all displays and doctors
    });

    // Doctor calls next
    socket.on('next_patient', async (opdNumber) => {
        const patient = await Patient.findOneAndUpdate(
            { opd: opdNumber, status: 'waiting' },
            { status: 'called' },
            { sort: { number: 1 }, new: true }
        );

        if (patient) {
            await Opd.findOneAndUpdate(
                { opdNumber },
                { currentNumber: patient.number },
                { upsert: true }
            );

            socket.emit('patient_called', patient); // Send to doctor
            io.emit('queue_update'); // Update displays
        } else {
            socket.emit('patient_called', null);
        }
    });
});

server.listen(3000, () => console.log('Server running on port 3000'));

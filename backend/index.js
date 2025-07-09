const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' },
});

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/hospital-queue', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

mongoose.connection.on('error', err => {
    console.error('❌ MongoDB connection error:', err);
});
mongoose.connection.once('open', () => {
    console.log('✅ MongoDB connected successfully');
});

// Mongoose models
const Patient = require('./models/Patient');
const Opd = require('./models/Opd');

// Serve static files
app.use('/static', express.static(path.join(__dirname, '../frontend/shared')));
app.use('/doctor', express.static(path.join(__dirname, '../frontend/doctor')));
app.use('/display', express.static(path.join(__dirname, '../frontend/display')));

// Track connected doctors and OPDs
const activeOPDs = new Map(); // Map<socket.id, opdNumber>
let nextOpd = 1;

// Helper: Generate Patient ID like P01, P02...
function generatePatientId(lastId) {
    if (!lastId) return 'P01';
    const num = parseInt(lastId.replace('P', '')) + 1;
    return 'P' + num.toString().padStart(2, '0');
}

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

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });

    // No automatic assignment here
    // Instead, doctors request available OPDs and then select one

    // On connection:
    socket.on('get_available_opds', async () => {
        const availableOpds = await Opd.find({ isAssigned: false });
        socket.emit('available_opds', availableOpds);
    });

    // When doctor selects an OPD to claim:
    socket.on('select_opd', async (opdNumber) => {
        const opd = await Opd.findOne({ opdNumber, isAssigned: false });
        if (!opd) {
            socket.emit('opd_error', 'OPD not available');
            return;
        }
        opd.isAssigned = true;
        await opd.save();
        activeOPDs.set(socket.id, opdNumber);
        socket.emit('opd_assigned', opdNumber);
        io.emit('opd_list_updated'); // notify all clients of update
    });


    // Remove doctor and OPD on disconnect
    socket.on('disconnect', async () => {
        if (activeOPDs.has(socket.id)) {
            const opdNumber = activeOPDs.get(socket.id);
            await Opd.findOneAndUpdate({ opdNumber }, { isAssigned: false });
            activeOPDs.delete(socket.id);
            io.emit('opd_list_updated');
            console.log(`Doctor disconnected, OPD ${opdNumber} freed`);
        }
        console.log(`Client disconnected: ${socket.id}`);
    });


    // Admin adds patient - assign to least busy active OPD
    socket.on('add_patient', async ({ name, nic }) => {
        try {
            const lastPatient = await Patient.findOne().sort({ createdAt: -1 });
            const newId = generatePatientId(lastPatient?.patientId);

            const patient = await Patient.create({
                patientId: newId,
                name,
                nic,
                opd: null, // Not assigned yet
                number: null, // Not assigned yet
                status: 'waiting',
            });

            io.emit('patient_list_updated'); // Notify all displays
            socket.emit('patient_added', patient);
        } catch (error) {
            console.error(error);
            socket.emit('error', 'Failed to add patient');
        }
    });


    // Doctor calls next patient
    socket.on('next_patient', async (opdNumber) => {
        try {
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
                io.emit('queue_update'); // Update all displays
            } else {
                socket.emit('patient_called', null);
            }
        } catch (error) {
            console.error('Error calling next patient:', error);
            socket.emit('error', 'Failed to call next patient');
        }
    });

    socket.on('get_patients', async () => {
         try {
            const patients = await Patient.find({});
            socket.emit('patients_list', patients);
        } catch (err) {
            console.error('Error fetching Patients:', err);
            socket.emit('patient_error', 'Failed to fetch Patients');
        }
    })

    socket.on('delete_patient', async (patientId) => {
        try {
            await Patient.deleteOne({ patientId });
            io.emit('patient_list_updated'); // Notify all clients to refresh
        } catch (error) {
            console.error('Error deleting patient:', error);
            socket.emit('patient_error', 'Failed to delete patient');
        }
    })

    socket.on('add_opd', async ({ opdNumber, doctorName }) => {

        try {
            const opd = await Opd.create({ opdNumber, doctorName, isAssigned: false });
            socket.emit('opd_added', opd); // Acknowledge to sender
            io.emit('opd_list_updated');   // Notify everyone (e.g., displays)

        } catch (error) {
            console.error('Failed to add OPD:', err);
            socket.emit('opd_error', 'Failed to add OPD');
        }
    });

    socket.on('get_opds', async () => {
        try {
            const opds = await Opd.find({});
            socket.emit('opds_list', opds);
        } catch (err) {
            console.error('Error fetching OPDs:', err);
            socket.emit('opd_error', 'Failed to fetch OPDs');
        }
    });

    // When display requests the current queue
    socket.on('get_display_data', async () => {
        const opds = await Opd.find({});
        const data = await Promise.all(opds.map(async (opd) => {
            // Find the latest called or waiting patient for this OPD
            const patient = await Patient.findOne({
                opd: opd.opdNumber,
                status: { $in: ['called', 'waiting'] }
            }).sort({ number: 1 });
            return {
                opdNumber: opd.opdNumber,
                currentPatient: patient ? patient.patientId : '-'
            };
        }));
        socket.emit('display_data', data);
    });

    
});

// Also, whenever queue_update happens, emit to all displays
function emitDisplayData() {
    io.emit('get_display_data');
}

io.on('connection', (socket) => {
    // ...existing code...

    // When a display connects, send initial data
    socket.on('register_role', (role) => {
        if (role === 'display') {
            socket.emit('get_display_data');
        }
    });

    // After patient added or next patient called, update displays
    // Replace io.emit('queue_update'); with:
    // emitDisplayData();

    // Example:
    // After adding patient:
    // emitDisplayData();

    // After calling next patient:
    // emitDisplayData();
});





server.listen(3000, () => console.log('Server running on port 3000'));

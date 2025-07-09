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

// Mongoose models
const Patient = require('./models/Patient');
const Opd = require('./models/Opd'); // If you want to keep track of OPD states

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

            // Get all currently assigned OPDs
            const assignedOpds = [...activeOPDs.values()];
            if (assignedOpds.length === 0) {
                socket.emit('error', 'No active OPDs');
                return;
            }

            const opdLoads = await Promise.all(
                assignedOpds.map(async (opd) => {
                    const count = await Patient.countDocuments({ opd, status: 'waiting' });
                    return { opd, count };
                })
            );

            const minOpd = opdLoads.reduce((min, curr) => (curr.count < min.count ? curr : min), opdLoads[0]);

            const latest = await Patient.find({ opd: minOpd.opd }).sort({ number: -1 }).limit(1);
            const number = latest.length ? latest[0].number + 1 : 1;

            const patient = await Patient.create({
                patientId: newId,
                name,
                nic,
                opd: minOpd.opd,
                number,
                status: 'waiting',
            });

            io.emit('queue_update');
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
});

server.listen(3000, () => console.log('Server running on port 3000'));

import  { useEffect, useState } from 'react';
import { useSocket } from '../contexts/socket';
const PatientQueue = () => {

    const socket = useSocket();
    const [patients, setPatients] = useState([]);
    useEffect(() => {
        // Request patients
        socket.emit('get_patients');

        // Receive patients
        socket.on('patients_list', setPatients);
        socket.on('patient_list_updated', () => socket.emit('get_patients'));

        // Optional: Clean up listener
        return () => {
            socket.off('patients_list', setPatients);
            socket.off('patient_list_updated');
        };
    }, [socket]);

    const handleDelete = (patientId) => {
        if (window.confirm('Are you sure you want to delete this patient?')) {
            socket.emit('delete_patient', patientId);
        }
    };

    return (
        <>
            <h2 className="text-3xl font-bold mb-4 mt-8">Patient Queue</h2>

            <table className="w-full text-left table-fixed border-separate border-spacing-0 border border-slate-200 rounded-md mt-8">
                <thead>
                    <tr className='p-8'>
                        <th className="px-4 py-2 border-t-0">ID</th>
                        <th className="px-4 py-2 border-t-0">Name</th>
                        <th className="px-4 py-2 border-t-0">NIC</th>
                        <th className="px-4 py-2 border-t-0">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {patients.map((patient) => (
                        <tr key={patient.patientId}>
                            <td className="px-4 py-4 border-t border-slate-200">{patient.patientId}</td>
                            <td className="px-4 py-2 border-t border-slate-200">{patient.name}</td>
                            <td className="px-4 py-2 border-t border-slate-200">{patient.nic}</td>
                            <td className="px-4 py-2 border-t border-slate-200 cursor-pointer" onClick={() => handleDelete(patient.patientId)}>Remove</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
};

export default PatientQueue;

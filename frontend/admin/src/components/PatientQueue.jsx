import { useEffect, useState } from 'react';
import { useSocket } from '../contexts/socket';
import { toast } from 'sonner';

const PatientQueue = () => {

    const socket = useSocket();
    const [patients, setPatients] = useState([]);
    useEffect(() => {
        // Request patients
        socket.emit('get_patients');

        // Receive patients
        socket.on('patients_list', setPatients);
        socket.on('patient_list_updated', () => socket.emit('get_patients'));

        // patient is assigned to opd 
        socket.on('opd_list_updated', () => socket.emit('get_patients'));

        // Optional: Clean up listener
        return () => {
            socket.off('patients_list', setPatients);
            socket.off('patient_list_updated');
            socket.off('opd_list_updated');

        };
    }, [socket]);

    const handleDelete = (patientId) => {
        toast('Delete this patient?', {
            description: 'This action cannot be undone.',
            action: {
                label: 'Delete',
                onClick: () => {
                    socket.emit('delete_patient', patientId);
                    toast.success('Patient deleted');
                },
            },
        });
    };

    const handleDeleteAll = () => {
        toast('Delete all patients?', {
            description: 'All patient records will be permanently removed.',
            action: {
                label: 'Delete All',
                onClick: () => {
                    socket.emit('delete_all_patients');
                    toast.success('All patients deleted');
                },
            },
        });
    };

    // Helper function
    function getStatusColor(status) {
        switch (status) {
            case 'waiting':
                return 'text-yellow-600';
            case 'called':
                return 'text-blue-600';
            case 'done':
                return 'text-green-600';
            default:
                return 'text-gray-600';
        }
    }

    return (
        <>
            <div className="flex items-center justify-between mt-8 mb-4">
                <h2 className="text-3xl font-bold">Patient Queue</h2>
                <button
                    className="bg-red-500 text-white px-2 py-1 rounded text-sm ml- cursor-pointer"
                    onClick={handleDeleteAll}
                >
                    Delete All
                </button>
            </div>
            <table className="w-full text-left table-fixed border-separate border-spacing-0 border border-slate-200 rounded-md mt-8">
                <thead>
                    <tr className='p-8'>
                        <th className="px-4 py-2 border-t-0">ID</th>
                        <th className="px-4 py-2 border-t-0">Name</th>
                        <th className="px-4 py-2 border-t-0">NIC</th>
                        <th className="px-4 py-2 border-t-0">Status</th>
                        <th className="px-4 py-2 border-t-0">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {patients.map((patient) => (
                        <tr key={patient.patientId}>
                            <td className="px-4 py-4 border-t border-slate-200">{patient.patientId}</td>
                            <td className="px-4 py-2 border-t border-slate-200">{patient.name}</td>
                            <td className="px-4 py-2 border-t border-slate-200">{patient.nic}</td>
                            <td className={`px-4 py-2 border-t border-slate-200 ${getStatusColor(patient.status)}`}>
                                {patient.status}
                            </td>
                            <td className="px-4 py-2 border-t border-slate-200">
                                <button
                                    className="bg-red-400 hover:bg-red-500 text-white px-3 py-1 rounded text-sm cursor-pointer w-full"
                                    onClick={() => handleDelete(patient.patientId)}
                                >
                                    Remove
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
};

export default PatientQueue;

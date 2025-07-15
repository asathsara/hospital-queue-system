import { useState } from 'react';
import { useSocket } from '../contexts/socket';
import { toast } from 'sonner';

const AddOpd = () => {
    const socket = useSocket();
    const [opdNumber, setOpdNumber] = useState('');
    const [doctorName, setDoctorName] = useState('');

    const handleSubmit = async () => {
        if (!opdNumber || !doctorName) {
            toast.error('Please fill in all fields');
            return;
        }

        socket.emit('add_opd', { opdNumber, doctorName });

        toast.success(`OPD "${opdNumber}" for Dr. ${doctorName} added`);
        setOpdNumber('');
        setDoctorName('');
    };

    return (
        <div className='p-6'>
            <h2 className="text-lg font-semibold mb-4">Add New OPD</h2>
            <div className="mt-4">
                <label className="block text-sm font-medium mb-1">OPD Number</label>
                <input
                    type="text"
                    placeholder="Enter OPD number"
                    value={opdNumber}
                    onChange={(e) => setOpdNumber(e.target.value)}
                    className="w-full border border-gray-300 p-2 rounded-md"
                />
            </div>
            <div className="mt-4">
                <label className="block text-sm font-medium mb-1">Doctor Name</label>
                <input
                    type="text"
                    placeholder="Enter doctor name"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    className="w-full border border-gray-300 p-2 rounded-md"
                />
            </div>
            <button
                onClick={handleSubmit}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-400 w-full mt-6 cursor-pointer"
            >
                Add OPD
            </button>
        </div>
    );
};

export default AddOpd;
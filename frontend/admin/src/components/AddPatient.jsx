import { useState } from 'react';
import { useSocket } from '../contexts/socket';
import { toast } from 'sonner';

const AddPatient = () => {
  const socket = useSocket();
  const [name, setName] = useState('');
  const [nic, setNic] = useState('');

  socket.emit('register_role', 'doctor');

  const handleSubmit = () => {
    if (!name || !nic) {
      toast.error('Please fill in all fields');
      return;
    }

    socket.emit('add_patient', { name, nic });

    toast.success(`Patient "${name}" added successfully`);
    setName('');
    setNic('');
  };

  return (
    <div className='p-6'>
      <h2 className="text-lg font-semibold mb-4">Add New Patient</h2>

      <div className="mt-4">
        <label className="block text-sm font-medium mb-1">Patient Name</label>
        <input
          type="text"
          placeholder="Enter patient name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium mb-1">Patient NIC</label>
        <input
          type="text"
          placeholder="Enter patient NIC"
          value={nic}
          onChange={(e) => setNic(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        onClick={handleSubmit}
        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-400 w-full mt-6"
      >
        Add Patient
      </button>
    </div>
  );
};

export default AddPatient;

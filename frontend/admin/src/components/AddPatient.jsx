import React, { useState} from 'react';
import { io } from 'socket.io-client';

const socket = io('http://192.168.1.5:3000'); // replace with your LAN IP

const AddPatient = () => {
  const [name, setName] = useState('');
  const [nic, setNic] = useState('');
  const [opd, setOpd] = useState(1); // Default to OPD 1

  const handleSubmit = () => {
    if (!name || !nic) {
      alert('Please fill in all fields');
      return;
    }

    socket.emit('add_patient', {
      name,
      nic,
      opd: parseInt(opd)
    });

    alert(`Patient "${name}" added to OPD ${opd}`);
    setName('');
    setNic('');
    setOpd(1);
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

      <div className="mt-4">
        <label className="block text-sm font-medium mb-1">Select OPD</label>
        <select
          value={opd}
          onChange={(e) => setOpd(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {[...Array(10)].map((_, i) => (
            <option key={i} value={i + 1}>OPD {i + 1}</option>
          ))}
        </select>
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

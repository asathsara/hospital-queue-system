import React, { useEffect, useState } from 'react';
import { useSocket } from '../contexts/socket';

const OpdList = () => {
  const socket = useSocket();
  const [opds, setOpds] = useState([]);

  useEffect(() => {
    // Request OPDs
    socket.emit('get_opds');

    // Receive OPDs
    socket.on('opds_list', setOpds);
    socket.on('opd_list_updated', () => socket.emit('get_opds'));

    // Optional: Clean up listener
    return () => {
      socket.off('opds_list', setOpds);
      socket.off('opd_list_updated');
    };
  }, [socket]);

  const handleDelete = (opdId) => {
        if (window.confirm('Are you sure you want to delete this OPD?')) {
            socket.emit('delete_opd', opdId);
        }
  };
  
  const UnAssignOpd = (opdId) => {
    if (window.confirm('Are you sure you want to unassign this OPD?')) {
      socket.emit('unassign_opd', opdId);
    }
  };

  return (
    <>
      <h2 className="text-3xl font-bold mb-4 mt-8">OPD List</h2>
      <table className="w-full text-left table-fixed border-separate border-spacing-0 border border-slate-200 rounded-md mt-8">
        <thead>
          <tr className='p-8'>
            <th className="px-4 py-2 border-t-0">OPD Number</th>
            <th className="px-4 py-2 border-t-0">Doctor Name</th>
            <th className="px-4 py-2 border-t-0">Assigned</th>
          </tr>
        </thead>
        <tbody>
          {opds.map((opd) => (
            <tr key={opd._id}>
              <td className="px-4 py-4 border-t border-slate-200">{opd.opdNumber}</td>
              <td className="px-4 py-2 border-t border-slate-200">{opd.doctorName}</td>
              <td className="px-4 py-2 border-t border-slate-200">{opd.isAssigned ? 'Yes' : 'No'}</td>
              <td className="px-4 py-2 border-t border-slate-200 cursor-pointer" onClick={() => UnAssignOpd(opd._id)}>UnAssign</td>
              <td className="px-4 py-2 border-t border-slate-200 cursor-pointer" onClick={() => handleDelete(opd._id)}>Remove</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default OpdList;

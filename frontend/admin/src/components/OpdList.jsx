import React, { useEffect, useState } from 'react';
import { useSocket } from '../contexts/socket';

const OpdList = () => {
  const socket = useSocket();
  const [opds, setOpds] = useState([]);

  useEffect(() => {
    //  4 - Request OPDs
    socket.emit('get_opds');

    // 4 - Receive OPDs
    socket.on('opds_list', setOpds);

    // 3 - opd list updated maybe added or removed
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

   const handleDeleteAll = () => {
        if (window.confirm('Are you sure you want to delete all OPDs?')) {
            socket.emit('delete_all_opds');
        }
    };

  return (
    <>
      <div className="flex items-center justify-between mt-8 mb-4">
                <h2 className="text-3xl font-bold">OPD List</h2>
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

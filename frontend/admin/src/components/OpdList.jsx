import React, { useEffect, useState } from 'react';
import { useSocket } from '../contexts/socket';
import { toast } from 'sonner';

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
    toast('Delete this OPD?', {
      description: 'This action cannot be undone.',
      action: {
        label: 'Delete',
        onClick: () => {
          socket.emit('delete_opd', opdId);
          toast.success('OPD deleted');
        },
      },
    });
  };

  const UnAssignOpd = (opdId) => {
    toast('Unassign this OPD?', {
      description: 'Patients will be removed from this OPD.',
      action: {
        label: 'Unassign',
        onClick: () => {
          socket.emit('unassign_opd', opdId);
          toast.success('OPD unassigned');
        },
      },
    });
  };

  const handleDeleteAll = () => {
    toast('Delete all OPDs?', {
      description: 'This cannot be undone.',
      action: {
        label: 'Delete All',
        onClick: () => {
          socket.emit('delete_all_opds');
          toast.success('All OPDs deleted');
        },
      },
    });
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
              <td className="px-4 py-2 border-t border-slate-200">
                <button
                  className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded text-sm cursor-pointer w-full"
                  onClick={() => UnAssignOpd(opd._id)}
                >
                  UnAssign
                </button>
              </td>
              <td className="px-4 py-2 border-t border-slate-200">
                <button
                  className="bg-red-400 hover:bg-red-500 text-white px-3 py-1 rounded text-sm cursor-pointer w-full"
                  onClick={() => handleDelete(opd._id)}
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

export default OpdList;

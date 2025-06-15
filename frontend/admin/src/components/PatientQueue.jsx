import React from 'react'

const PatientQueue = () => {
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
                    <tr>
                        <td className="px-4 py-4 border-t border-slate-200">12345</td>
                        <td className="px-4 py-2 border-t border-slate-200 ">Sophia Clark</td>
                        <td className="px-4 py-2 border-t border-slate-200 ">Cardiology</td>
                        <td className="px-4 py-2 border-t border-slate-200  cursor-pointer">Remove</td>
                    </tr>
                </tbody>
                
            </table>



        </>
    )
}

export default PatientQueue
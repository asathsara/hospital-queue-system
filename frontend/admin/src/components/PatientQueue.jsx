import React from 'react'

const PatientQueue = () => {
    return (
        <>
            <h2 className="text-lg font-semibold mb-4 mt-8">Patient Queue</h2>

            <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
                <thead>
                    <tr className="border-b border-slate-100">
                        <th className="pb-2 px-4">Name</th>
                        <th className="pb-2 px-4">ID</th>
                        <th className="pb-2 px-4">OPD</th>
                        <th className="pb-2 px-4">Action</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="border-b border-slate-100">
                        <td className="py-2 px-4">Sophia Clark</td>
                        <td className="py-2 px-4 text-blue-600">12345</td>
                        <td className="py-2 px-4 text-blue-600">Cardiology</td>
                        <td className="py-2 px-4 text-blue-600 cursor-pointer">Remove</td>
                    </tr>
                </tbody>
            </table>
        </>
    )
}

export default PatientQueue
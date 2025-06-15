import React from 'react'

const AddPatient = () => {
    return (
        <div className='p-6'>
            <h2 className="text-lg font-semibold mb-4">Add New Patient</h2>

            <div className="mt-8">
                <label className="block text-sm font-medium mb-1">Patient Name</label>
                <input
                    type="text"
                    placeholder="Enter patient name"
                    className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                />
            </div>

            <div className="mt-8">
                <label className="block text-sm font-medium mb-1">Patient NIC</label>
                <input
                    type="text"
                    placeholder="Enter patient NIC"
                    className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mt-2"
                />
            </div>

            <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-400 w-full mt-8 cursor-pointer">
                Add Patient
            </button>
        </div>
    )
}

export default AddPatient
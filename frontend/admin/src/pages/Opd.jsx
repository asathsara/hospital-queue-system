import React from 'react'
import AddOpd from '../components/AddOpd'
import OpdList from '../components/OpdList'

const OpdPage = () => {
    return (
        <>
            <div className='flex flex-wrap md:flex-nowrap'>
                <div className='w-full md:w-2/5 pr-0 md:pr-6 mb-4 md:mb-0'>
                    <AddOpd />
                </div>

                <div className='w-full md:w-3/5'>
                    <OpdList />
                </div>
            </div>
        </>
    )
}

export default OpdPage
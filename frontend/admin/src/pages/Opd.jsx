import React from 'react'
import AddOpd from '../components/AddOpd'
import OpdList from '../components/OpdList'

const OpdPage = () => {
    return (
        <>
            <div className='w-2/5 pr-6'>
                <AddOpd />
            </div>

            <div className='w-3/5'>
                <OpdList />
            </div>
        </>
    )
}

export default OpdPage
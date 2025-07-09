import AddPatient from '../components/AddPatient'
import PatientQueue from '../components/PatientQueue'

const PatientPage = () => {
    return (
        <>
            <div className='w-2/5 pr-6'>
                <AddPatient />
            </div>

            <div className='w-3/5'>
                <PatientQueue />
            </div>
        </>
    )
}

export default PatientPage
import AddPatient from '../components/AddPatient'
import PatientQueue from '../components/PatientQueue'

const PatientPage = () => {
    return (
        <>
            <div className="flex flex-wrap md:flex-nowrap">
                <div className="w-full md:w-2/5 pr-0 md:pr-6 mb-4 md:mb-0">
                    <AddPatient />
                </div>
                <div className="w-full md:w-3/5">
                    <PatientQueue />
                </div>
            </div>
        </>
    )
}

export default PatientPage
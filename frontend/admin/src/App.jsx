
import AddPatient from './components/AddPatient'
import Navbar from './components/Navbar'
import PatientQueue from './components/PatientQueue'
function App() {

  return (
    <div className='font-lexend'>
      <Navbar />
      
      <div className="container mx-auto p-4 flex">

        <div className='w-2/5 pr-6'>
          <AddPatient />
        </div>

        <div className='w-3/5'>
          <PatientQueue />
        </div>
      </div>
    </div>
  )
}

export default App

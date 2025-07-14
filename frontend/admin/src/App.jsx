import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar'
import PatientPage from './pages/Patient';
import OpdPage from './pages/Opd';
import { Toaster } from 'sonner';
function App() {

  return (
    <Router>
      <div className='font-lexend'>
        <Navbar />

        <div className="container mx-auto p-4 flex">
          <Routes>

            <Route path="/" element={<PatientPage />} />
            <Route path="/add-opd" element={<OpdPage />} />

          </Routes>
        </div>
      </div>
      <Toaster />
    </Router>
  )
}

export default App

import { Link } from 'react-router-dom';


export default function Navbar() {
  return (
    <header className="bg-white border-b border-gray-100 p-4">
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        <h1 className="text-xl font-bold text-gray-800">Patient Queue</h1>
        <nav>
          <ul className="flex space-x-4">
            <li><Link to="/" className="text-lg font-bold text-gray-600">Add Patient</Link></li>
            <li><Link to="/add-opd" className="text-lg font-bold text-gray-600">Add OPD</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

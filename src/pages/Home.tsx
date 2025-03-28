import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-svh" style={{ backgroundColor: '#BAA68E' }}>
      <header style={{ backgroundColor: '#5E503F' }} className="p-4">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <h1 className="text-white text-2xl font-bold">Health Tracker</h1>
          
          <div className="flex items-center space-x-6">
            <button 
              onClick={() => navigate('/')}
              className="text-white hover:text-gray-200"
            >
              Journal
            </button>
            <button 
              onClick={() => navigate('/calendar')}
              className="text-white hover:text-gray-200"
            >
              Calendar
            </button>
            <button 
              onClick={() => navigate('/resources')}
              className="text-white hover:text-gray-200"
            >
              Resources
            </button>
            
            {user ? (
              <button 
                onClick={() => navigate('/dashboard')}
                className="text-white hover:text-gray-200"
              >
                Dashboard
              </button>
            ) : (
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => navigate('/login')}
                  className="text-white hover:text-gray-200"
                >
                  Login
                </button>
                <button 
                  onClick={() => navigate('/register')}
                  className="text-white hover:text-gray-200 border border-white px-3 py-1 rounded"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}
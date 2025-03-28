import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

export default function Header() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    const isActive = (path: string) => {
        return location.pathname === path;
    };

    const linkStyle = (path: string) => {
        return `text-white px-3 py-1 rounded transition-colors ${
            isActive(path) 
                ? 'bg-[#834D4D]' 
                : 'hover:text-gray-200'
        }`;
    };

    return (
        <header style={{ backgroundColor: '#5E503F' }} className="p-4">
            <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
                <h1 className="text-white text-2xl font-bold">Health Tracker</h1>
                
                <div className="flex items-center space-x-6">
                    <button 
                        onClick={() => navigate('/')}
                        className={linkStyle('/')}
                    >
                        Journal
                    </button>
                    <button 
                        onClick={() => navigate('/calendar')}
                        className={linkStyle('/calendar')}
                    >
                        Calendar
                    </button>
                    <button 
                        onClick={() => navigate('/resources')}
                        className={linkStyle('/resources')}
                    >
                        Resources
                    </button>
                    
                    {user ? (
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className={linkStyle('/dashboard')}
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
    );
}
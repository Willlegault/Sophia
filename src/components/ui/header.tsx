import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import SophiaLogo from '@/images/Sophia_Logo.png';

export default function Header() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    const isActive = (path: string) => {
        return location.pathname === path;
    };

    const linkStyle = (path: string) => {
        return `text-[#1E1E1E] px-3 py-1 rounded transition-colors ${
            isActive(path) 
                ? 'bg-[#834D4D] text-white' 
                : 'hover:text-gray-600'
        }`;
    };

    return (
        <header style={{ backgroundColor: '#5E503F' }} className="p-4">
            <div className="flex justify-between items-center">
                <div className="flex-1">
                    <img 
                        src={SophiaLogo} 
                        alt="Sophia Logo" 
                        className="h-12 ml-2"
                        onClick={() => navigate('/')}
                        style={{ cursor: 'pointer' }}
                    />
                </div>
                
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
                                className="text-[#1E1E1E] hover:text-gray-600"
                            >
                                Login
                            </button>
                            <button 
                                onClick={() => navigate('/register')}
                                className="text-[#1E1E1E] hover:text-gray-600 border border-[#1E1E1E] px-3 py-1 rounded"
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
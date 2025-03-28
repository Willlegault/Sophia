import Header from '@/components/ui/header';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Home() {


  return (
    <div className="min-h-svh" style={{ backgroundColor: '#BAA68E' }}>
      <Header />
    </div>
  );
}
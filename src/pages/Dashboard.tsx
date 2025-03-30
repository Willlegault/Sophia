import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import Header from '@/components/ui/header';

interface HealthMetric {
  id: number;
  created_at: string;
  user_id: string;
  weight: number;
  steps: number;
  blood_pressure_systolic: number;
  blood_pressure_diastolic: number;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [newMetric, setNewMetric] = useState({
    weight: '',
    steps: '',
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch metrics
  const fetchMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from('health_metrics')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMetrics(data || []);
    } catch (err) {
      setError('Error fetching metrics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Add new metric
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('health_metrics').insert([
        {
          user_id: user?.id,
          weight: parseFloat(newMetric.weight),
          steps: parseInt(newMetric.steps),
          blood_pressure_systolic: parseInt(newMetric.blood_pressure_systolic),
          blood_pressure_diastolic: parseInt(newMetric.blood_pressure_diastolic),
        },
      ]);

      if (error) throw error;
      
      // Reset form and refresh data
      setNewMetric({
        weight: '',
        steps: '',
        blood_pressure_systolic: '',
        blood_pressure_diastolic: '',
      });
      fetchMetrics();
    } catch (err) {
      setError('Error adding metric');
      console.error(err);
    }
  };

  // Delete metric
  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase
        .from('health_metrics')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchMetrics();
    } catch (err) {
      setError('Error deleting metric');
      console.error(err);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      setError('Error signing out');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [user]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-svh" style={{ backgroundColor: '#BAA68E' }}>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-[#1E1E1E] mb-6">Dashboard</h1>
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Health Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Add new metric form */}
        <form onSubmit={handleSubmit} className="mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="number"
              placeholder="Weight (kg)"
              value={newMetric.weight}
              onChange={(e) => setNewMetric({ ...newMetric, weight: e.target.value })}
              className="border p-2 rounded"
              step="0.1"
              required
            />
            <input
              type="number"
              placeholder="Steps"
              value={newMetric.steps}
              onChange={(e) => setNewMetric({ ...newMetric, steps: e.target.value })}
              className="border p-2 rounded"
              required
            />
            <input
              type="number"
              placeholder="Blood Pressure (Systolic)"
              value={newMetric.blood_pressure_systolic}
              onChange={(e) => setNewMetric({ ...newMetric, blood_pressure_systolic: e.target.value })}
              className="border p-2 rounded"
              required
            />
            <input
              type="number"
              placeholder="Blood Pressure (Diastolic)"
              value={newMetric.blood_pressure_diastolic}
              onChange={(e) => setNewMetric({ ...newMetric, blood_pressure_diastolic: e.target.value })}
              className="border p-2 rounded"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add Entry
          </button>
        </form>

        {/* Charts */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Weight Trend</h2>
          <LineChart width={800} height={300} data={metrics}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="created_at" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="weight" stroke="#8884d8" />
          </LineChart>
        </div>

        {/* Data table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Weight (kg)</th>
                <th className="px-4 py-2">Steps</th>
                <th className="px-4 py-2">Blood Pressure</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((metric) => (
                <tr key={metric.id}>
                  <td className="border px-4 py-2">
                    {new Date(metric.created_at).toLocaleDateString()}
                  </td>
                  <td className="border px-4 py-2">{metric.weight}</td>
                  <td className="border px-4 py-2">{metric.steps}</td>
                  <td className="border px-4 py-2">
                    {metric.blood_pressure_systolic}/{metric.blood_pressure_diastolic}
                  </td>
                  <td className="border px-4 py-2">
                    <button
                      onClick={() => handleDelete(metric.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

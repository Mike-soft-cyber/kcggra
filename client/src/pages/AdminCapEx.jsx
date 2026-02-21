import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import API from '@/api';
import { Plus, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminCapEx() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    totalRaised: 0,
    totalTarget: 0,
    overallProgress: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await API.get('/admin/capex');
      setProjects(response.data.projects || []);
      setStats(response.data.stats || stats);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      toast.error('Failed to load CapEx projects');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a4d4d]"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">CapEx Tracker</h1>
            <p className="text-gray-600 mt-1">Capital expenditure campaigns and progress</p>
          </div>
          <Button
            onClick={() => navigate('/admin/projects')}
            className="bg-[#1a4d4d] hover:bg-[#0f3333] flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Campaign
          </Button>
        </div>

        {/* Overall Progress Card */}
        <div className="bg-gradient-to-r from-[#1a4d4d] to-[#0f3333] rounded-xl p-8 text-white mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-gray-300 text-sm mb-2">Total Raised Across All Campaigns</p>
              <h2 className="text-4xl font-bold">
                KES {(stats.totalRaised / 1000000).toFixed(2)}M
              </h2>
            </div>
            <div>
              <p className="text-gray-300 text-sm mb-2">Combined Target</p>
              <h2 className="text-4xl font-bold">
                KES {(stats.totalTarget / 1000000).toFixed(1)}M
              </h2>
            </div>
            <div>
              <p className="text-gray-300 text-sm mb-2">Overall Progress</p>
              <div className="flex items-center gap-4">
                <h2 className="text-4xl font-bold">{stats.overallProgress}%</h2>
                <div className="flex-1">
                  <div className="w-full bg-white/20 rounded-full h-4">
                    <div
                      className="bg-white h-4 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(stats.overallProgress, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.length === 0 ? (
            <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No CapEx Campaigns Yet</h3>
              <p className="text-gray-600 mb-6">Create your first capital expenditure campaign to start fundraising</p>
              <Button
                onClick={() => navigate('/admin/projects')}
                className="bg-[#1a4d4d] hover:bg-[#0f3333]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </div>
          ) : (
            projects.map((project) => {
              const progressPercent = ((project.currentAmount / project.targetAmount) * 100).toFixed(0);

              return (
                <div
                  key={project._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition cursor-pointer"
                  onClick={() => navigate(`/admin/projects/${project._id}`)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {project.projectName}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {project.description}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        KES {project.currentAmount.toLocaleString()} raised
                      </span>
                      <span className="font-bold text-[#1a4d4d]">{progressPercent}%</span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-[#1a4d4d] to-[#0f3333] h-3 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(progressPercent, 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{project.contributors?.length || 0} contributors</span>
                      <span>
                        Target: KES {(project.targetAmount / 1000000).toFixed(2)}M
                      </span>
                    </div>
                  </div>

                  {/* Contributors Preview */}
                  {project.contributors && project.contributors.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-2">Recent Contributors</p>
                      <div className="flex items-center gap-2">
                        {project.contributors.slice(0, 5).map((contributor, index) => (
                          <div
                            key={index}
                            className="w-8 h-8 rounded-full bg-[#1a4d4d] text-white flex items-center justify-center text-xs font-bold"
                            title={contributor.user_id?.username || 'Anonymous'}
                          >
                            {contributor.user_id?.username?.charAt(0).toUpperCase() || '?'}
                          </div>
                        ))}
                        {project.contributors.length > 5 && (
                          <span className="text-xs text-gray-500">
                            +{project.contributors.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
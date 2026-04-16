import { useState, useEffect, useRef } from 'react';
import API from '@/api';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { TrendingUp, X } from 'lucide-react';

const PROJECT_ICONS = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('gate'))                             return '🚪';
  if (n.includes('solar') || n.includes('light'))    return '☀️';
  if (n.includes('fence') || n.includes('perimeter'))return '🔒';
  if (n.includes('security'))                        return '🛡️';
  if (n.includes('water'))                           return '💧';
  if (n.includes('road'))                            return '🛣️';
  return '📋';
};

/* Animated progress bar — fills on mount */
function ProgressBar({ pct, color = '#0F172A' }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 100);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div className="w-full bg-[#E2E8F0] rounded-full h-2.5 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000 ease-out"
        style={{ width: `${width}%`, backgroundColor: color }}
      />
    </div>
  );
}

export default function CapExProgress() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [donationAmount, setDonationAmount] = useState('');
  const [donating, setDonating] = useState(false);

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      const res = await API.get('/projects');
      setProjects(res.data.projects || []);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const submitDonation = async () => {
    if (!donationAmount || donationAmount < 100) { toast.error('Minimum donation is KES 100'); return; }
    setDonating(true);
    try {
      const res = await API.post('/payments/mpesa/initiate', {
        amount: parseInt(donationAmount),
        payment_type: 'capex',
        project_id: selectedProject._id,
      });
      toast.success('M-Pesa prompt sent! Check your phone.');
      setSelectedProject(null);
      setDonationAmount('');
      pollStatus(res.data.payment?.checkoutRequestID);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Donation failed');
    } finally {
      setDonating(false);
    }
  };

  const pollStatus = (id) => {
    if (!id) return;
    let n = 0;
    const iv = setInterval(async () => {
      try {
        const res = await API.get(`/payments/mpesa/status/${id}`);
        if (res.data.payment.status === 'verified') { clearInterval(iv); toast.success('Donation successful! 🎉'); fetchProjects(); }
        else if (res.data.payment.status === 'failed') { clearInterval(iv); toast.error('Donation failed'); }
      } catch {}
      if (++n >= 30) clearInterval(iv);
    }, 2000);
  };

  if (loading) return (
    <Card className="rounded-2xl border border-[#E2E8F0]">
      <CardHeader><CardTitle><h2 className="text-lg font-bold text-[#0F172A]">CapEx Projects</h2></CardTitle></CardHeader>
      <CardContent className="p-6 space-y-5">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="animate-pulse space-y-3">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E2E8F0]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[#E2E8F0] rounded-lg w-2/3" />
                <div className="h-2.5 bg-[#E2E8F0] rounded-full w-full" />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <>
      <Card className="rounded-2xl border border-[#E2E8F0] shadow-sm">
        <CardHeader className="border-b border-[#F1F5F9] px-6 py-4">
          <div className="flex items-center justify-between">
            <CardTitle><h2 className="text-lg font-bold text-[#0F172A]">CapEx Projects</h2></CardTitle>
            <span className="text-xs text-[#94A3B8] font-medium">{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {projects.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 bg-[#F8FAFC] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-7 h-7 text-[#94A3B8]" />
              </div>
              <p className="text-[#64748B] text-sm">No active projects</p>
            </div>
          ) : (
            <div className="space-y-5">
              {projects.map((project) => {
                const pct = Math.min(Math.round((project.currentAmount / project.targetAmount) * 100), 100);
                const isComplete = project.status === 'completed';
                const barColor = isComplete ? '#1D9E75' : '#0F172A';

                return (
                  <div key={project._id} className="group">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-[#F8FAFC] rounded-xl flex items-center justify-center text-xl flex-shrink-0
                        group-hover:scale-110 transition-transform duration-200">
                        {PROJECT_ICONS(project.projectName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-[#0F172A] text-sm truncate">{project.projectName}</p>
                          <span className={`text-xs font-bold ml-2 flex-shrink-0 ${isComplete ? 'text-[#1D9E75]' : 'text-[#0F172A]'}`}>
                            {pct}%
                          </span>
                        </div>
                        <ProgressBar pct={pct} color={barColor} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#64748B] mb-3 pl-13">
                      <span>KES {project.currentAmount?.toLocaleString() || 0} raised</span>
                      <span>of KES {project.targetAmount?.toLocaleString()}</span>
                    </div>

                    {/* Contribute button — sliding arrow style */}
                    <button
                      onClick={() => setSelectedProject(project)}
                      className="relative w-full bg-white border border-[#E2E8F0] text-[#0F172A] rounded-xl h-11
                        font-semibold text-sm group/btn overflow-hidden transition-all duration-300
                        hover:border-[#0F172A] hover:shadow-sm"
                    >
                      <div className="bg-[#0F172A] rounded-lg h-9 w-9 flex items-center justify-center
                        absolute left-1 top-1 group-hover/btn:w-[calc(100%-8px)] z-10 transition-all duration-500">
                        <TrendingUp className="w-4 h-4 text-[#FDE9AB]" />
                      </div>
                      <p className="relative z-0 translate-x-3 text-[#0F172A] group-hover/btn:text-[#64748B] transition-colors duration-300">
                        Contribute
                      </p>
                    </button>

                    {projects.indexOf(project) < projects.length - 1 && (
                      <div className="border-b border-[#F1F5F9] mt-5" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Donation Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedProject(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl
            animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}>

            {/* Modal header */}
            <div className="bg-[#0F172A] p-6 relative">
              <div className="h-0.5 bg-gradient-to-r from-transparent via-[#FDE9AB] to-transparent opacity-40 absolute top-0 left-0 right-0" />
              <button onClick={() => setSelectedProject(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-white/10 transition">
                <X className="w-4 h-4" />
              </button>
              <div className="w-14 h-14 bg-[#FDE9AB]/20 rounded-2xl flex items-center justify-center text-3xl mb-3">
                {PROJECT_ICONS(selectedProject.projectName)}
              </div>
              <h2 className="text-[#FDE9AB] font-bold text-lg leading-tight">{selectedProject.projectName}</h2>
              <div className="mt-3">
                <div className="flex justify-between text-xs text-[#94A3B8] mb-1.5">
                  <span>KES {selectedProject.currentAmount?.toLocaleString() || 0}</span>
                  <span>{Math.min(Math.round((selectedProject.currentAmount / selectedProject.targetAmount) * 100), 100)}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5">
                  <div className="bg-[#FDE9AB] h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((selectedProject.currentAmount / selectedProject.targetAmount) * 100, 100)}%` }} />
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-[#0F172A] font-semibold text-sm block mb-2">Amount (KES)</label>
                <input
                  type="number"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  placeholder="Enter amount (min. 100)"
                  min="100"
                  className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl bg-[#F8FAFC] text-[#0F172A]
                    outline-none focus:ring-2 focus:ring-[#7F77DD] focus:border-[#7F77DD] transition-all text-sm"
                />
              </div>

              {/* Quick amounts */}
              <div className="grid grid-cols-4 gap-2">
                {[500, 1000, 2000, 5000].map((amt) => (
                  <button key={amt} onClick={() => setDonationAmount(amt.toString())}
                    className={`py-2 rounded-xl text-xs font-semibold transition-all duration-200
                      ${donationAmount === String(amt)
                        ? 'bg-[#0F172A] text-[#FDE9AB]'
                        : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#E2E8F0] border border-[#E2E8F0]'}`}>
                    {amt >= 1000 ? `${amt/1000}K` : amt}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={submitDonation} disabled={donating}
                  className="flex-1 relative overflow-hidden bg-[#0F172A] text-[#FDE9AB] py-3 rounded-xl
                    font-semibold text-sm hover:bg-[#1E293B] transition-all duration-200
                    disabled:opacity-60 disabled:cursor-not-allowed group">
                  <span className="absolute bottom-0 left-0 h-full -ml-2 opacity-10">
                    <svg className="w-auto h-full" viewBox="0 0 487 487">
                      <path fill="#FDE9AB" fillRule="nonzero"
                        d="M0 .3c67 2.1 134.1 4.3 186.3 37 52.2 32.7 89.6 95.8 112.8 150.6 23.2 54.8 32.3 101.4 61.2 149.9 28.9 48.4 77.7 98.8 126.4 149.2H0V.3z" />
                    </svg>
                  </span>
                  <span className="relative">{donating ? 'Sending…' : 'Donate'}</span>
                </button>
                <button onClick={() => { setSelectedProject(null); setDonationAmount(''); }}
                  className="flex-1 bg-[#F8FAFC] text-[#64748B] py-3 rounded-xl font-semibold text-sm
                    hover:bg-[#E2E8F0] border border-[#E2E8F0] transition-all duration-200">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
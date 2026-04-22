import {
  Dialog, DialogTrigger, DialogClose, DialogContent,
  DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input }    from '@/components/ui/input';
import { Label }    from '@/components/ui/label';
import { Select, SelectTrigger, SelectContent, SelectGroup, SelectItem, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import IncidentsList from '@/components/IncidentsList';
import API from '@/api';
import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Upload, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';

export default function Incident() {
  const [formData, setFormData] = useState({
    type: '', title: '', location: '', description: '', status: 'reported',
  });
  const [files, setFiles]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  const handleFileChange = (e) => setFiles(Array.from(e.target.files));

  const handleAddIncident = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('type',        formData.type);
      fd.append('title',       formData.title);
      fd.append('address',     formData.location);
      fd.append('description', formData.description);
      files.forEach(f => fd.append('media', f));

      await API.post('/incidents', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setFormData({ type: '', title: '', location: '', description: '', status: 'reported' });
      setFiles([]);
      toast.success('Incident reported! Security team has been notified.');
      setOpen(false);
    } catch (err) {
      console.error('Incident report failed:', err);
      toast.error('Failed to report incident. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const INCIDENT_TYPES = [
    { value: 'burglary',     label: '🚨 Burglary / Break-in'   },
    { value: 'fire',         label: '🔥 Fire'                   },
    { value: 'suspicious',   label: '👁️ Suspicious Activity'   },
    { value: 'environmental',label: '🌳 Environmental Issue'    },
  ];

  const canSubmit = formData.type && formData.title && formData.location && formData.description;

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Page header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">
              Security & Incidents
            </h1>
            <p className="text-[#64748B] text-sm mt-1">
              Report and track security incidents in your community
            </p>
          </div>

          {/* Report button — RoseButton style */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <button
                className="
                  relative px-5 py-2.5 z-10 rounded-xl flex items-center gap-2
                  bg-[#A76059] text-white font-bold text-sm tracking-wide
                  overflow-hidden
                  after:absolute after:h-1 after:w-1
                  after:bg-[#8B4A44] after:left-4 after:bottom-0
                  after:translate-y-full after:rounded-full after:-z-10
                  after:hover:scale-[300]
                  after:hover:transition-all after:hover:duration-700
                  after:transition-all after:duration-700
                  transition-all duration-700
                  hover:shadow-lg hover:shadow-[#A76059]/30
                  [text-shadow:0px_1px_2px_rgba(90,30,30,0.4)]
                  active:scale-[0.98]
                "
              >
                <Plus className="w-4 h-4" />
                Report Incident
              </button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border-[#E2E8F0]">
              <DialogHeader>
                <DialogTitle>
                  <h2 className="text-xl font-black text-[#0F172A]">Report Incident</h2>
                </DialogTitle>
                <DialogDescription className="text-[#64748B] text-sm">
                  Provide details about the incident. Your report will be reviewed by the security team.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleAddIncident} className="space-y-5 mt-2">

                {/* Type */}
                <div>
                  <Label className="mb-2 block text-[#0F172A] font-semibold text-sm">
                    Incident Type <span className="text-[#A76059]">*</span>
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={v => setFormData(p => ({ ...p, type: v }))}
                    required
                  >
                    <SelectTrigger className="rounded-xl border-[#E2E8F0] focus:ring-[#7F77DD]">
                      <SelectValue placeholder="Select incident type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {INCIDENT_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                {/* Title */}
                <div>
                  <Label className="mb-2 block text-[#0F172A] font-semibold text-sm">
                    Title <span className="text-[#A76059]">*</span>
                  </Label>
                  <Input
                    name="title" value={formData.title} onChange={handleInput}
                    placeholder="Brief description of the incident"
                    disabled={loading} required
                    className="rounded-xl border-[#E2E8F0] focus:ring-[#7F77DD]"
                  />
                </div>

                {/* Location */}
                <div>
                  <Label className="mb-2 block text-[#0F172A] font-semibold text-sm">
                    Location <span className="text-[#A76059]">*</span>
                  </Label>
                  <Input
                    name="location" value={formData.location} onChange={handleInput}
                    placeholder="Where did this happen? (e.g., Plot 45, Kyuna Rise)"
                    disabled={loading} required
                    className="rounded-xl border-[#E2E8F0] focus:ring-[#7F77DD]"
                  />
                </div>

                {/* Description */}
                <div>
                  <Label className="mb-2 block text-[#0F172A] font-semibold text-sm">
                    Description <span className="text-[#A76059]">*</span>
                  </Label>
                  <Textarea
                    name="description" value={formData.description} onChange={handleInput}
                    placeholder="Provide more details about what happened..."
                    rows={4} disabled={loading} required
                    className="rounded-xl border-[#E2E8F0] focus:ring-[#7F77DD]"
                  />
                </div>

                {/* Evidence upload */}
                <div>
                  <Label className="mb-2 block text-[#0F172A] font-semibold text-sm">
                    Evidence <span className="text-[#94A3B8] font-normal">(Optional)</span>
                  </Label>
                  <div className="border-2 border-dashed border-[#E2E8F0] rounded-xl p-6 text-center
                    hover:border-[#0F172A]/30 transition-colors duration-200 cursor-pointer">
                    <input
                      type="file" id="evidence-upload"
                      accept="image/*,video/*" multiple
                      onChange={handleFileChange} className="hidden"
                    />
                    <label htmlFor="evidence-upload"
                      className="cursor-pointer flex flex-col items-center gap-2">
                      <div className="w-12 h-12 bg-[#F8FAFC] rounded-xl flex items-center justify-center">
                        <Upload className="w-6 h-6 text-[#94A3B8]" />
                      </div>
                      <p className="text-[#0F172A] font-semibold text-sm">
                        Tap to upload photos or videos
                      </p>
                      <p className="text-xs text-[#94A3B8]">PNG, JPG, MP4 up to 10MB each</p>
                    </label>

                    {files.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-semibold text-[#0F172A]">
                          {files.length} file{files.length > 1 ? 's' : ''} selected
                        </p>
                        <ul className="space-y-1.5">
                          {files.map((file, i) => (
                            <li key={i}
                              className="flex items-center justify-between bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-2 rounded-xl text-xs">
                              <span className="truncate text-[#0F172A] font-medium">{file.name}</span>
                              <span className="text-[#94A3B8] ml-2 flex-shrink-0">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter className="gap-3 pt-2">
                  {/* Cancel — sliding arrow style */}
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={loading}
                    className="
                      relative px-5 py-2.5 bg-white border border-[#E2E8F0]
                      text-[#0F172A] rounded-xl font-semibold text-sm
                      group overflow-hidden transition-all duration-300
                      hover:border-[#0F172A] disabled:opacity-50
                    "
                  >
                    <div className="
                      bg-[#0F172A] rounded-lg h-8 w-8
                      flex items-center justify-center
                      absolute left-1 top-1
                      group-hover:w-[calc(100%-8px)] z-10
                      transition-all duration-500
                    ">
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-[#FDE9AB]"
                        fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M19 12H5M12 5l-7 7 7 7" />
                      </svg>
                    </div>
                    <span className="relative z-0 pl-6 text-[#64748B] group-hover:text-[#94A3B8] transition-colors">
                      Cancel
                    </span>
                  </button>

                  {/* Submit — RoseButton style in rose */}
                  <button
                    type="submit"
                    disabled={loading || !canSubmit}
                    className="
                      relative px-5 py-2.5 z-10 rounded-xl
                      bg-[#A76059] text-white font-bold text-sm
                      overflow-hidden
                      after:absolute after:h-1 after:w-1
                      after:bg-[#8B4A44] after:left-4 after:bottom-0
                      after:translate-y-full after:rounded-full after:-z-10
                      after:hover:scale-[300]
                      after:hover:transition-all after:hover:duration-700
                      after:transition-all after:duration-700
                      transition-all duration-700
                      disabled:opacity-50 disabled:cursor-not-allowed
                      active:scale-[0.98]
                    "
                  >
                    <span className="relative flex items-center gap-2">
                      {loading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                        : 'Submit Report'}
                    </span>
                  </button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Incidents list */}
        <IncidentsList limit={10} />

      </div>
    </DashboardLayout>
  );
}
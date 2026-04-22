import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '@/api';
import { toast } from 'sonner';
import {
  Users, Calendar, MessageSquare, MapPin, Plus, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import DashboardLayout from '@/components/DashboardLayout';
import PageLoader from '@/components/PageLoader';

export default function Community() {
  const [groups, setGroups]         = useState([]);
  const [events, setEvents]         = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showEventModal, setShowEventModal]   = useState(false);
  const [showTopicModal, setShowTopicModal]   = useState(false);
  const [eventData, setEventData] = useState({
    title: '', description: '', date: '', time: '', location: '', event_type: 'meeting',
  });
  const [topicData, setTopicData] = useState({
    title: '', content: '', category: 'general',
  });
  const navigate = useNavigate();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [groupsRes, eventsRes] = await Promise.all([
        API.get('/groups?type=street'),
        API.get('/events'),
      ]);
      setGroups(groupsRes.data.groups || []);
      setEvents(eventsRes.data.events || []);
      try {
        const discRes = await API.get('/discussions');
        setDiscussions(discRes.data.discussions || []);
      } catch {}
    } catch (err) {
      console.error('Failed to fetch community data:', err);
      toast.error('Failed to load community data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await API.post('/events', eventData);
      toast.success('Event created!');
      setShowEventModal(false);
      setEventData({ title: '', description: '', date: '', time: '', location: '', event_type: 'meeting' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create event');
    }
  };

  const handleCreateTopic = async (e) => {
    e.preventDefault();
    try {
      await API.post('/discussions', topicData);
      toast.success('Topic posted!');
      setShowTopicModal(false);
      setTopicData({ title: '', content: '', category: 'general' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post topic');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  }) : '';

  // ── Bouncing dots loader (matches system) ────────────
  if (loading) return (
    <DashboardLayout>
      <PageLoader message="Loading community…" />
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Community</h1>
            <p className="text-[#64748B] text-sm mt-1">Your streets, groups and events</p>
          </div>
          <div className="flex gap-3">
            {/* Post topic */}
            <Dialog open={showTopicModal} onOpenChange={setShowTopicModal}>
              <DialogTrigger asChild>
                <button className="
                  relative px-4 py-2.5 z-10 rounded-xl
                  bg-white border border-[#E2E8F0]
                  text-[#0F172A] font-semibold text-sm
                  overflow-hidden after:absolute after:h-1 after:w-1
                  after:bg-[#E2E8F0] after:left-3 after:bottom-0
                  after:translate-y-full after:rounded-full after:-z-10
                  after:hover:scale-[300] after:hover:transition-all after:hover:duration-700
                  after:transition-all after:duration-700
                  transition-all duration-700
                  hover:border-[#0F172A]
                  flex items-center gap-2
                ">
                  <MessageSquare className="w-4 h-4" /> Post Topic
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Post a Discussion Topic</DialogTitle>
                  <DialogDescription>Start a conversation with your community</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateTopic} className="space-y-4 mt-2">
                  <div>
                    <Label className="mb-1.5 block text-[#0F172A] font-semibold text-sm">Title *</Label>
                    <Input value={topicData.title}
                      onChange={e => setTopicData(p => ({ ...p, title: e.target.value }))}
                      placeholder="What's on your mind?" required
                      className="rounded-xl border-[#E2E8F0] focus:ring-[#7F77DD]" />
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-[#0F172A] font-semibold text-sm">Category</Label>
                    <Select value={topicData.category}
                      onValueChange={v => setTopicData(p => ({ ...p, category: v }))}>
                      <SelectTrigger className="rounded-xl border-[#E2E8F0]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['general','security','maintenance','events','announcements'].map(c => (
                          <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-[#0F172A] font-semibold text-sm">Content *</Label>
                    <Textarea value={topicData.content}
                      onChange={e => setTopicData(p => ({ ...p, content: e.target.value }))}
                      placeholder="Share details…" rows={4} required
                      className="rounded-xl border-[#E2E8F0] focus:ring-[#7F77DD]" />
                  </div>
                  <DialogFooter>
                    <button type="button" onClick={() => setShowTopicModal(false)}
                      className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-[#64748B] font-semibold text-sm hover:bg-[#F8FAFC] transition">
                      Cancel
                    </button>
                    <button type="submit"
                      className="relative px-4 py-2.5 z-10 rounded-xl bg-[#0F172A] text-[#FDE9AB] font-semibold text-sm
                        overflow-hidden after:absolute after:h-1 after:w-1 after:bg-[#1E293B] after:left-3 after:bottom-0
                        after:translate-y-full after:rounded-full after:-z-10
                        after:hover:scale-[300] after:hover:transition-all after:hover:duration-700
                        after:transition-all after:duration-700 transition-all duration-700">
                      Post Topic
                    </button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {/* Create event */}
            <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
              <DialogTrigger asChild>
                <button className="
                  relative px-4 py-2.5 z-10 rounded-xl
                  bg-[#0F172A] text-[#FDE9AB] font-semibold text-sm
                  overflow-hidden after:absolute after:h-1 after:w-1
                  after:bg-[#1E293B] after:left-3 after:bottom-0
                  after:translate-y-full after:rounded-full after:-z-10
                  after:hover:scale-[300] after:hover:transition-all after:hover:duration-700
                  after:transition-all after:duration-700
                  transition-all duration-700
                  flex items-center gap-2
                ">
                  <Plus className="w-4 h-4" /> Create Event
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Community Event</DialogTitle>
                  <DialogDescription>Schedule an event for your community</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateEvent} className="space-y-4 mt-2">
                  {[
                    { key: 'title',    label: 'Event Name *',  placeholder: 'Annual General Meeting', type: 'text' },
                    { key: 'date',     label: 'Date *',         placeholder: '',                       type: 'date' },
                    { key: 'time',     label: 'Time *',         placeholder: '',                       type: 'time' },
                    { key: 'location', label: 'Location *',     placeholder: 'Community Hall',          type: 'text' },
                  ].map(({ key, label, placeholder, type }) => (
                    <div key={key}>
                      <Label className="mb-1.5 block text-[#0F172A] font-semibold text-sm">{label}</Label>
                      <Input type={type} value={eventData[key]}
                        onChange={e => setEventData(p => ({ ...p, [key]: e.target.value }))}
                        placeholder={placeholder} required
                        className="rounded-xl border-[#E2E8F0] focus:ring-[#7F77DD]" />
                    </div>
                  ))}
                  <div>
                    <Label className="mb-1.5 block text-[#0F172A] font-semibold text-sm">Description</Label>
                    <Textarea value={eventData.description}
                      onChange={e => setEventData(p => ({ ...p, description: e.target.value }))}
                      placeholder="What's this event about?" rows={3}
                      className="rounded-xl border-[#E2E8F0] focus:ring-[#7F77DD]" />
                  </div>
                  <DialogFooter>
                    <button type="button" onClick={() => setShowEventModal(false)}
                      className="px-4 py-2.5 rounded-xl border border-[#E2E8F0] text-[#64748B] font-semibold text-sm hover:bg-[#F8FAFC] transition">
                      Cancel
                    </button>
                    <button type="submit"
                      className="relative px-4 py-2.5 z-10 rounded-xl bg-[#0F172A] text-[#FDE9AB] font-semibold text-sm
                        overflow-hidden after:absolute after:h-1 after:w-1 after:bg-[#1E293B] after:left-3 after:bottom-0
                        after:translate-y-full after:rounded-full after:-z-10
                        after:hover:scale-[300] after:hover:transition-all after:hover:duration-700
                        after:transition-all after:duration-700 transition-all duration-700">
                      Create Event
                    </button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Street Groups */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F1F5F9] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#7F77DD]" />
              <h2 className="font-bold text-[#0F172A]">Street Groups</h2>
            </div>
            <div className="divide-y divide-[#F1F5F9]">
              {groups.length === 0 ? (
                <div className="p-8 text-center text-[#94A3B8] text-sm">No groups yet</div>
              ) : groups.map(g => (
                <div key={g._id}
                  onClick={() => navigate(`/dashboard/community/groups/${g._id}`)}
                  className="px-6 py-4 flex items-center justify-between hover:bg-[#F8FAFC] cursor-pointer transition group">
                  <div>
                    <p className="font-semibold text-[#0F172A] text-sm">{g.name}</p>
                    <p className="text-xs text-[#94A3B8] mt-0.5">{g.members?.length || 0} members</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#0F172A] transition" />
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F1F5F9] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#1D9E75]" />
              <h2 className="font-bold text-[#0F172A]">Upcoming Events</h2>
            </div>
            <div className="divide-y divide-[#F1F5F9]">
              {events.length === 0 ? (
                <div className="p-8 text-center text-[#94A3B8] text-sm">No upcoming events</div>
              ) : events.slice(0, 5).map(ev => (
                <div key={ev._id} className="px-6 py-4">
                  <p className="font-semibold text-[#0F172A] text-sm mb-1">{ev.title}</p>
                  <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(ev.date)}</span>
                    {ev.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.location}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Discussions */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#F1F5F9] flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[#378ADD]" />
              <h2 className="font-bold text-[#0F172A]">Discussions</h2>
            </div>
            <div className="divide-y divide-[#F1F5F9]">
              {discussions.length === 0 ? (
                <div className="p-8 text-center text-[#94A3B8] text-sm">No discussions yet</div>
              ) : discussions.slice(0, 5).map(d => (
                <div key={d._id}
                  onClick={() => navigate(`/dashboard/community/discussions/${d._id}`)}
                  className="px-6 py-4 hover:bg-[#F8FAFC] cursor-pointer transition group">
                  <p className="font-semibold text-[#0F172A] text-sm mb-1 line-clamp-1">{d.title}</p>
                  <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                    <span className="capitalize px-2 py-0.5 bg-[#EEEDFE] text-[#3C3489] rounded-full font-medium">
                      {d.category}
                    </span>
                    <span>{d.replies?.length || 0} replies</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
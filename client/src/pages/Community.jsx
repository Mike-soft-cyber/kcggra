import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '@/api';
import { toast } from 'sonner';
import { 
  Users, 
  Calendar, 
  MessageSquare, 
  MapPin, 
  Plus,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import DashboardLayout from '@/components/DashboardLayout'

export default function Community() {
  const [groups, setGroups] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    event_type: 'meeting',
  });
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [topicData, setTopicData] = useState({
    title: '',
    content: '',
    category: 'general',
  });
  const [discussions, setDiscussions] = useState([]);
  const navigate = useNavigate()

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [groupsRes, eventsRes] = await Promise.all([
        API.get('/groups?type=street'),
        API.get('/events'),
      ]);

      setGroups(groupsRes.data.groups || []);
      setEvents(eventsRes.data.events || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load community data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await API.post('/events', eventData);
      toast.success('Event created successfully!');
      setShowEventModal(false);
      setEventData({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        event_type: 'meeting',
      });
      fetchData();
    } catch (error) {
      toast.error('Failed to create event');
    }
  };

  useEffect(() => {
  fetchDiscussions();
}, []);

const fetchDiscussions = async () => {
  try {
    const response = await API.get('/discussions');
    setDiscussions(response.data.discussions || []);
  } catch (error) {
    console.error('Failed to fetch discussions:', error);
  }
};

const handleCreateTopic = async () => {
  try {
    await API.post('/discussions', topicData);
    toast.success('Discussion topic created!');
    setShowTopicModal(false);
    setTopicData({ title: '', content: '', category: 'general' });
    fetchDiscussions();
  } catch (error) {
    toast.error('Failed to create topic');
  }
};

  const handleJoinGroup = async (groupId) => {
    try {
      await API.post(`/groups/${groupId}/join`);
      toast.success('Joined group successfully!');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join group');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading community...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Community</h1>
              <p className="text-gray-600 mt-1">Connect with your neighbors and join local groups</p>
            </div>
            <div className="flex gap-3">
              <Input
                placeholder="Search community..."
                className="w-64"
              />
              <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                    <DialogDescription>
                      Organize a community gathering or meeting
                    </DialogDescription>
                  </DialogHeader>

                  <form onSubmit={handleCreateEvent} className="space-y-4">
                    <div>
                      <Label>Event Title *</Label>
                      <Input
                        value={eventData.title}
                        onChange={(e) => setEventData({ ...eventData, title: e.target.value })}
                        placeholder="Community Tea Gathering"
                        required
                      />
                    </div>

                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={eventData.description}
                        onChange={(e) => setEventData({ ...eventData, description: e.target.value })}
                        placeholder="What's this event about?"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Date *</Label>
                        <Input
                          type="date"
                          value={eventData.date}
                          onChange={(e) => setEventData({ ...eventData, date: e.target.value })}
                          min={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>
                      <div>
                        <Label>Time</Label>
                        <Input
                          type="time"
                          value={eventData.time}
                          onChange={(e) => setEventData({ ...eventData, time: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Location *</Label>
                      <Input
                        value={eventData.location}
                        onChange={(e) => setEventData({ ...eventData, location: e.target.value })}
                        placeholder="Grevillea Community Center"
                        required
                      />
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setShowEventModal(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-green-600 hover:bg-green-700">
                        Create Event
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Street Groups */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-gray-700" />
                <h2 className="text-xl font-bold text-gray-900">Street Groups</h2>
              </div>
              <p className="text-gray-600 text-sm">Join your neighborhood micro-groups</p>
            </div>

            <div className="p-6 space-y-3">
              {groups.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p>No street groups yet</p>
                </div>
              ) : (
                groups.slice(0, 5).map((group) => (
                  <div
                    key={group._id}
                    className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                    onClick={() => router.push(`/dashboard/community/groups/${group._id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{group.name}</p>
                          {group.members.length > 30 && (
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{group.members.length} members</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                ))
              )}

              {groups.length > 5 && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push('/dashboard/community/groups')}
                >
                  View All Groups
                </Button>
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5 text-gray-700" />
                <h2 className="text-xl font-bold text-gray-900">Upcoming Events</h2>
              </div>
              <p className="text-gray-600 text-sm">Community gatherings and meetings</p>
            </div>

            <div className="p-6">
              {events.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="mb-2">No upcoming events</p>
                  <button
                    onClick={() => setShowEventModal(true)}
                    className="text-green-600 hover:text-green-700 text-sm font-medium"
                  >
                    Create one!
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => (
                    <div
                      key={event._id}
                      className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                      onClick={() => router.push(`/dashboard/community/events/${event._id}`)}
                    >
                      <h3 className="font-medium text-gray-900 mb-2">{event.title}</h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(event.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        {event.time && (
                          <div className="flex items-center gap-2">
                            <span className="w-4" />
                            <span>{event.time}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{event.location}</span>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {event.attendees.slice(0, 3).map((attendee, i) => (
                            <div
                              key={i}
                              className="w-6 h-6 rounded-full bg-green-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                            >
                              {attendee.user_id?.username?.charAt(0) || '?'}
                            </div>
                          ))}
                        </div>
                        <span className="text-xs text-gray-600">
                          {event.attendees.length} attending
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Discussions */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-gray-700" />
                <h2 className="text-xl font-bold text-gray-900">Recent Discussions</h2>
              </div>
              <Button onClick={() => setShowTopicModal(true)}>
  <Plus className="w-4 h-4 mr-2" />
  New Topic
</Button>

<Dialog open={showTopicModal} onOpenChange={setShowTopicModal}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Start a Discussion</DialogTitle>
    </DialogHeader>
    
    <div className="space-y-4">
      <div>
        <Label>Title</Label>
        <Input
          value={topicData.title}
          onChange={(e) => setTopicData({...topicData, title: e.target.value})}
          placeholder="Water supply issues on Street 5"
        />
      </div>
      
      <div>
        <Label>Category</Label>
        <Select
          value={topicData.category}
          onValueChange={(value) => setTopicData({...topicData, category: value})}
        >
          <SelectTrigger className='w-full'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="security">Security</SelectItem>
            <SelectItem value="events">Events</SelectItem>
            <SelectItem value="improvements">Improvements</SelectItem>
            <SelectItem value="complaints">Complaints</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label>Message</Label>
        <Textarea
          value={topicData.content}
          onChange={(e) => setTopicData({...topicData, content: e.target.value})}
          placeholder="Describe the topic..."
          rows={5}
        />
      </div>
    </div>
    
    <DialogFooter>
      <Button variant="outline" onClick={() => setShowTopicModal(false)}>
        Cancel
      </Button>
      <Button onClick={handleCreateTopic}>
        Create Topic
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
            </div>
            <p className="text-gray-600 text-sm mt-1">Join the conversation with your neighbors</p>
          </div>

          <div className="space-y-3">
  {discussions.map((discussion) => (
    <div
      key={discussion._id}
      className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
      onClick={() => router.push(`/dashboard/community/discussions/${discussion._id}`)}
    >
      <h3 className="font-bold text-gray-900">{discussion.title}</h3>
      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{discussion.content}</p>
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
        <span>By {discussion.author_id?.username}</span>
        <span>•</span>
        <span>{discussion.replies?.length || 0} replies</span>
        <span>•</span>
        <span>{discussion.views || 0} views</span>
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
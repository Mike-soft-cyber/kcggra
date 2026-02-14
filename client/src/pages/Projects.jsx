import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import API from '@/api';
import { toast } from 'sonner';

export default function AdminProjects() {
  const [formData, setFormData] = useState({
    projectName: '',
    targetAmount: '',
    description: '',
    target_completion_date: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/projects', formData);
      toast.success('Project created successfully!');
      setFormData({
        projectName: '',
        targetAmount: '',
        description: '',
        target_completion_date: '',
      });
    } catch (error) {
      toast.error('Failed to create project');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create CapEx Project</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Project Name</Label>
          <Input
            value={formData.projectName}
            onChange={(e) => setFormData({...formData, projectName: e.target.value})}
            placeholder="Main Gate Upgrade"
            required
          />
        </div>

        <div>
          <Label>Target Amount (KES)</Label>
          <Input
            type="number"
            value={formData.targetAmount}
            onChange={(e) => setFormData({...formData, targetAmount: e.target.value})}
            placeholder="850000"
            required
          />
        </div>

        <div>
          <Label>Description</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            placeholder="Upgrade main gate with automated access system"
          />
        </div>

        <div>
          <Label>Target Completion Date</Label>
          <Input
            type="date"
            value={formData.target_completion_date}
            onChange={(e) => setFormData({...formData, target_completion_date: e.target.value})}
          />
        </div>

        <Button type="submit" className="w-full bg-green-600">
          Create Project
        </Button>
      </form>
    </div>
  );
}
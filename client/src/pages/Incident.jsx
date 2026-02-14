import { Dialog, DialogTrigger, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectGroup, SelectItem, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import IncidentsList from "@/components/IncidentsList";
import API from "@/api";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Upload } from "lucide-react";
import DashboardLayout from '@/components/DashboardLayout'

export default function Incident(){
    const [formData, setFormData] = useState({
        type: '',
        title: '',
        location: '',
        description: '',
        status: 'reported',
    })
    const [files, setFiles] = useState([])
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    // ✅ Handle file selection
    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files)
        setFiles(selectedFiles)
    }

    const handleAddIncident = async(e) => {
        try {
            e.preventDefault()
            setLoading(true)

            // ✅ Create FormData for file upload
            const formDataToSend = new FormData()
            formDataToSend.append('type', formData.type)
            formDataToSend.append('title', formData.title)
            formDataToSend.append('address', formData.location) // ✅ Backend expects 'address'
            formDataToSend.append('description', formData.description)
            
            // ✅ Append files (if any)
            files.forEach((file) => {
                formDataToSend.append('media', file) // ✅ Backend expects 'media' field
            })

            await API.post('/incidents', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data', // ✅ Important for file upload
                }
            })

            // ✅ Reset form
            setFormData({
                type: '',
                title: '',
                location: '',
                description: '',
                status: 'reported',
            })
            setFiles([])
            
            toast.success('Incident successfully reported! A-Team has been notified.')
            setOpen(false)
        } catch (error) {
            console.error("Incident report failed to send", error)
            toast.error("Failed to report incident. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const IncidentTypes = [
        { value: 'burglary', label: '🚨 Burglary/Break-in' },
        { value: 'fire', label: '🔥 Fire' },
        { value: 'suspicious', label: '👁️ Suspicious Activity' },
        { value: 'environmental', label: '🌳 Environmental Issue' },
    ];

    return(
        <DashboardLayout>
        <div className="p-6">
            <section className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Security & Incidents</h2>
                        <p className="text-gray-600">Report and track security incidents in your community</p>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-red-600 hover:bg-red-700">
                                <Plus className="w-4 h-4 mr-2" /> Report Incident
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>
                                    <h2 className="text-2xl font-bold">Report Incident</h2>
                                </DialogTitle>
                                <DialogDescription>
                                    <p className="text-gray-600">
                                        Provide details about the incident. Your report will be reviewed by the security team.
                                    </p>
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleAddIncident} className="space-y-4">
                                {/* Incident Type */}
                                <div>
                                    <Label className="mb-2 block">Incident Type *</Label>
                                    <Select
                                        onValueChange={(value) => setFormData(prev => ({...prev, type: value}))}
                                        value={formData.type}
                                        required
                                    >
                                        <SelectTrigger className='w-full'>
                                            <SelectValue placeholder="Select incident type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectGroup>
                                                {IncidentTypes.map((incident) => (
                                                    <SelectItem key={incident.value} value={incident.value}>
                                                        {incident.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Title */}
                                <div>
                                    <Label className="mb-2 block">Title *</Label>
                                    <Input
                                        name="title"
                                        type="text"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        disabled={loading}
                                        placeholder="Brief description of the incident"
                                        required
                                    />
                                </div>

                                {/* Location */}
                                <div>
                                    <Label className="mb-2 block">Location *</Label>
                                    <Input
                                        name="location"
                                        type="text"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        disabled={loading}
                                        placeholder="Where did this happen? (e.g., Plot 45, Kyuna Rise)"
                                        required
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <Label className="mb-2 block">Description *</Label>
                                    <Textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        disabled={loading}
                                        placeholder="Provide more details about what happened..."
                                        rows={4}
                                        required
                                    />
                                </div>

                                {/* ✅ Evidence Upload */}
                                <div>
                                    <Label className="mb-2 block">Evidence (Optional)</Label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition">
                                        <input
                                            type="file"
                                            id="evidence-upload"
                                            accept="image/*,video/*"
                                            multiple
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                        <label
                                            htmlFor="evidence-upload"
                                            className="cursor-pointer flex flex-col items-center gap-2"
                                        >
                                            <Upload className="w-12 h-12 text-gray-400" />
                                            <p className="text-gray-600 font-medium">
                                                Tap to upload photos or videos
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                PNG, JPG, MP4 up to 10MB each
                                            </p>
                                        </label>

                                        {/* ✅ Show selected files */}
                                        {files.length > 0 && (
                                            <div className="mt-4 space-y-2">
                                                <p className="text-sm font-medium text-gray-700">
                                                    {files.length} file(s) selected:
                                                </p>
                                                <ul className="text-sm text-gray-600 space-y-1">
                                                    {files.map((file, index) => (
                                                        <li key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                                                            <span className="truncate">{file.name}</span>
                                                            <span className="text-xs text-gray-500 ml-2">
                                                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setOpen(false)}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={loading || !formData.type || !formData.title || !formData.location || !formData.description}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        {loading ? 'Submitting...' : 'Submit Report'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </section>

            <IncidentsList limit={10} />
        </div>
        </DashboardLayout>
    )
}
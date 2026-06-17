import React, { useState, useEffect } from 'react';
import { X, MapPin, Loader, CheckCircle, AlertCircle, Clock, Camera } from 'lucide-react';
import { WorkDay, Trip } from '../types';

interface EndOfDayReportProps {
  workDay: WorkDay;
  todayTrips: Trip[];
  userId: string;
  onSubmit: (updatedWorkDay: WorkDay) => void;
  onClose: () => void;
}

export function EndOfDayReport({ workDay, todayTrips, userId, onSubmit, onClose }: EndOfDayReportProps) {
  const [endTime] = useState(new Date().toISOString());
  const [location, setLocation] = useState<{ latitude: number; longitude: number; address: string } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [eodPhotoFiles, setEodPhotoFiles] = useState<{ tripId: string; file: File }[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  useEffect(() => { detectLocation(); }, []);

  function detectLocation() {
    setLocationLoading(true);
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported.');
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let address = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          if (r.ok) { const d = await r.json(); address = d.display_name || address; }
        } catch (_) {}
        setLocation({ latitude, longitude, address });
        setLocationLoading(false);
      },
      (err) => {
        setLocationError('Could not detect: ' + err.message);
        setLocation({ latitude: 0, longitude: 0, address: '' });
        setLocationLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }

  function addEodPhoto(tripId: string, file: File) {
    setEodPhotoFiles(prev => [...prev, { tripId, file }]);
  }

  async function handleSubmit() {
    if (!location) return;
    if (!location.address && !location.latitude) {
      alert('Please enter your end location.');
      return;
    }
    setSubmitting(true);
    try {
      // Upload any EOD photos first
      if (eodPhotoFiles.length > 0) {
        setUploadingPhotos(true);
        for (const { tripId, file } of eodPhotoFiles) {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          await fetch(`/api/trips/${tripId}/proof`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dataUrl, kind: 'DELIVERY', fileName: file.name, uploadedBy: 'driver' }),
          });
        }
        setUploadingPhotos(false);
      }

      const res = await fetch(`/api/workday/${workDay.id}/end`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endTime, endLocation: location, eodNotes: notes, userId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit EOD report');
      onSubmit(data.workDay);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const completed = todayTrips.filter(t => t.taskStage === 'Completed');
  const incomplete = todayTrips.filter(t => t.taskStage === 'Incomplete');
  const pending = todayTrips.filter(t => t.taskStage === 'Ongoing' || t.taskStage === 'Upcoming');

  const canSubmit = !!location && (location.address || location.latitude > 0) && !locationLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h2 className="text-lg font-bold text-gray-900">End of Day Report</h2>
            <p className="text-xs text-gray-500">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-5">
          {/* Task summary */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Today's Task Summary</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{completed.length}</div>
                <div className="text-xs text-green-700 font-medium">Completed</div>
              </div>
              <div className="bg-red-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-red-600">{incomplete.length}</div>
                <div className="text-xs text-red-700 font-medium">Incomplete</div>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 text-center">
                <div className="text-2xl font-bold text-amber-600">{pending.length}</div>
                <div className="text-xs text-amber-700 font-medium">Pending</div>
              </div>
            </div>
          </div>

          {/* Task list */}
          {todayTrips.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Tasks Overview</h3>
              <div className="space-y-2">
                {todayTrips.map(trip => (
                  <div key={trip.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    {trip.taskStage === 'Completed' ? (
                      <CheckCircle size={16} className="text-green-500 shrink-0" />
                    ) : trip.taskStage === 'Incomplete' ? (
                      <AlertCircle size={16} className="text-red-500 shrink-0" />
                    ) : (
                      <Clock size={16} className="text-amber-500 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{trip.origin}</div>
                      <div className="text-xs text-gray-500">{trip.taskType || 'PICKUP'} {trip.courierName ? '· ' + trip.courierName : ''}</div>
                    </div>
                    {(trip.taskStage === 'Ongoing' || trip.taskStage === 'Upcoming') && (
                      <button
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file'; input.accept = 'image/*'; input.capture = 'environment';
                          input.onchange = (e: any) => { const f = e.target.files?.[0]; if (f) addEodPhoto(trip.id, f); };
                          input.click();
                        }}
                        className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-lg hover:bg-blue-100 shrink-0"
                      >
                        <Camera size={12} /> Add Photo
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* End time */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">End Time <span className="text-red-500">*</span></label>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
              <Clock size={14} className="text-gray-400" />
              <span className="text-sm font-semibold text-gray-800">
                {new Date(endTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </span>
              <span className="text-xs text-gray-400 ml-auto">Auto-recorded</span>
            </div>
          </div>

          {/* End location */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">End Location <span className="text-red-500">*</span></label>
            {locationLoading ? (
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                <Loader size={14} className="text-blue-500 animate-spin" />
                <span className="text-sm text-gray-500">Detecting location...</span>
              </div>
            ) : location ? (
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="flex gap-2">
                  <MapPin size={14} className="text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-gray-700 leading-relaxed">
                    {location.address || `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`}
                  </p>
                </div>
                <button onClick={detectLocation} className="text-xs text-blue-600 mt-2 underline">Refresh location</button>
                {(!location.latitude || !location.address) && (
                  <input
                    type="text"
                    placeholder="Enter your current location"
                    value={location.address}
                    onChange={e => setLocation({ ...location, address: e.target.value })}
                    className="w-full mt-2 border border-gray-300 rounded-xl p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                )}
              </div>
            ) : null}
            {locationError && <p className="text-xs text-red-600 mt-1">{locationError}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Day Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any observations, issues, or notes for the day..."
              className="w-full border border-gray-300 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 sticky bottom-0 bg-white">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="w-full py-3.5 bg-green-600 text-white rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <><Loader size={14} className="animate-spin" /> {uploadingPhotos ? 'Uploading photos...' : 'Submitting...'}</>
            ) : (
              <><CheckCircle size={16} /> Submit End of Day Report</>
            )}
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">End time and location are required to submit.</p>
        </div>
      </div>
    </div>
  );
}

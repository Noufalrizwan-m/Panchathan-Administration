import React, { useState } from 'react';
import { 
  User, Truck, Compass, Fuel, Thermometer, Radio, 
  MapPin, AlertCircle, RefreshCw, BarChart2, ShieldCheck, Box
} from 'lucide-react';
import { Trip, Driver, Vehicle, TripProofPhoto } from '../types';
import { PanchathanTruckIllustration } from './BrandAssets';

interface ActiveTripTrackerProps {
  trip: Trip;
  driver?: Driver;
  vehicle?: Vehicle;
  onRefresh: () => void;
  onEmergencyStop?: () => void;
}

// Major checkpoints on the standard National Highway 48 (Bangalore -> Chennai)
const CHECKPOINTS = [
  { name: 'Bengaluru, KA', lat: 12.9716, lng: 77.5946, x: 15, y: 15 },
  { name: 'Kolar Bypass, KA', lat: 13.1378, lng: 78.1344, x: 32, y: 22 },
  { name: 'Vellore Hub, TN', lat: 12.9165, lng: 79.1325, x: 55, y: 38 },
  { name: 'Kanchipuram, TN', lat: 12.8342, lng: 79.7036, x: 75, y: 44 },
  { name: 'Chennai Central, TN', lat: 13.0827, lng: 80.2707, x: 92, y: 50 },
];

export const ActiveTripTracker: React.FC<ActiveTripTrackerProps> = ({
  trip,
  driver,
  vehicle,
  onRefresh,
  onEmergencyStop
}) => {
  const [activeTab, setActiveTab] = useState<'MAP' | 'CARGO'>('MAP');
  const [manualUpdating, setManualUpdating] = useState(false);
  const [manualMsg, setManualMsg] = useState<string | null>(null);
  const [locationLogs, setLocationLogs] = useState<any[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<TripProofPhoto | null>(null);

  // Compute marker position from real GPS coordinates (lat/lng) mapped into SVG coords
  const cpXs = CHECKPOINTS.map(c => c.x);
  const cpYs = CHECKPOINTS.map(c => c.y);
  const cpLats = CHECKPOINTS.map(c => c.lat);
  const cpLngs = CHECKPOINTS.map(c => c.lng);

  const minX = Math.min(...cpXs);
  const maxX = Math.max(...cpXs);
  const minY = Math.min(...cpYs);
  const maxY = Math.max(...cpYs);
  const minLat = Math.min(...cpLats, trip.telematics.location.latitude);
  const maxLat = Math.max(...cpLats, trip.telematics.location.latitude);
  const minLng = Math.min(...cpLngs, trip.telematics.location.longitude);
  const maxLng = Math.max(...cpLngs, trip.telematics.location.longitude);

  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

  const latNorm = maxLat - minLat === 0 ? 0.5 : clamp01((trip.telematics.location.latitude - minLat) / (maxLat - minLat));
  // SVG y increases downwards, so invert latitude mapping to keep north up
  const lngNorm = maxLng - minLng === 0 ? 0.5 : clamp01((trip.telematics.location.longitude - minLng) / (maxLng - minLng));

  const truckX = minX + (maxX - minX) * lngNorm;
  const truckY = maxY - (maxY - minY) * latNorm;

  const handleManualUpdate = async () => {
    if (!trip || !trip.driverId) return;
    if (!('geolocation' in navigator)) {
      setManualMsg('Geolocation not available');
      return;
    }
    setManualUpdating(true);
    setManualMsg(null);
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const { latitude, longitude } = position.coords;

        // Post driver location log (no generic string address)
        await fetch(`/api/drivers/${trip.driverId}/location`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude, longitude, timestamp: new Date().toISOString(), address: '' })
        });

        // Update trip telematics as well (send blank address; UI will show area names)
        await fetch(`/api/trips/${trip.id}/update-telematics`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ location: { latitude, longitude, address: '' }, speed: trip.telematics.speed })
        });

        setManualMsg('Manual location updated');
      } catch (err: any) {
        setManualMsg(err?.message || 'Update failed');
      } finally {
        setManualUpdating(false);
      }
    }, (err) => {
      setManualMsg(err?.message || 'Could not obtain location');
      setManualUpdating(false);
    }, { enableHighAccuracy: true, timeout: 8000, maximumAge: 3000 });
  };

  // Fetch recent location logs for this driver and build route
  const fetchLocationLogs = async () => {
    if (!trip?.driverId) return;
    try {
      const today = new Date().toISOString().slice(0,10);
      const res = await fetch(`/api/drivers/${trip.driverId}/locations?date=${today}`);
      if (!res.ok) return;
      const data = await res.json();
      setLocationLogs(data.logs || []);
    } catch (err) {
      // ignore
    }
  };

  // Poll for location logs to update route in near-real-time
  React.useEffect(() => {
    fetchLocationLogs();
    const iv = setInterval(() => fetchLocationLogs(), 5000);
    return () => clearInterval(iv);
  }, [trip?.driverId]);

  // Build SVG path string from logs
  const buildPathFromLogs = () => {
    if (!locationLogs || locationLogs.length === 0) return '';
    // derive bounds from logs and include telematics location
    const pts = locationLogs.map(l => ({ lat: l.latitude, lng: l.longitude }));
    // include current telematics if present
    pts.push({ lat: trip.telematics.location.latitude, lng: trip.telematics.location.longitude });

    const lats = pts.map(p => p.lat);
    const lngs = pts.map(p => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const mapPoint = (lat: number, lng: number) => {
      const x = 8 + ((lng - minLng) / (maxLng - minLng || 1)) * 84; // map to 8..92
      const y = 6 + (1 - ((lat - minLat) / (maxLat - minLat || 1))) * 48; // map to 6..54
      return { x, y };
    };

    const path = locationLogs.map((l, idx) => {
      const p = mapPoint(l.latitude, l.longitude);
      return `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
    }).join(' ');

    return path;
  };

  const svgPath = buildPathFromLogs();
  // Helper: find nearest checkpoint name for a lat/lng
  const nearestCheckpointName = (lat: number, lng: number) => {
    let best = { name: '', dist: Number.MAX_VALUE };
    for (const cp of CHECKPOINTS) {
      const dlat = cp.lat - lat;
      const dlng = cp.lng - lng;
      const dist = Math.sqrt(dlat * dlat + dlng * dlng);
      if (dist < best.dist) best = { name: cp.name, dist };
    }
    return best.name;
  };

  const labelForLog = (log: any, fallback: string) => {
    const addr = log?.address && String(log.address).trim();
    if (addr && addr.length > 3) return addr;
    // otherwise derive nearest checkpoint/city
    return nearestCheckpointName(log.latitude, log.longitude) || fallback;
  };

  const startLabel = locationLogs.length ? labelForLog(locationLogs[0], trip.origin) : trip.origin;
  const endLabel = locationLogs.length ? labelForLog(locationLogs[locationLogs.length-1], trip.destination) : trip.destination;

  const downloadWaybill = () => {
    const payload = {
      tripId: trip.id,
      origin: trip.origin,
      destination: trip.destination,
      manifest: trip.manifest,
      truckId: trip.truckId,
      driverId: trip.driverId
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `waybill-${trip.id}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="trip-tracker-root" className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">

      {/* HEADER: Trip summary + actions */}
      <div className="lg:col-span-3">
        <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-slate-600">TRIP {trip.id}</div>
            <div className="mt-1 text-lg font-extrabold text-slate-900">{trip.origin} <span className="text-amber-500 mx-2">→</span> {trip.destination}</div>
            <div className="text-[12px] text-slate-500 mt-1">Vehicle: <span className="font-bold text-slate-800">{trip.truckId}</span> • Driver: <span className="font-bold text-slate-800">{driver?.name || '—'}</span></div>
          </div>
          <div className="flex items-center gap-3">
            {onEmergencyStop && (
              <button onClick={onEmergencyStop} className="px-3 py-2 border rounded text-sm bg-rose-50 text-rose-700">Emergency Protocol</button>
            )}
            <button onClick={downloadWaybill} className="px-3 py-2 bg-slate-900 text-white rounded text-sm">Download Waybill</button>
          </div>
        </div>
      </div>
      
      {/* LEFT COLUMN: Map tracker & Telematics HUD */}
      <div className="lg:col-span-2 flex flex-col space-y-6">
        
        {/* LEADER BOARD MAP PANEL (map-like, non-boxy) */}
        <div id="gis-radar-card" className="relative overflow-hidden flex-1 min-h-[420px] flex flex-col justify-between text-slate-800 p-0 bg-gradient-to-b from-[#ecf9f3]/40 to-transparent">
          
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 z-10 relative">
            <div>
              <h2 className="text-sm font-extrabold text-[#1E5E3A] uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-[#1E5E3A] animate-pulse" />
                NH-48 Corridor Satellite GIS Tracking
              </h2>
              <p className="text-[11px] text-slate-500 font-mono">
                Real-time mobile transmitter location: Lat <span className="text-[#1E5E3A] font-bold">{trip.telematics.location.latitude.toFixed(4)}</span>, Lng <span className="text-[#1E5E3A] font-bold">{trip.telematics.location.longitude.toFixed(4)}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                _id="btn-refresh-telematics"
                onClick={onRefresh}
                className="p-1.5 bg-slate-50 border border-slate-250 text-slate-500 hover:text-[#1E5E3A] rounded-lg transition-colors cursor-pointer"
                title="Force Feed Refresh"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleManualUpdate}
                disabled={manualUpdating}
                className="p-1.5 bg-white border border-slate-200 text-slate-600 hover:text-[#1E5E3A] rounded-lg transition-colors cursor-pointer text-xs"
                title="Manual location update from this browser"
              >
                {manualUpdating ? 'Updating...' : 'Manual update'}
              </button>
            </div>
          </div>

          {/* VIRTUAL HIGHWAY SVG MAP PANEL */}
          <div className="flex-1 my-4 bg-slate-50 border border-slate-200 rounded-xl relative overflow-hidden flex items-center justify-center p-2 min-h-[220px]">
              {/* GIS SVG Canvas (full-bleed) */}
              <svg className="w-full h-full min-h-[420px]" viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Dynamic route built from driver location logs */}
                {svgPath ? (
                  <>
                    <path d={svgPath} stroke="#1E5E3A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.12" />
                    <path d={svgPath} id="satellite-highway-path" stroke="#1E5E3A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.9" fill="none" />

                    {/* render intermediate points */}
                    {locationLogs.map((l, i) => {
                      const pts = (() => {
                        const lats = locationLogs.map(x => x.latitude).concat([trip.telematics.location.latitude]);
                        const lngs = locationLogs.map(x => x.longitude).concat([trip.telematics.location.longitude]);
                        const minLat = Math.min(...lats);
                        const maxLat = Math.max(...lats);
                        const minLng = Math.min(...lngs);
                        const maxLng = Math.max(...lngs);
                        const x = 8 + ((l.longitude - minLng) / (maxLng - minLng || 1)) * 84;
                        const y = 6 + (1 - ((l.latitude - minLat) / (maxLat - minLat || 1))) * 48;
                        return { x, y };
                      })();
                      return (
                        <g key={l.id || i}>
                          <circle cx={pts.x} cy={pts.y} r="1.2" fill="#ffffff" stroke="#1E5E3A" strokeWidth="0.5" />
                        </g>
                      );
                    })}

                    {/* start / end labels */}
                    {locationLogs[0] && (() => {
                      const first = locationLogs[0];
                      const lats = locationLogs.map(x => x.latitude).concat([trip.telematics.location.latitude]);
                      const lngs = locationLogs.map(x => x.longitude).concat([trip.telematics.location.longitude]);
                      const minLat = Math.min(...lats);
                      const maxLat = Math.max(...lats);
                      const minLng = Math.min(...lngs);
                      const maxLng = Math.max(...lngs);
                      const x = 8 + ((first.longitude - minLng) / (maxLng - minLng || 1)) * 84;
                      const y = 6 + (1 - ((first.latitude - minLat) / (maxLat - minLat || 1))) * 48;
                      return (
                        <g>
                          <text x={x} y={y - 3} textAnchor="middle" fill="#065f46" fontSize="1.8" fontFamily="sans-serif" fontWeight="700">Start: {startLabel}</text>
                        </g>
                      );
                    })()}

                    {locationLogs.length > 0 && (() => {
                      const last = locationLogs[locationLogs.length - 1];
                      const lats = locationLogs.map(x => x.latitude).concat([trip.telematics.location.latitude]);
                      const lngs = locationLogs.map(x => x.longitude).concat([trip.telematics.location.longitude]);
                      const minLat = Math.min(...lats);
                      const maxLat = Math.max(...lats);
                      const minLng = Math.min(...lngs);
                      const maxLng = Math.max(...lngs);
                      const x = 8 + ((last.longitude - minLng) / (maxLng - minLng || 1)) * 84;
                      const y = 6 + (1 - ((last.latitude - minLat) / (maxLat - minLat || 1))) * 48;
                      return (
                        <g>
                          <text x={x} y={y - 3} textAnchor="middle" fill="#065f46" fontSize="1.8" fontFamily="sans-serif" fontWeight="700">End: {endLabel}</text>
                        </g>
                      );
                    })()}

                    {/* current truck marker from telematics */}
                    {(() => {
                      const lats = locationLogs.map(x => x.latitude).concat([trip.telematics.location.latitude]);
                      const lngs = locationLogs.map(x => x.longitude).concat([trip.telematics.location.longitude]);
                      const minLat = Math.min(...lats);
                      const maxLat = Math.max(...lats);
                      const minLng = Math.min(...lngs);
                      const maxLng = Math.max(...lngs);
                      const x = 8 + ((trip.telematics.location.longitude - minLng) / (maxLng - minLng || 1)) * 84;
                      const y = 6 + (1 - ((trip.telematics.location.latitude - minLat) / (maxLat - minLat || 1))) * 48;
                      return (
                        <g className="transition-all duration-500 ease-out">
                          <circle cx={x} cy={y} r="3" fill="#1E5E3A" fillOpacity="0.18" />
                          <circle cx={x} cy={y} r="1.6" fill="#1E5E3A" stroke="#fff" strokeWidth="0.4" />
                          <rect x={x + 3} y={y - 5} width="26" height="6.5" rx="1" fill="#065f46" stroke="#fff" strokeWidth="0.3" />
                          <text x={x + 4} y={y - 1.5} fill="#fff" fontSize="1.6" fontFamily="sans-serif" fontWeight="700">{trip.truckId}</text>
                        </g>
                      );
                    })()}
                  </>
                ) : (
                  // fallback: still show static checkpoints if no logs available
                  <>
                    <path 
                      d="M 15 15 Q 40 10, 55 38 T 92 50" 
                      stroke="#1E5E3A" 
                      strokeWidth="2.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeOpacity="0.1" 
                      className="blur-sm"
                    />
                    <path 
                      id="satellite-highway-path"
                      d="M 15 15 Q 40 10, 55 38 T 92 50" 
                      stroke="#1E5E3A" 
                      strokeWidth="1.25" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeOpacity="0.6" 
                    />
                    {CHECKPOINTS.map((cp, idx) => (
                      <g key={cp.name} className="cursor-pointer">
                        <circle cx={cp.x} cy={cp.y} r="2" fill="#fff" stroke="#1E5E3A" strokeWidth="0.75" />
                        <circle cx={cp.x} cy={cp.y} r="0.75" fill="#facc15" />
                        <text 
                          x={cp.x} 
                          y={cp.y - 3.5} 
                          textAnchor="middle" 
                          fill="#475569" 
                          fontSize="1.8" 
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {cp.name}
                        </text>
                      </g>
                    ))}
                  </>
                )}

            </svg>

            {/* Float visual compass */}
            <div className="absolute bottom-4 left-4 bg-black/20 backdrop-blur-sm rounded px-3 py-1 flex items-center gap-2 text-[11px] text-white/90">
              <Compass className="w-3.5 h-3.5 text-white/90" style={{ animationDuration: '6s' }} />
              <span className="font-bold text-[11px]">NH-48 Corridor</span>
            </div>
            {manualMsg && (
              <div className="absolute top-4 right-4 bg-black/20 backdrop-blur-sm rounded px-3 py-1 text-xs text-white/90">
                {manualMsg}
              </div>
            )}
          </div>
          <div className="absolute bottom-3 right-3 text-xs text-white/80 bg-black/10 backdrop-blur-sm rounded px-3 py-1">
            <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-white/70" /> <span>Beacon: online • 5s</span></div>
          </div>

        </div>

        {/* SUMMARY PANELS (arrival, departure, completion, telematics snapshot) */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs">
            <div className="text-[11px] text-slate-500 uppercase font-bold">Arrival & Timing</div>
            <div className="mt-2 font-black text-sm text-slate-800">Actual in time</div>
            <div className="text-[12px] text-slate-500">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Today</div>
            <div className="mt-2 text-[12px] text-slate-600">Loading duration <span className="font-bold">01h 12m</span></div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs">
            <div className="text-[11px] text-slate-500 uppercase font-bold">Estimated Departure</div>
            <div className="mt-2 font-black text-sm text-slate-800">Target out time</div>
            <div className="text-[12px] text-slate-500">10:30 AM Today</div>
            <div className="mt-2 text-[12px] text-emerald-700 font-bold">Schedule adherence: ON TIME</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs flex flex-col justify-center items-center">
            <div className="text-[11px] text-slate-500 uppercase font-bold">Trip Completion</div>
            <div className="mt-3 text-2xl font-extrabold text-slate-800">{Math.round(((trip.totalKm - (trip.remainingKm||0)) / (trip.totalKm||1)) * 100)}%</div>
            <div className="text-[11px] text-slate-500 mt-1">{trip.totalKm - (trip.remainingKm||0)} km of {trip.totalKm} km covered</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs">
            <div className="text-[11px] text-slate-500 uppercase font-bold">Real-time i-Alert</div>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <div className="text-2xl font-extrabold text-[#1E5E3A]">{trip.telematics.speed} <span className="text-sm">km/h</span></div>
                <div className="text-[12px] text-slate-500">Speed</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-[#1E5E3A]">{trip.telematics.fuelLevel}<span className="text-sm">%</span></div>
                <div className="text-[12px] text-slate-500">Fuel</div>
              </div>
            </div>
          </div>
        </div>

        {/* ANALOG GAUGES & MULTI-TELEMETRICS INDICATORS */}
        <div id="analog-gauges-grid" className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          
          {/* SPEED CONSOLE */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden text-slate-800">
            <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase font-bold">Tachometer</span>
            <div className="my-2 text-center">
              <div className="text-3xl font-extrabold text-[#1E5E3A] font-mono">{trip.telematics.speed}</div>
              <span className="text-[10px] font-mono text-slate-400">KM / HOUR</span>
            </div>
            <div className="w-full h-1 bg-slate-250 rounded-full overflow-hidden mt-1">
              <div 
                className={`h-full transition-all duration-300 ${
                  trip.telematics.speed > 80 ? 'bg-rose-500' : trip.telematics.speed > 60 ? 'bg-amber-400' : 'bg-[#1E5E3A]'
                }`}
                style={{ width: `${Math.min(100, (trip.telematics.speed / 110) * 100)}%` }}
              />
            </div>
          </div>

          {/* FUEL LEVEL */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden text-slate-800">
            <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase font-bold">Fuel Capacity</span>
            <div className="my-2 text-center">
              <div className="text-3xl font-extrabold text-[#1E5E3A] font-mono flex justify-center items-baseline">
                {trip.telematics.fuelLevel}<span className="text-xs text-slate-400 font-normal">%</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">TANK LEVEL</span>
            </div>
            <div className="w-full h-1 bg-slate-250 rounded-full overflow-hidden mt-1">
              <div 
                className="h-full bg-emerald-600 transition-all duration-500"
                style={{ width: `${trip.telematics.fuelLevel}%` }}
              />
            </div>
          </div>

          {/* TEMPERATURE INDEX */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden text-slate-800">
            <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase font-bold">Core Radiator</span>
            <div className="my-2 text-center">
              <div className="text-3xl font-extrabold text-[#A57C1E] font-mono flex justify-center items-baseline">
                {trip.telematics.engineTemp}<span className="text-xs text-slate-400 font-normal">°C</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">ENGINE CALIBRATION</span>
            </div>
            <div className="w-full h-1 bg-slate-250 rounded-full overflow-hidden mt-1">
              <div 
                className={`h-full transition-all duration-300 ${
                  trip.telematics.engineTemp > 95 ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, (trip.telematics.engineTemp / 120) * 100)}%` }}
              />
            </div>
          </div>

          {/* COMPLIANT STATUS GAUGE */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden text-slate-800">
            <span className="text-[10px] font-mono tracking-wider text-slate-500 uppercase font-bold">Consolidated Alert</span>
            <div className="my-1.5 flex flex-col items-center justify-center">
              {trip.telematics.tirePressure.warning ? (
                <>
                  <AlertCircle className="w-6 h-6 text-rose-500 animate-bounce mb-1" />
                  <span className="text-[10px] font-mono text-rose-600 text-center uppercase leading-tight font-bold">
                    PRESSURE ALERT
                  </span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-6 h-6 text-[#1E5E3A] mb-1" />
                  <span className="text-[10px] font-mono text-[#1E5E3A] text-center uppercase leading-tight font-bold">
                    ROUTING SECURE
                  </span>
                </>
              )}
            </div>
            <div className="text-[9px] font-mono text-slate-450 text-center border-t border-slate-100 pt-1 font-bold italic">
              {trip.telematics.tirePressure.warning || 'All wheels compliant'}
            </div>
          </div>

        </div>

      </div>

      {/* RIGHT COLUMN: Sidebar detailed spec panel */}
      <div className="lg:col-span-1 flex flex-col space-y-6">
        
        {/* TAB CONTROLLERS OVER CARGO & CREW DETAILS */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 flex-1 flex flex-col space-y-4 text-slate-800">
          
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => setActiveTab('MAP')}
              className={`flex-1 pb-3 text-xs font-sans font-extrabold tracking-wider uppercase border-b-2 text-center transition-all cursor-pointer ${
                activeTab === 'MAP' 
                  ? 'border-[#1E5E3A] text-[#1E5E3A]' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              VOYAGE SPEC
            </button>
            <button
              onClick={() => setActiveTab('CARGO')}
              className={`flex-1 pb-3 text-xs font-sans font-extrabold tracking-wider uppercase border-b-2 text-center transition-all cursor-pointer ${
                activeTab === 'CARGO' 
                  ? 'border-[#1E5E3A] text-[#1E5E3A]' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              CARGO MANIFEST
            </button>
          </div>

          {activeTab === 'MAP' ? (
            <div id="voyage-spec-subpane" className="space-y-4 font-sans text-xs">
              
              {/* DRIVER METRICS PANEL */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1 font-mono">
                  <User className="w-3.5 h-3.5 text-[#1E5E3A]" /> Crew Captain
                </h4>
                {driver ? (
                  <div className="flex items-center gap-3">
                    <img 
                      src={driver.avatar} 
                      alt={driver.name} 
                      className="w-10 h-10 rounded-full border border-slate-200 object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="text-slate-800 font-extrabold text-sm">{driver.name}</div>
                      <div className="text-[10px] text-slate-450 mt-0.5 leading-normal font-mono font-bold">
                        REGISTRATION ID: {driver.id} <br />
                        LICENSE: {driver.licenseNumber}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No detailed driver registered.</p>
                )}
              </div>

              {/* TRUCK DEPLOYMENT DETAILS */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1 font-mono">
                  <Truck className="w-3.5 h-3.5 text-[#A57C1E]" /> Hauler Asset
                </h4>
                {vehicle ? (
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase font-mono font-bold text-[9px]">FLEET VEHICLE:</span>
                      <span className="text-slate-800 font-bold">{vehicle.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase font-mono font-bold text-[9px]">PLATE CODE:</span>
                      <span className="text-[#1E5E3A] font-bold font-mono">{vehicle.plate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase font-mono font-bold text-[9px]">ENGINE COMBUSTION:</span>
                      <span className="text-slate-705 font-semibold font-mono">{vehicle.model}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 uppercase font-mono font-bold text-[9px]">RTO STICKERS:</span>
                      <span className="text-emerald-700 font-bold">VERIFIED</span>
                    </div>
                    {/* Real-time Truck photo asset */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden mt-3 shadow-xs">
                      <PanchathanTruckIllustration className="h-24 w-full" />
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No assigned vessel.</p>
                )}
              </div>

              {/* SPEED SAFETY TIRE INDEX DISPLAY */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono">
                  Tire Safety Index Check
                </h4>
                <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-mono">
                  <div className={`p-1.5 rounded border ${
                    trip.telematics.tirePressure.frontLeft < 33 
                      ? 'bg-rose-50 border-rose-250 text-rose-700 animate-pulse font-bold' 
                      : 'bg-white border-slate-200 text-slate-650'
                  }`}>
                    FL: {trip.telematics.tirePressure.frontLeft} PSI
                  </div>
                  <div className="p-1.5 rounded bg-white border border-slate-200 text-slate-650">
                    FR: {trip.telematics.tirePressure.frontRight} PSI
                  </div>
                  <div className="p-1.5 rounded bg-white border border-slate-200 text-slate-650">
                    RL: {trip.telematics.tirePressure.rearLeft} PSI
                  </div>
                  <div className="p-1.5 rounded bg-white border border-slate-200 text-slate-650">
                    RR: {trip.telematics.tirePressure.rearRight} PSI
                  </div>
                </div>
              </div>

              {/* PROOF PHOTOS */}
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Proof Photos</h4>
                {trip.proofPhotos && trip.proofPhotos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {trip.proofPhotos.slice().reverse().map((photo) => (
                      <div key={photo.uploadedAt + photo.fileName} className="rounded overflow-hidden border">
                        <img onClick={() => setSelectedPhoto(photo)} src={photo.dataUrl as any} alt={`${photo.kind} proof`} className="w-full h-20 object-cover cursor-pointer" referrerPolicy="no-referrer" />
                        <div className="p-2 text-[10px] font-mono text-slate-600">
                          <div className="font-bold text-slate-800">{photo.kind}</div>
                          <div>{new Date(photo.uploadedAt).toLocaleString()}</div>
                          <div className="text-[10px] text-slate-500">{photo.location?.address || 'No address'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No proof photos uploaded yet.</p>
                )}
              </div>

            </div>
          ) : (
            <div id="manifest-cargo-subpane" className="space-y-3 font-sans text-xs flex-1 flex flex-col justify-between">
              
              <div className="space-y-2.5">
                {trip.manifest.map((item, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-2 hover:border-[#1E5E3A] transition-all">
                    <div className="space-y-0.5">
                      <div className="text-slate-800 font-bold text-xs flex items-center gap-1">
                        <Box className="w-3.5 h-3.5 text-slate-400" />
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-455 font-bold font-mono">
                        CLASS: {item.type} | QTY: {item.quantity}
                      </div>
                    </div>
                    <span className="text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-750 border border-emerald-200">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* Consolidated Bill of Lading stamp */}
              <div className="border border-dashed border-slate-300 rounded-lg p-3 text-center text-[10px] space-y-1.5 mt-4 self-end w-full bg-slate-50/50">
                <span className="text-[#A57C1E] block uppercase tracking-wider font-bold font-mono">Consolidated Waybill Summary</span>
                <p className="text-slate-450 leading-relaxed">STAMP VERIFIED SEALS AT BENGALURU TERMINAL SECURELY. ALL EXPORTS COMPLY CO-2 CARBON REDUCTION PROTOCOLS.</p>
              </div>

            </div>
          )}

          {/* EMERGENCY PANIC OPTION */}
          {onEmergencyStop && (
            <div className="border-t border-slate-200 pt-4 mt-auto">
              <button
                id="btn-pan-emergency"
                onClick={onEmergencyStop}
                className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-250 text-rose-700 transition-colors rounded-lg text-xs font-mono font-extrabold tracking-widest uppercase cursor-pointer"
              >
                DISPATCH BROADCAST EMERGENCY
              </button>
            </div>
          )}

        </div>

      </div>

            {selectedPhoto && (
              <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4" onClick={() => setSelectedPhoto(null)}>
                <div className="max-w-3xl w-full bg-transparent rounded" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end mb-2">
                    <button onClick={() => setSelectedPhoto(null)} className="text-white bg-black/30 px-3 py-1 rounded">Close</button>
                  </div>
                  <div className="bg-white rounded p-2">
                    <img src={selectedPhoto.dataUrl as any} alt={selectedPhoto.fileName} className="w-full h-auto max-h-[80vh] object-contain" />
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                      <div>
                        <div className="font-bold">{selectedPhoto.kind}</div>
                        <div>{new Date(selectedPhoto.uploadedAt).toLocaleString()}</div>
                        <div className="text-[12px] text-slate-500">{selectedPhoto.location?.address || 'No address available'}</div>
                      </div>
                      <div>
                        <a href={selectedPhoto.dataUrl as any} download={selectedPhoto.fileName} className="text-sm px-3 py-1 border rounded bg-[#f3f4f6]">Download</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
    </div>
  );
};

  // Photo viewer modal rendered at end of file to keep component clean
  const PhotoViewer: React.FC<{ photo: TripProofPhoto | null; onClose: () => void }> = ({ photo, onClose }) => {
    if (!photo) return null;
    return (
      <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4">
        <div className="max-w-3xl w-full bg-transparent rounded">
          <div className="flex justify-end mb-2">
            <button onClick={onClose} className="text-white bg-black/30 px-3 py-1 rounded">Close</button>
          </div>
          <div className="bg-white rounded p-2">
            <img src={photo.dataUrl as any} alt={photo.fileName} className="w-full h-auto max-h-[80vh] object-contain" />
            <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
              <div>
                <div className="font-bold">{photo.kind}</div>
                <div>{new Date(photo.uploadedAt).toLocaleString()}</div>
                <div className="text-[12px] text-slate-500">{photo.location?.address || 'No address available'}</div>
              </div>
              <div>
                <a href={photo.dataUrl as any} download={photo.fileName} className="text-sm px-3 py-1 border rounded bg-[#f3f4f6]">Download</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

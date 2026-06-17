import React, { useState } from 'react';
import { Truck, AlertCircle, CheckCircle, Camera, ChevronDown, ChevronUp, Phone, Building2, ArrowRight, X, Download, Calendar } from 'lucide-react';
import { Trip } from '../types';

interface TaskCardProps {
  key?: React.Key;
  trip: Trip;
  onStartTask: (tripId: string) => void;
  onUploadPhoto: (tripId: string, kind: 'PICKUP' | 'DELIVERY', file: File) => void;
  onMarkIncomplete: (tripId: string, reason: string) => void;
  onMarkComplete?: (tripId: string) => void;
  uploading?: boolean;
}

const STAGE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  Upcoming:   { label: 'Upcoming',     color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-400' },
  Ongoing:    { label: 'In Progress',  color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-400' },
  Completed:  { label: 'Completed',    color: 'text-green-600',  bg: 'bg-green-50',  border: 'border-green-500' },
  Incomplete: { label: 'Incomplete',   color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-400' },
};

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PICKUP:   { label: 'PICKUP',          color: 'text-blue-700',   bg: 'bg-blue-100' },
  DELIVERY: { label: 'DELIVERY',        color: 'text-green-700',  bg: 'bg-green-100' },
  BOTH:     { label: 'PICKUP + DELIVERY', color: 'text-purple-700', bg: 'bg-purple-100' },
};

function formatAssignedDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffH = Math.floor(diffMs / 3_600_000);
  if (diffH < 1) return 'Just now';
  if (diffH < 24 && d.toDateString() === now.toDateString())
    return 'Today ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

export function TaskCard({ trip, onStartTask, onUploadPhoto, onMarkIncomplete, onMarkComplete, uploading }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [remarkText, setRemarkText] = useState('');
  const [showRemarkBox, setShowRemarkBox] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; fileName: string } | null>(null);

  function openPhoto(src: string, fileName = 'photo.jpg') {
    if (src) setLightbox({ src, fileName });
  }
  function downloadPhoto(src: string, fileName = 'photo.jpg') {
    const a = document.createElement('a');
    a.href = src; a.download = fileName; a.click();
  }

  const stage = trip.taskStage || 'Upcoming';
  const stageConf = STAGE_CONFIG[stage] || STAGE_CONFIG.Upcoming;
  const taskType = trip.taskType || 'PICKUP';
  const typeConf = TYPE_CONFIG[taskType] || TYPE_CONFIG.PICKUP;

  const hasPickupPhoto   = trip.proofPhotos?.some(p => p.kind === 'PICKUP') ?? false;
  const hasDeliveryPhoto = trip.proofPhotos?.some(p => p.kind === 'DELIVERY') ?? false;

  // What this task requires
  const needsPickup   = taskType === 'PICKUP'   || taskType === 'BOTH';
  const needsDelivery = taskType === 'DELIVERY' || taskType === 'BOTH';

  // Can mark complete only when required photos are done
  const canComplete = (!needsPickup || hasPickupPhoto) && (!needsDelivery || hasDeliveryPhoto);

  function handleFileInput(kind: 'PICKUP' | 'DELIVERY') {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) onUploadPhoto(trip.id, kind, file);
    };
    input.click();
  }

  function handleIncomplete() {
    if (!remarkText.trim()) return;
    onMarkIncomplete(trip.id, remarkText.trim());
    setRemarkText('');
    setShowRemarkBox(false);
  }

  const packagePhotoUrl = trip.packagePhoto?.dataUrl
    || (trip.packagePhoto?.filePath ? `/${trip.packagePhoto.filePath.replace(/\\/g, '/')}` : undefined);

  return (
    <div className={`bg-white rounded-xl shadow-sm border-l-4 ${stageConf.border} overflow-hidden mb-3`}>

      {/* ── Header (always visible, tap to expand) ── */}
      <div className="flex items-start justify-between p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex-1 min-w-0">

          {/* Badges row */}
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${typeConf.bg} ${typeConf.color}`}>
              {typeConf.label}
            </span>
            {trip.porter?.enabled && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">PORTER</span>
            )}
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stageConf.bg} ${stageConf.color}`}>
              {stageConf.label}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              trip.priority === 'High'   ? 'bg-red-100 text-red-700' :
              trip.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                           'bg-gray-100 text-gray-600'
            }`}>{trip.priority}</span>
          </div>

          {/* Address */}
          {taskType === 'BOTH' ? (
            <div className="space-y-0.5">
              <div className="text-xs text-blue-600 font-medium uppercase tracking-wide">Pickup from</div>
              <div className="text-sm font-semibold text-gray-800 truncate">{trip.origin}</div>
              {trip.destination && trip.destination !== trip.origin && (
                <>
                  <div className="flex items-center gap-1 mt-0.5">
                    <ArrowRight size={10} className="text-gray-400" />
                    <div className="text-xs text-green-600 font-medium uppercase tracking-wide">Deliver to</div>
                  </div>
                  <div className="text-sm font-semibold text-gray-700 truncate">{trip.destination}</div>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="text-sm font-semibold text-gray-800 truncate">{trip.origin}</div>
              {trip.destination && trip.destination !== trip.origin && (
                <div className="text-xs text-gray-500 truncate mt-0.5 flex items-center gap-1">
                  <ArrowRight size={10} /> {trip.destination}
                </div>
              )}
            </>
          )}

          {/* Customer name */}
          {trip.customerName && (
            <div className="flex items-center gap-1 mt-1">
              <Building2 size={11} className="text-purple-500" />
              <span className="text-xs font-semibold text-purple-600">{trip.customerName}</span>
            </div>
          )}

          {/* Courier + POD */}
          {trip.courierName && (
            <div className="flex items-center gap-1 mt-1">
              <Truck size={11} className="text-gray-400" />
              <span className="text-xs text-gray-500">{trip.courierName}</span>
              {trip.podNumber && <span className="text-xs text-gray-400 font-mono">#{trip.podNumber}</span>}
            </div>
          )}

          {/* Assignment / status date */}
          {trip.lastUpdated && (
            <div className="flex items-center gap-1 mt-1">
              <Calendar size={9} className="text-gray-300" />
              <span className="text-[10px] text-gray-400">
                {stage === 'Completed' ? 'Completed' :
                 stage === 'Ongoing'   ? 'Started' :
                 stage === 'Incomplete'? 'Incomplete since' :
                                        'Assigned'}{' '}
                {formatAssignedDate(trip.lastUpdated)}
              </span>
            </div>
          )}

          {/* Photo progress indicator (Ongoing only) */}
          {stage === 'Ongoing' && (
            <div className="flex items-center gap-2 mt-2">
              {needsPickup && (
                <div className={`flex items-center gap-1 text-[11px] font-semibold ${hasPickupPhoto ? 'text-green-600' : 'text-gray-400'}`}>
                  {hasPickupPhoto ? <CheckCircle size={12} /> : <Camera size={12} />}
                  Pickup
                </div>
              )}
              {needsPickup && needsDelivery && <span className="text-gray-300 text-xs">·</span>}
              {needsDelivery && (
                <div className={`flex items-center gap-1 text-[11px] font-semibold ${hasDeliveryPhoto ? 'text-green-600' : 'text-gray-400'}`}>
                  {hasDeliveryPhoto ? <CheckCircle size={12} /> : <Camera size={12} />}
                  Delivery
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 ml-2 shrink-0">
          {packagePhotoUrl && (
            <button onClick={e => { e.stopPropagation(); openPhoto(packagePhotoUrl, trip.packagePhoto?.fileName || 'package.jpg'); }}>
              <img src={packagePhotoUrl} alt="Package" className="w-10 h-10 rounded-lg object-cover border border-gray-200 active:opacity-70 transition-opacity" />
            </button>
          )}
          {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </div>

      {/* ── Expanded section ── */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">

          {/* Porter details */}
          {trip.porter?.enabled && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 space-y-1">
              <div className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-2">
                Porter — {trip.porter.porterTaskType === 'collect' ? 'Collect from Porter' : 'Send via Porter'}
              </div>
              {trip.porter.bookingId && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Booking ID</span>
                  <span className="font-mono font-semibold">{trip.porter.bookingId}</span>
                </div>
              )}
              {trip.porter.trackingNumber && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Tracking</span>
                  <span className="font-mono font-semibold">{trip.porter.trackingNumber}</span>
                </div>
              )}
              {trip.porter.contactNumber && (
                <div className="flex items-center gap-2 text-xs mt-1">
                  <Phone size={12} className="text-orange-600" />
                  <a href={`tel:${trip.porter.contactNumber}`} className="text-orange-700 font-semibold">{trip.porter.contactNumber}</a>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {trip.pickupNotes && (
            <div className="text-xs text-gray-600 bg-gray-50 rounded-xl p-2.5">
              <span className="font-semibold text-gray-700">Note: </span>{trip.pickupNotes}
            </div>
          )}

          {/* Remark — only show for non-incomplete stages (incomplete block handles it separately) */}
          {trip.remark && stage !== 'Incomplete' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 text-xs text-red-700">
              <span className="font-semibold">Note: </span>{trip.remark}
            </div>
          )}

          {/* Proof photos already uploaded */}
          {(trip.proofPhotos || []).length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-2">Proof Photos <span className="font-normal text-gray-400">(tap to view)</span></div>
              <div className="flex gap-2 flex-wrap">
                {trip.proofPhotos!.map((p, i) => {
                  const src = p.dataUrl || (p.filePath ? `/${p.filePath.replace(/\\/g, '/')}` : '');
                  return (
                    <button
                      key={i}
                      className="relative active:opacity-70 transition-opacity"
                      onClick={() => openPhoto(src, p.fileName || `${p.kind.toLowerCase()}-photo.jpg`)}
                    >
                      <img src={src} alt={p.kind} className="w-16 h-16 rounded-xl object-cover border border-gray-200" />
                      <span className={`absolute -bottom-0.5 left-0 right-0 text-center text-[9px] font-bold rounded-b-xl pb-0.5 ${
                        p.kind === 'PICKUP' ? 'bg-blue-600/90 text-white' : 'bg-green-600/90 text-white'
                      }`}>{p.kind}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── ACTION BUTTONS ── */}
          {stage !== 'Completed' && stage !== 'Incomplete' && (
            <div className="space-y-2">

              {/* Start task */}
              {stage === 'Upcoming' && (
                <button
                  onClick={() => onStartTask(trip.id)}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all"
                >
                  Start Task
                </button>
              )}

              {stage === 'Ongoing' && (
                <>
                  {/* Photo buttons — only show what this task type needs */}
                  <div className={`grid gap-2 ${needsPickup && needsDelivery ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {needsPickup && (
                      <button
                        onClick={() => handleFileInput('PICKUP')}
                        disabled={uploading || hasPickupPhoto}
                        className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                          hasPickupPhoto
                            ? 'bg-green-100 text-green-700 border border-green-300 cursor-default'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {hasPickupPhoto ? <CheckCircle size={14} /> : <Camera size={14} />}
                        {hasPickupPhoto ? 'Pickup ✓' : 'Pickup Photo'}
                      </button>
                    )}

                    {needsDelivery && (
                      <button
                        onClick={() => handleFileInput('DELIVERY')}
                        disabled={uploading || hasDeliveryPhoto}
                        className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                          hasDeliveryPhoto
                            ? 'bg-green-100 text-green-700 border border-green-300 cursor-default'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {hasDeliveryPhoto ? <CheckCircle size={14} /> : <Camera size={14} />}
                        {hasDeliveryPhoto ? 'Delivered ✓' : 'Delivery Photo'}
                      </button>
                    )}
                  </div>

                  {/* Completion hint for BOTH tasks */}
                  {taskType === 'BOTH' && !canComplete && (
                    <div className="text-xs text-center text-gray-400">
                      {!hasPickupPhoto && !hasDeliveryPhoto
                        ? 'Upload pickup + delivery photos to complete'
                        : !hasPickupPhoto
                        ? 'Still need pickup photo'
                        : 'Still need delivery photo'}
                    </div>
                  )}

                  {/* Mark Complete — appears only when required photos are done */}
                  {canComplete && (
                    <button
                      onClick={() => onMarkComplete?.(trip.id)}
                      className="w-full py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle size={16} /> Mark as Completed
                    </button>
                  )}
                </>
              )}

              {/* Cannot Complete — always available when task is active */}
              <button
                onClick={() => setShowRemarkBox(!showRemarkBox)}
                className="w-full py-2 border border-red-300 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <AlertCircle size={14} /> Cannot Complete
              </button>

              {showRemarkBox && (
                <div className="space-y-2">
                  <textarea
                    value={remarkText}
                    onChange={e => setRemarkText(e.target.value)}
                    placeholder="Reason (e.g., address not found, customer not available, office closed)..."
                    className="w-full border border-gray-300 rounded-xl p-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
                    rows={3}
                  />
                  <button
                    onClick={handleIncomplete}
                    disabled={!remarkText.trim()}
                    className="w-full py-2 bg-red-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 active:scale-95 transition-all"
                  >
                    Submit Remark
                  </button>
                </div>
              )}
            </div>
          )}

          {stage === 'Completed' && (
            <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
              <CheckCircle size={16} /> Task completed
            </div>
          )}

          {stage === 'Incomplete' && (
            <div className="space-y-2">
              {/* Previous reason shown as context */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 text-xs text-red-600 flex items-center gap-2">
                <AlertCircle size={12} className="shrink-0" />
                <span>Previously marked incomplete{trip.remark ? `: "${trip.remark}"` : ''}</span>
              </div>

              {/* Start Again → goes directly to Ongoing */}
              <button
                onClick={() => onStartTask(trip.id)}
                className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                ↩ Start Again
              </button>

              {/* Upload any missing proof photos */}
              <div className={`grid gap-2 ${needsPickup && needsDelivery ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {needsPickup && (
                  <button
                    onClick={() => handleFileInput('PICKUP')}
                    disabled={uploading || hasPickupPhoto}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                      hasPickupPhoto
                        ? 'bg-green-100 text-green-700 border border-green-300 cursor-default'
                        : 'bg-blue-50 text-blue-700 border border-blue-300 hover:bg-blue-100'
                    }`}
                  >
                    {hasPickupPhoto ? <CheckCircle size={13} /> : <Camera size={13} />}
                    {hasPickupPhoto ? 'Pickup ✓' : 'Pickup Photo'}
                  </button>
                )}
                {needsDelivery && (
                  <button
                    onClick={() => handleFileInput('DELIVERY')}
                    disabled={uploading || hasDeliveryPhoto}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                      hasDeliveryPhoto
                        ? 'bg-green-100 text-green-700 border border-green-300 cursor-default'
                        : 'bg-green-50 text-green-700 border border-green-300 hover:bg-green-100'
                    }`}
                  >
                    {hasDeliveryPhoto ? <CheckCircle size={13} /> : <Camera size={13} />}
                    {hasDeliveryPhoto ? 'Delivered ✓' : 'Delivery Photo'}
                  </button>
                )}
              </div>

              {/* Mark Complete when all photos are done */}
              {canComplete && (
                <button
                  onClick={() => onMarkComplete?.(trip.id)}
                  className="w-full py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle size={16} /> Mark as Completed
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Photo Lightbox ── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-black/60" onClick={e => e.stopPropagation()}>
            <span className="text-white/70 text-xs font-mono truncate max-w-[60%]">{lightbox.fileName}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => downloadPhoto(lightbox.src, lightbox.fileName)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
              >
                <Download size={14} /> Download
              </button>
              <button
                onClick={() => setLightbox(null)}
                className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <img
            src={lightbox.src}
            alt={lightbox.fileName}
            className="max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl mt-14"
            onClick={e => e.stopPropagation()}
          />

          <p className="text-white/40 text-xs mt-3" onClick={e => e.stopPropagation()}>
            Tap outside to close
          </p>
        </div>
      )}
    </div>
  );
}

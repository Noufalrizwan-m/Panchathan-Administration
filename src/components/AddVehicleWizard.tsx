import React, { useState } from 'react';
import { 
  Building2, Calendar, FileText, CheckCircle2, Shield, 
  ChevronRight, ChevronLeft, Upload, Info, Check, Plus, Trash2, IndianRupee, MapPin
} from 'lucide-react';
import { Vehicle } from '../types';

interface AddVehicleWizardProps {
  onSuccess: () => void;
  operatorName: string;
}

const STEPS = [
  'Vehicle Identification',
  'Technical Specs',
  'Operational Hub',
  'Documents Upload',
  'Review & Confirm'
];

export const AddVehicleWizard: React.FC<AddVehicleWizardProps> = ({ onSuccess, operatorName }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  // Multi-step form state management
  const [formData, setFormData] = useState({
    id: 'PNCH-' + Math.floor(1000 + Math.random() * 9000),
    plate: '',
    vehicleType: 'Truck',
    make: 'Ashok Leyland',
    model: 'Bada Dost i4',
    manufacturer: 'Ashok Leyland Ltd',
    modelVariant: 'i4 LS High-Side Deck',
    year: 2024,
    payloadCapacity: 1860, // Kgs
    engineNumber: '',
    chassisNumber: '',
    homeBase: 'Chennai Central Depot - CHN01',
    serviceArea: 'Intra-City Delivery',
    status: 'Idle' as 'Idle' | 'On Route' | 'Maintenance',
    nextService: 'Dec 15, 2026',
    odometerKm: 0,
    serviceDueKm: 10000,
    lastServiceDate: '',
    insuranceExpiry: '',
    fitnessExpiry: '',
    permitExpiry: '',
  });

  // Local document state
  const [uploadedFiles, setUploadedFiles] = useState<{ [key: string]: string }>({
    registrationCertificate: '',
    commercialInsurance: '',
    fitnessCertificate: '',
    nationalPermit: '',
  });

  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'year' || name === 'payloadCapacity' || name === 'odometerKm' || name === 'serviceDueKm' ? Number(value) : value
    }));
  };

  const handleFileUploadMock = (docKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress(prev => ({ ...prev, [docKey]: 10 }));
    
    // Simulate upload ticks
    let progress = 10;
    const interval = setInterval(() => {
      progress += 30;
      if (progress >= 100) {
        clearInterval(interval);
        setUploadedFiles(prev => ({ ...prev, [docKey]: file.name }));
        setUploadProgress(prev => ({ ...prev, [docKey]: 100 }));
      } else {
        setUploadProgress(prev => ({ ...prev, [docKey]: progress }));
      }
    }, 200);
  };

  const removeFile = (docKey: string) => {
    setUploadedFiles(prev => ({ ...prev, [docKey]: '' }));
    setUploadProgress(prev => ({ ...prev, [docKey]: 0 }));
  };

  const validateStep = () => {
    if (currentStep === 0) {
      if (!formData.id.trim() || !formData.plate.trim()) {
        setAlertMsg({ type: 'error', text: 'Please specify the Fleet Serial ID and Plate Number' });
        return false;
      }
    }
    if (currentStep === 1) {
      if (!formData.model.trim() || formData.payloadCapacity <= 0) {
        setAlertMsg({ type: 'error', text: 'Specify a valid model name and positive weight capacity.' });
        return false;
      }
    }
    setAlertMsg({ type: '', text: '' });
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setAlertMsg({ type: '', text: '' });
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setAlertMsg({ type: '', text: '' });

    // Assemble document records
    const documents = {
      registrationCertificate: uploadedFiles.registrationCertificate 
        ? { status: 'UPLOADED' as const, file: uploadedFiles.registrationCertificate, updatedAt: new Date().toISOString() }
        : { status: 'PENDING' as const },
      commercialInsurance: uploadedFiles.commercialInsurance
        ? { status: 'UPLOADED' as const, file: uploadedFiles.commercialInsurance, updatedAt: new Date().toISOString() }
        : { status: 'PENDING' as const },
      fitnessCertificate: uploadedFiles.fitnessCertificate
        ? { status: 'UPLOADED' as const, file: uploadedFiles.fitnessCertificate, updatedAt: new Date().toISOString() }
        : { status: 'PENDING' as const },
      nationalPermit: uploadedFiles.nationalPermit
        ? { status: 'UPLOADED' as const, file: uploadedFiles.nationalPermit, updatedAt: new Date().toISOString() }
        : { status: 'PENDING' as const },
    };

    let uploadedCount = Object.values(documents).filter(d => d.status === 'UPLOADED').length;
    const completeness = Math.max(25, Math.floor((uploadedCount / 4) * 100));

    const finalPayload = {
      ...formData,
      documents,
      completeness,
      operatorName
    };

    try {
      const response = await fetch('/api/fleet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(finalPayload)
      });

      if (!response.ok) {
        throw new Error('Could not submit vehicle metrics to server.');
      }

      setAlertMsg({ type: 'success', text: 'Fleet vehicle active profile saved successfully!' });
      
      // Auto success callback
      setTimeout(() => {
        onSuccess();
      }, 1500);

    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message || 'Transaction timeout.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="add-vehicle-root" className="grid grid-cols-1 lg:grid-cols-4 gap-6 font-sans text-slate-800">
      
      {/* LEFT COLUMN: Progress Track Steps */}
      <div id="stepper-sidebar" className="lg:col-span-1 bg-white border border-slate-200 shadow-sm rounded-xl p-5">
        <h3 className="text-xs font-mono tracking-widest text-[#1E5E3A] font-bold uppercase mb-4 px-2">
          Registration Stepper
        </h3>
        <div className="space-y-1">
          {STEPS.map((stepName, stepIndex) => {
            const isCompleted = stepIndex < currentStep;
            const isActive = stepIndex === currentStep;

            return (
              <div 
                key={stepIndex} 
                className={`flex items-start gap-3 p-2.5 rounded-lg transition-all text-left border ${
                  isActive 
                    ? 'bg-emerald-50/50 border-emerald-200 font-medium' 
                    : 'border-transparent text-slate-450 hover:bg-slate-50'
                }`}
              >
                <div className="mt-0.5">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <span className={`w-4 h-4 rounded-full border text-[10px] font-mono flex items-center justify-center ${
                      isActive ? 'border-[#1E5E3A] text-[#1E5E3A] bg-emerald-50' : 'border-slate-350 text-slate-400'
                    }`}>
                      {stepIndex + 1}
                    </span>
                  )}
                </div>
                <div>
                  <div className={`text-xs font-bold ${isActive ? 'text-[#1E5E3A]' : 'text-slate-600'}`}>
                    {stepName}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {stepIndex === 0 && 'Identification Details'}
                    {stepIndex === 1 && 'Weight & Engine Payload'}
                    {stepIndex === 2 && 'Operational Base'}
                    {stepIndex === 3 && 'RC & Custom Permit pdf'}
                    {stepIndex === 4 && 'Audit Database Record'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mini Spec Preview Card of Ashok Leyland */}
        <div className="mt-8 border-t border-slate-100 pt-4 hidden lg:block">
          <div className="rounded-xl overflow-hidden bg-slate-50 border border-slate-200 p-4">
            <h4 className="text-[11px] font-bold text-slate-500 tracking-wider font-mono uppercase mb-2">
              Active Spec Preview
            </h4>
            
            {/* Ashok Leyland Bada Dost Custom high fidelity mockup drawing */}
            <div className="w-full h-24 bg-white border border-slate-200 rounded-lg mb-3 flex items-center justify-center p-2 relative overflow-hidden">
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-emerald-500/5 to-transparent" />
              
              {/* Custom SVG Drawing of Bada Dost i4 Truck for aesthetic absolute accuracy */}
              <svg className="w-24 h-16 text-[#1E5E3A] opacity-90" viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Truck Cabin */}
                <path d="M60 15 H85 L95 30 L95 45 H15 L15 35 H60 Z" fill="currentColor" fillOpacity="0.05" stroke="currentColor" strokeWidth="1.5" />
                <path d="M62 17 L80 17 L88 30 H62 Z" fill="#ffffff" fillOpacity="0.1" stroke="currentColor" strokeWidth="1" />
                {/* Wheels */}
                <circle cx="30" cy="45" r="7" fill="#1e293b" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="30" cy="45" r="3" fill="#ffffff" />
                <circle cx="78" cy="45" r="7" fill="#1e293b" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="78" cy="45" r="3" fill="#ffffff" />
                {/* Headlight */}
                <circle cx="94" cy="38" r="1.5" fill="#facc15" />
                {/* Details */}
                <line x1="15" y1="35" x2="60" y2="35" stroke="currentColor" strokeWidth="1" />
                <rect x="2" y="20" width="12" height="15" rx="1" fill="currentColor" fillOpacity="0.05" stroke="currentColor" />
              </svg>
            </div>

            <div className="space-y-1.5 text-[10px] font-mono text-slate-500">
              <div className="flex justify-between">
                <span>ENGINE:</span>
                <span className="text-slate-800 font-bold">1478 CC Turbo</span>
              </div>
              <div className="flex justify-between">
                <span>PAYLOAD:</span>
                <span className="text-slate-800 font-bold">1860 kg (Max)</span>
              </div>
              <div className="flex justify-between">
                <span>VARIANT:</span>
                <span className="text-slate-800 font-bold">Bada Dost i4</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Form Body */}
      <div id="wizard-form-card" className="lg:col-span-3 bg-slate-950 border border-slate-805 rounded-xl p-6 shadow-md relative text-white">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              {STEPS[currentStep]}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Field inputs categorized securely for system deployment databases.
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-300 rounded-full">
            Step {currentStep + 1} of {STEPS.length}
          </span>
        </div>

        {alertMsg.text && (
          <div 
            id="wizard-alert-payload"
            className={`p-3 rounded mb-6 text-xs font-mono flex items-center gap-2 ${
              alertMsg.type === 'error' 
                ? 'bg-red-950/40 border border-red-800 text-red-200' 
                : 'bg-emerald-950/40 border border-emerald-800 text-emerald-200'
            }`}
          >
            <Info className="w-4 h-4 shrink-0" />
            <span>ALERT: {alertMsg.text}</span>
          </div>
        )}

        {/* STEP 0: Vehicle Identification */}
        {currentStep === 0 && (
          <div id="step-vehicle-identification" className="space-y-5 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Registration Serial ID*
                </label>
                <input
                  type="text"
                  name="id"
                  value={formData.id}
                  onChange={handleInputChange}
                  placeholder="e.g. PNCH-5028"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
                <span className="text-[10px] text-slate-500 font-mono block mt-1">
                  Prefix 'PNCH' follows fleet numbering regulations.
                </span>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  License Plate Number (RTO)*
                </label>
                <input
                  type="text"
                  name="plate"
                  value={formData.plate}
                  onChange={handleInputChange}
                  placeholder="e.g. TN 07 CZ 9918"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
                <span className="text-[10px] text-slate-500 font-mono block mt-1">
                  Unique license plate verified on RTO database.
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Vehicle Category*
              </label>
              <select
                name="vehicleType"
                value={formData.vehicleType}
                onChange={handleInputChange}
                className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              >
                <option value="Truck">Truck</option>
                <option value="Bike">Bike</option>
                <option value="Van">Van</option>
                <option value="Auto">Auto</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Chassis Frame Serial
                </label>
                <input
                  type="text"
                  name="chassisNumber"
                  value={formData.chassisNumber}
                  onChange={handleInputChange}
                  placeholder="e.g. CHN442819BB88D"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Engine Combustion Serial (CO2)
                </label>
                <input
                  type="text"
                  name="engineNumber"
                  value={formData.engineNumber}
                  onChange={handleInputChange}
                  placeholder="e.g. EA88402-9900"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: Technical & Cargo Specs */}
        {currentStep === 1 && (
          <div id="step-specs" className="space-y-5 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Manufacturer (Make)
                </label>
                <select
                  name="make"
                  value={formData.make}
                  onChange={handleInputChange}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value="Ashok Leyland">Ashok Leyland</option>
                  <option value="Tata Motors">Tata Motors</option>
                  <option value="BharatBenz">BharatBenz</option>
                  <option value="Eicher">Eicher Trucks</option>
                  <option value="Mahindra">Mahindra Logistics</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Model Variant Spec
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  placeholder="e.g. Bada Dost i4"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Manufacture Year
                </label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  min="2015"
                  max="2027"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Payload Capacity (KGS)
                </label>
                <input
                  type="number"
                  name="payloadCapacity"
                  value={formData.payloadCapacity}
                  onChange={handleInputChange}
                  placeholder="e.g. 1860"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Manufacturer Classification
                </label>
                <input
                  type="text"
                  name="modelVariant"
                  value={formData.modelVariant}
                  onChange={handleInputChange}
                  placeholder="e.g. Dual Cabin Tilt Cargo"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Operational Hub */}
        {currentStep === 2 && (
          <div id="step-operational-hub" className="space-y-5 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Assigned Home Base Hub
                </label>
                <select
                  name="homeBase"
                  value={formData.homeBase}
                  onChange={handleInputChange}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value="Chennai Central Depot - CHN01">Chennai Central Depot - CHN01</option>
                  <option value="Bengaluru Terminal South - BLR04">Bengaluru Terminal South - BLR04</option>
                  <option value="Mumbai Port West - BOM01">Mumbai Port West - BOM01</option>
                  <option value="Delhi Gateway Logistics - DEL02">Delhi Gateway Logistics - DEL02</option>
                  <option value="Kolkata Port Hub - CCU05">Kolkata Port Hub - CCU05</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Service/Fulfillment Area
                </label>
                <select
                  name="serviceArea"
                  value={formData.serviceArea}
                  onChange={handleInputChange}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value="Intra-City Delivery">Intra-City Delivery & Last Mile</option>
                  <option value="Inter-State Long Haul">Inter-State Long Haul (Macro Cargo)</option>
                  <option value="Regional Express Hub">Regional Express Hub (Suburban)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Current KM Reading
                </label>
                <input
                  type="number"
                  name="odometerKm"
                  value={formData.odometerKm}
                  onChange={handleInputChange}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Ready For Service At KM
                </label>
                <input
                  type="number"
                  name="serviceDueKm"
                  value={formData.serviceDueKm}
                  onChange={handleInputChange}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Deployment Operational Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                >
                  <option value="Idle">Idle (Available for Dispatch)</option>
                  <option value="Maintenance">Maintenance (Workshop Active)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Target Service Calibration Date
                </label>
                <input
                  type="text"
                  name="nextService"
                  value={formData.nextService}
                  onChange={handleInputChange}
                  placeholder="e.g. Dec 15, 2026"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Documents Upload */}
        {currentStep === 3 && (
          <div id="step-documents" className="space-y-4 animate-fade-in">
            <p className="text-xs text-slate-400 font-mono bg-slate-900/50 p-2.5 rounded border border-slate-800 flex items-start gap-2">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                To meet RTO National Permit regulations, high quality scan PDFs of state registration certificates must be added to activate truck routing capabilities.
              </span>
            </p>

            {[
              { key: 'registrationCertificate', label: 'Registration Book / RC Certificate*' },
              { key: 'commercialInsurance', label: 'Commercial Fleet Insurance Certificate*' },
              { key: 'fitnessCertificate', label: 'Pollution & Vehicle Fitness Certificate (Form 38)' },
              { key: 'nationalPermit', label: 'National Permit Authorization (Form 48)' }
            ].map(doc => {
              const fileUploaded = uploadedFiles[doc.key];
              const progress = uploadProgress[doc.key] || 0;

              return (
                <div key={doc.key} className="p-3 bg-slate-900 border border-slate-800 rounded flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-white">{doc.label}</div>
                    {fileUploaded ? (
                      <div className="text-[10px] text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> {fileUploaded}
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {progress > 0 && progress < 100 ? `Transmission uploading: ${progress}%` : 'File extension: PDF/JPEG, Maximum: 30MB'}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {fileUploaded ? (
                      <button
                        type="button"
                        onClick={() => removeFile(doc.key)}
                        className="p-2 text-red-400 hover:bg-slate-800 rounded text-xs flex items-center gap-1 font-mono transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" /> Remove
                      </button>
                    ) : (
                      <label className="p-2 cursor-pointer bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-mono font-semibold flex items-center gap-1 transition-colors">
                        <Upload className="w-3.5 h-3.5" /> Select File
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg"
                          className="hidden"
                          onChange={(e) => handleFileUploadMock(doc.key, e)}
                        />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* STEP 4: Review & Confirm */}
        {currentStep === 4 && (
          <div id="step-review" className="space-y-6 animate-fade-in font-mono">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              
              <div className="p-4 bg-slate-900 border border-slate-800 rounded space-y-2">
                <h4 className="text-slate-400 font-bold border-b border-slate-800 pb-1 mb-2">IDENTIFICATION</h4>
                <div className="flex justify-between">
                  <span className="text-slate-500">SERIAL ID:</span>
                  <span className="text-white font-semibold">{formData.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">PLATE NO:</span>
                  <span className="text-white font-semibold">{formData.plate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">CHASSIS:</span>
                  <span className="text-white text-slate-300">{formData.chassisNumber || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ENGINE:</span>
                  <span className="text-white text-slate-300">{formData.engineNumber || 'N/A'}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded space-y-2">
                <h4 className="text-slate-400 font-bold border-b border-slate-800 pb-1 mb-2">SPECIFICATIONS</h4>
                <div className="flex justify-between">
                  <span className="text-slate-500">MAKE/MANUFACTURER:</span>
                  <span className="text-white">{formData.make}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">MODEL VARIANT:</span>
                  <span className="text-white">{formData.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">YEAR MANUFACTURE:</span>
                  <span className="text-white">{formData.year}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">CARGO WEIGHT LIMIT:</span>
                  <span className="text-emerald-400 font-bold">{formData.payloadCapacity} KGS</span>
                </div>
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              
              <div className="p-4 bg-slate-900 border border-slate-800 rounded space-y-2">
                <h4 className="text-slate-400 font-bold border-b border-slate-800 pb-1 mb-2">OPERATIONAL METRICS</h4>
                <div className="flex justify-between">
                  <span className="text-slate-500">HOME BASE:</span>
                  <span className="text-white text-right break-words">{formData.homeBase}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">SERVICE CLUSTER:</span>
                  <span className="text-white">{formData.serviceArea}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">STATUS:</span>
                  <span className="text-amber-400 font-semibold">{formData.status}</span>
                </div>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded space-y-2">
                <h4 className="text-slate-400 font-bold border-b border-slate-800 pb-1 mb-2">REGULATORY SCAN PDFS</h4>
                <div className="flex justify-between">
                  <span className="text-slate-500">REGISTRATION (RC):</span>
                  <span className={uploadedFiles.registrationCertificate ? 'text-emerald-400' : 'text-red-400'}>
                    {uploadedFiles.registrationCertificate ? 'READY' : 'MISSING'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">COMMERCIAL INS:</span>
                  <span className={uploadedFiles.commercialInsurance ? 'text-emerald-400' : 'text-red-400'}>
                    {uploadedFiles.commercialInsurance ? 'READY' : 'MISSING'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">FITNESS CERTIFICATE:</span>
                  <span className={uploadedFiles.fitnessCertificate ? 'text-emerald-400' : 'text-slate-500'}>
                    {uploadedFiles.fitnessCertificate ? 'READY' : 'PENDING'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ALL INDIA PERMIT:</span>
                  <span className={uploadedFiles.nationalPermit ? 'text-emerald-400' : 'text-slate-500'}>
                    {uploadedFiles.nationalPermit ? 'READY' : 'PENDING'}
                  </span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* COMPONENT BUTTON ACTIONS */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-6 mt-8">
          <button
            id="wizard-back-button"
            type="button"
            onClick={handleBack}
            disabled={currentStep === 0 || loading}
            className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 active:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-300 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Prev Step
          </button>

          {currentStep === STEPS.length - 1 ? (
            <button
              id="wizard-submit-button"
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 font-bold rounded text-xs text-slate-950 flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" /> Save & Activate Truck
                </>
              )}
            </button>
          ) : (
            <button
              id="wizard-next-button"
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 font-semibold rounded text-xs text-slate-950 flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.15)]"
            >
              Next Step <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

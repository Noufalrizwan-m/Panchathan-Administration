import React from 'react';
import { Award, Fuel, Percent, TrendingUp, TrendingDown, Star } from 'lucide-react';
import { Driver } from '../types';

interface LeaderboardProps {
  drivers: Driver[];
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ drivers }) => {
  // Sort drivers based on safety rating
  const sortedDrivers = [...drivers].sort((a,b) => b.rating - a.rating);

  return (
    <div id="leaderboard-root" className="bg-white border border-slate-200 rounded-xl p-6 font-sans space-y-6 shadow-sm text-slate-805">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-[#1E5E3A] tracking-tight flex items-center gap-2 uppercase">
            <Award className="w-5 h-5 text-[#A57C1E]" />
            Captain Performance & Safety Rankings
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Logistics metrics tracked per crew captain, ranked by consolidated safety score & fuel efficiency trends.
          </p>
        </div>
      </div>

      {/* TOP THREE PODIUM GRID */}
      <div id="podium-cards-grid" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* SECOND PLACE */}
        {sortedDrivers[1] && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col items-center justify-between text-center relative order-2 md:order-1 hover:border-[#1E5E3A] transition-all">
            <span className="absolute top-3 left-3 text-2xl font-black font-mono text-slate-300">#2</span>
            <div className="flex flex-col items-center space-y-2 mt-4">
              <div className="relative">
                <img 
                  src={sortedDrivers[1].avatar} 
                  alt={sortedDrivers[1].name} 
                  className="w-16 h-16 rounded-full border border-slate-200 object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute -bottom-1 -right-1 bg-slate-400 border border-white text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-mono font-bold">2nd</span>
              </div>
              <div>
                <h3 className="text-slate-805 font-bold text-sm leading-tight">{sortedDrivers[1].name}</h3>
                <span className="text-[10px] text-slate-450 font-mono tracking-wider">{sortedDrivers[1].region}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 w-full pt-4 mt-4 border-t border-slate-200 text-xs font-sans">
              <div className="bg-white p-2 rounded-lg border border-slate-150">
                <span className="text-[10px] text-slate-400 block font-bold font-mono">SAFETY</span>
                <span className="text-slate-800 font-bold flex items-center justify-center gap-0.5 mt-0.5">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-550" />
                  {sortedDrivers[1].rating.toFixed(2)}
                </span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-150">
                <span className="text-[10px] text-slate-400 block font-bold font-mono">EFFICIENCY</span>
                <span className="text-[#1E5E3A] font-bold flex items-center justify-center gap-0.5 mt-0.5">
                  <Fuel className="w-3 h-3" />
                  {sortedDrivers[1].fuelEfficiency} km/l
                </span>
              </div>
            </div>
          </div>
        )}

        {/* FIRST PLACE */}
        {sortedDrivers[0] && (
          <div className="bg-emerald-50/40 border-2 border-[#1E5E3A] rounded-xl p-5 flex flex-col items-center justify-between text-center relative order-1 md:order-2 shadow-sm">
            <span className="absolute top-3 left-3 text-3xl font-black font-mono text-[#A57C1E]">#1</span>
            <div className="flex flex-col items-center space-y-2 mt-2">
              <div className="relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[14px] animate-bounce">
                  👑
                </div>
                <img 
                  src={sortedDrivers[0].avatar} 
                  alt={sortedDrivers[0].name} 
                  className="w-20 h-20 rounded-full border-2 border-[#1E5E3A] object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute -bottom-1 -right-1 bg-[#A57C1E] border border-white text-white rounded-full w-6 h-6 flex items-center justify-center text-[10px] font-mono font-bold shadow-sm">1st</span>
              </div>
              <div>
                <h3 className="text-slate-900 font-black text-base leading-tight mt-1">{sortedDrivers[0].name}</h3>
                <span className="text-[10px] text-[#1E5E3A] font-mono tracking-widest font-extrabold uppercase">{sortedDrivers[0].region}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 w-full pt-4 mt-4 border-t border-[#1E5E3A]/20 text-xs font-sans">
              <div className="bg-white p-2.5 rounded-lg border border-emerald-150">
                <span className="text-[10px] text-slate-450 block font-bold font-mono">SAFETY</span>
                <span className="text-slate-805 font-extrabold flex items-center justify-center gap-0.5 mt-0.5">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                  {sortedDrivers[0].rating.toFixed(2)}
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-emerald-150">
                <span className="text-[10px] text-slate-455 block font-bold font-mono">ON-TIME DEL</span>
                <span className="text-[#1E5E3A] font-extrabold flex items-center justify-center gap-0.5 mt-0.5">
                  <Percent className="w-3.5 h-3.5" />
                  {sortedDrivers[0].onTimeRate}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* THIRD PLACE */}
        {sortedDrivers[2] && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-between text-center relative order-3 md:order-3 hover:border-[#1E5E3A] transition-all">
            <span className="absolute top-3 left-3 text-2xl font-black font-mono text-slate-300">#3</span>
            <div className="flex flex-col items-center space-y-2 mt-4">
              <div className="relative">
                <img 
                  src={sortedDrivers[2].avatar} 
                  alt={sortedDrivers[2].name} 
                  className="w-16 h-16 rounded-full border border-slate-200 object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute -bottom-1 -right-1 bg-amber-700 border border-white text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-mono font-bold">3rd</span>
              </div>
              <div>
                <h3 className="text-slate-805 font-bold text-sm leading-tight">{sortedDrivers[2].name}</h3>
                <span className="text-[10px] text-slate-450 font-mono tracking-wider">{sortedDrivers[2].region}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 w-full pt-4 mt-4 border-t border-slate-200 text-xs font-sans">
              <div className="bg-white p-2 rounded-lg border border-slate-150">
                <span className="text-[10px] text-slate-400 block font-bold font-mono">SAFETY</span>
                <span className="text-slate-800 font-bold flex items-center justify-center gap-0.5 mt-0.5">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-550" />
                  {sortedDrivers[2].rating.toFixed(2)}
                </span>
              </div>
              <div className="bg-white p-2 rounded-lg border border-slate-150">
                <span className="text-[10px] text-slate-400 block font-bold font-mono">EFFICIENCY</span>
                <span className="text-[#1E5E3A] font-bold flex items-center justify-center gap-0.5 mt-0.5">
                  <Fuel className="w-3 h-3" />
                  {sortedDrivers[2].fuelEfficiency} km/l
                </span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* DETAILED ROSTER LEADERBOARD TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs font-sans">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold font-mono">
              <th className="p-3.5 text-center">Rank</th>
              <th className="p-3.5">Captain Name</th>
              <th className="p-3.5">Home Region</th>
              <th className="p-3.5 text-center">Safety Score</th>
              <th className="p-3.5 text-center">Experience</th>
              <th className="p-3.5 text-center">Total Voyages</th>
              <th className="p-3.5 text-center">On-Time Rate</th>
              <th className="p-3.5 text-center">Fuel Index</th>
              <th className="p-3.5 text-center">Trend Indicator</th>
            </tr>
          </thead>
          <tbody>
            {sortedDrivers.map((d, index) => (
              <tr key={d.id} className="border-b border-slate-150 hover:bg-slate-50/50 text-slate-700">
                <td className="p-3.5 font-bold text-center">
                  {index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                </td>
                <td className="p-3.5 flex items-center gap-2.5">
                  <img 
                    src={d.avatar} 
                    alt={d.name} 
                    className="w-7 h-7 rounded-full object-cover border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <span className="text-slate-900 font-bold">{d.name}</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5 font-mono font-bold">ID: {d.id}</span>
                  </div>
                </td>
                <td className="p-3.5 text-slate-500 font-medium">{d.region}</td>
                <td className="p-3.5 text-center text-slate-900 font-bold">
                  <span className="inline-flex items-center gap-0.5 font-mono">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-550" />
                    {d.rating.toFixed(2)}
                  </span>
                </td>
                <td className="p-3.5 text-center text-slate-500 font-semibold">{d.experienceYears} Years</td>
                <td className="p-3.5 text-center text-slate-705 font-bold font-mono">{d.totalTrips} Trips</td>
                <td className="p-3.5 text-[#1E5E3A] text-center font-extrabold font-mono">{d.onTimeRate}%</td>
                <td className="p-3.5 text-[#1E5E3A] text-center font-extrabold font-mono">{d.fuelEfficiency} km/l</td>
                <td className="p-3.5 text-center">
                  {d.trend === 'up' && (
                    <span className="text-emerald-700 bg-emerald-50 border border-emerald-250 px-2.5 py-0.5 rounded text-[9px] inline-flex items-center gap-0.5 font-mono font-bold">
                      <TrendingUp className="w-3.5 h-3.5" /> GAINING
                    </span>
                  )}
                  {d.trend === 'down' && (
                    <span className="text-rose-700 bg-rose-50 border border-rose-250 px-2.5 py-0.5 rounded text-[9px] inline-flex items-center gap-0.5 font-mono font-bold animate-pulse">
                      <TrendingDown className="w-3.5 h-3.5" /> AT RISK
                    </span>
                  )}
                  {d.trend === 'stable' && (
                    <span className="text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded text-[9px] font-mono font-bold">STABLE</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

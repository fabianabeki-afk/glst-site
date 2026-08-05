'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface DJAvailability {
 id: string;
 djName: string;
 email: string;
 availableSlots: {
   day: string;
   startTime: string;
   endTime: string;
 }[];
}

interface ScheduledStream {
 id: string;
 djName: string;
 channel: string;
 date: string;
 startTime: string;
 endTime: string;
 title: string;
 status: 'scheduled' | 'live' | 'completed' | 'cancelled';
}

export default function AdminDashboard() {
 const [activeTab, setActiveTab] = useState('schedule');
 const [djAvailability, setDjAvailability] = useState<DJAvailability[]>([
   {
     id: '1',
     djName: 'DJ Fabian',
     email: 'fabiandubz@gmail.com',
     availableSlots: [
       { day: 'Friday', startTime: '20:00', endTime: '22:00' },
       { day: 'Saturday', startTime: '21:00', endTime: '23:00' },
     ]
   },
   {
     id: '2',
     djName: 'DJ Shadow',
     email: 'shadow@example.com',
     availableSlots: [
       { day: 'Thursday', startTime: '19:00', endTime: '21:00' },
       { day: 'Sunday', startTime: '18:00', endTime: '20:00' },
     ]
   }
 ]);

 const [scheduledStreams, setScheduledStreams] = useState<ScheduledStream[]>([
   {
     id: '1',
     djName: 'DJ Fabian',
     channel: 'BASEMENT',
     date: '2026-07-31',
     startTime: '20:00',
     endTime: '22:00',
     title: 'Friday Night Live',
     status: 'scheduled'
   }
 ]);

 const [showScheduleModal, setShowScheduleModal] = useState(false);
 const [selectedDJ, setSelectedDJ] = useState('');
 const [selectedSlot, setSelectedSlot] = useState('');

 const channels = ['MAINROOM', 'BASEMENT', 'LOUNGE', 'THE LAB'];

 const handleAddSchedule = () => {
   // Implementation for adding schedule
   setShowScheduleModal(false);
 };

 return (
   <div className="min-h-screen bg-black text-white font-mono">
     {/* Header */}
     <header className="fixed top-0 left-0 right-0 z-50 bg-black border-b border-neutral-800">
       <div className="max-w-[1200px] mx-auto px-4 h-16 flex items-center justify-between">
         <div className="flex items-center gap-3">
           <span className="text-[#D4AF37] text-sm font-black tracking-widest">GUESTLIST.tv</span>
           <span className="text-neutral-600 text-xs">/</span>
           <span className="text-purple-400 text-xs font-black tracking-widest">ADMIN</span>
         </div>
         <div className="flex items-center gap-2">
           <span className="text-xs text-neutral-400">fabiandubz@gmail.com</span>
           <span className="px-2 py-0.5 text-[10px] font-black bg-purple-600 text-white rounded">ADMIN</span>
           <Link href="/" className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-black tracking-widest rounded-lg transition-colors">
             EXIT ADMIN
           </Link>
         </div>
       </div>
     </header>

     <div className="pt-16 max-w-[1200px] mx-auto px-4 py-6">
       {/* Stats Overview */}
       <div className="grid grid-cols-4 gap-4 mb-6">
         {[
           { label: 'TOTAL DJS', value: '12', color: 'text-[#D4AF37]' },
           { label: 'SCHEDULED', value: '8', color: 'text-emerald-400' },
           { label: 'LIVE NOW', value: '1', color: 'text-red-500' },
           { label: 'UPCOMING', value: '3', color: 'text-blue-400' },
         ].map((stat) => (
           <div key={stat.label} className="bg-neutral-950 border border-neutral-900 rounded-xl p-4">
             <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
             <div className="text-[10px] text-neutral-500 tracking-widest mt-1">{stat.label}</div>
           </div>
         ))}
       </div>

       {/* Tabs */}
       <div className="flex gap-2 mb-6 border-b border-neutral-800 pb-2">
         {[
           { id: 'schedule', label: 'SCHEDULE MANAGER' },
           { id: 'djs', label: 'DJ MANAGEMENT' },
           { id: 'streams', label: 'STREAM CONTROL' },
           { id: 'analytics', label: 'ANALYTICS' },
         ].map((tab) => (
           <button
             key={tab.id}
             onClick={() => setActiveTab(tab.id)}
             className={`px-4 py-2 text-[10px] font-black tracking-widest rounded-t-lg transition-colors ${
               activeTab === tab.id
                 ? 'bg-neutral-900 text-[#D4AF37] border-b-2 border-[#D4AF37]'
                 : 'text-neutral-500 hover:text-white'
             }`}
           >
             {tab.label}
           </button>
         ))}
       </div>

       {/* Schedule Manager */}
       {activeTab === 'schedule' && (
         <div className="space-y-6">
           <div className="flex justify-between items-center">
             <h2 className="text-sm font-black tracking-widest">SCHEDULE MANAGER</h2>
             <button
               onClick={() => setShowScheduleModal(true)}
               className="px-4 py-2 bg-[#D4AF37] hover:bg-[#AA8417] text-black text-xs font-black tracking-widest rounded-lg transition-colors"
             >
               + ADD SCHEDULE
             </button>
           </div>

           {/* Weekly Calendar View */}
           <div className="bg-neutral-950 border border-neutral-900 rounded-xl overflow-hidden">
             <div className="grid grid-cols-8 border-b border-neutral-800">
               <div className="p-3 text-[10px] text-neutral-500 font-bold tracking-widest">TIME</div>
               {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
                 <div key={day} className="p-3 text-[10px] text-neutral-500 font-bold tracking-widest text-center">{day}</div>
               ))}
             </div>
             
             {/* Time slots */}
             {['18:00', '19:00', '20:00', '21:00', '22:00', '23:00'].map((time) => (
               <div key={time} className="grid grid-cols-8 border-b border-neutral-900/50">
                 <div className="p-3 text-[10px] text-neutral-600">{time}</div>
                 {Array(7).fill(null).map((_, idx) => (
                   <div key={idx} className="p-2 border-l border-neutral-900/30 min-h-[60px]">
                     {/* Check if there's a scheduled stream */}
                     {scheduledStreams.map((stream) => {
                       const streamDay = new Date(stream.date).getDay();
                       const adjustedDay = streamDay === 0 ? 6 : streamDay - 1; // Convert to Mon=0
                       if (adjustedDay === idx && stream.startTime === time) {
                         return (
                           <div key={stream.id} className="bg-purple-900/40 border border-purple-700/50 rounded p-1.5 text-[9px]">
                             <div className="font-bold text-purple-300 truncate">{stream.djName}</div>
                             <div className="text-neutral-400">{stream.channel}</div>
                             <div className="text-[8px] text-neutral-500">{stream.title}</div>
                           </div>
                         );
                       }
                       return null;
                     })}
                   </div>
                 ))}
               </div>
             ))}
           </div>

           {/* DJ Availability List */}
           <div className="mt-6">
             <h3 className="text-xs font-black tracking-widest mb-3">DJ AVAILABILITY</h3>
             <div className="space-y-2">
               {djAvailability.map((dj) => (
                 <div key={dj.id} className="bg-neutral-950 border border-neutral-900 rounded-xl p-4">
                   <div className="flex justify-between items-start">
                     <div>
                       <div className="text-sm font-bold">{dj.djName}</div>
                       <div className="text-xs text-neutral-500">{dj.email}</div>
                     </div>
                     <button className="px-3 py-1 text-[10px] font-black bg-neutral-800 hover:bg-neutral-700 rounded transition-colors">
                       EDIT AVAILABILITY
                     </button>
                   </div>
                   <div className="flex gap-2 mt-3">
                     {dj.availableSlots.map((slot, idx) => (
                       <div key={idx} className="px-2 py-1 bg-neutral-900 rounded text-[10px] text-neutral-400">
                         {slot.day}: {slot.startTime} - {slot.endTime}
                       </div>
                     ))}
                   </div>
                 </div>
               ))}
             </div>
           </div>
         </div>
       )}

       {/* DJ Management */}
       {activeTab === 'djs' && (
         <div className="space-y-4">
           <h2 className="text-sm font-black tracking-widest">DJ MANAGEMENT</h2>
           <div className="bg-neutral-950 border border-neutral-900 rounded-xl overflow-hidden">
             <div className="grid grid-cols-5 p-3 border-b border-neutral-800 text-[10px] text-neutral-500 font-bold tracking-widest">
               <div>DJ NAME</div>
               <div>EMAIL</div>
               <div>TIER</div>
               <div>STATUS</div>
               <div>ACTIONS</div>
             </div>
             {djAvailability.map((dj) => (
               <div key={dj.id} className="grid grid-cols-5 p-3 border-b border-neutral-900/50 items-center">
                 <div className="text-sm font-bold">{dj.djName}</div>
                 <div className="text-xs text-neutral-500">{dj.email}</div>
                 <div className="text-xs text-[#D4AF37]">VANGUARD</div>
                 <div className="text-xs text-emerald-400">● ACTIVE</div>
                 <div className="flex gap-2">
                   <button className="px-2 py-1 text-[10px] bg-neutral-800 hover:bg-neutral-700 rounded transition-colors">EDIT</button>
                   <button className="px-2 py-1 text-[10px] bg-red-950 text-red-400 hover:bg-red-900 rounded transition-colors">SUSPEND</button>
                 </div>
               </div>
             ))}
           </div>
         </div>
       )}

       {/* Stream Control */}
       {activeTab === 'streams' && (
         <div className="space-y-4">
           <h2 className="text-sm font-black tracking-widest">STREAM CONTROL</h2>
           <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-6">
             <div className="flex items-center gap-4 mb-6">
               <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
               <span className="text-sm font-black text-red-500">LIVE NOW</span>
               <span className="text-xs text-neutral-500">DJ Fabian — BASEMENT</span>
             </div>
             
             <div className="flex gap-2">
               <button className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black tracking-widest rounded-lg transition-colors">
                 END STREAM
               </button>
               <button className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-black tracking-widest rounded-lg transition-colors">
                 SEND ALERT
               </button>
               <button className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-black tracking-widest rounded-lg transition-colors">
                 VIEW STATS
               </button>
             </div>
           </div>
         </div>
       )}

       {/* Analytics */}
       {activeTab === 'analytics' && (
         <div className="space-y-4">
           <h2 className="text-sm font-black tracking-widest">ANALYTICS</h2>
           <div className="grid grid-cols-2 gap-4">
             <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-6">
               <h3 className="text-xs font-bold text-neutral-500 mb-4">WEEKLY LISTENERS</h3>
               <div className="text-3xl font-black text-[#D4AF37]">1,247</div>
               <div className="text-xs text-emerald-400 mt-1">↑ 12% vs last week</div>
             </div>
             <div className="bg-neutral-950 border border-neutral-900 rounded-xl p-6">
               <h3 className="text-xs font-bold text-neutral-500 mb-4">TOTAL STREAM HOURS</h3>
               <div className="text-3xl font-black text-[#D4AF37]">48.5h</div>
               <div className="text-xs text-emerald-400 mt-1">↑ 8% vs last week</div>
             </div>
           </div>
         </div>
       )}
     </div>

     {/* Add Schedule Modal */}
     {showScheduleModal && (
       <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
         <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 w-full max-w-md">
           <h3 className="text-sm font-black tracking-widest mb-4">ADD TO SCHEDULE</h3>
           
           <div className="space-y-3">
             <div>
               <label className="text-xs text-neutral-500 block mb-1">SELECT DJ</label>
               <select 
                 className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white"
                 value={selectedDJ}
                 onChange={(e) => setSelectedDJ(e.target.value)}
               >
                 <option value="">Choose DJ...</option>
                 {djAvailability.map((dj) => (
                   <option key={dj.id} value={dj.id}>{dj.djName}</option>
                 ))}
               </select>
             </div>
             
             <div>
               <label className="text-xs text-neutral-500 block mb-1">CHANNEL</label>
               <select className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white">
                 {channels.map((ch) => (
                   <option key={ch} value={ch}>{ch}</option>
                 ))}
               </select>
             </div>
             
             <div className="grid grid-cols-2 gap-2">
               <div>
                 <label className="text-xs text-neutral-500 block mb-1">DATE</label>
                 <input type="date" className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white" />
               </div>
               <div>
                 <label className="text-xs text-neutral-500 block mb-1">START TIME</label>
                 <input type="time" className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white" />
               </div>
             </div>
             
             <div>
               <label className="text-xs text-neutral-500 block mb-1">STREAM TITLE</label>
               <input 
                 type="text" 
                 placeholder="e.g., Friday Night Live"
                 className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600"
               />
             </div>
           </div>
           
           <div className="flex gap-2 mt-6">
             <button 
               onClick={() => setShowScheduleModal(false)}
               className="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-xs font-black tracking-widest rounded-lg transition-colors"
             >
               CANCEL
             </button>
             <button 
               onClick={handleAddSchedule}
               className="flex-1 px-4 py-2 bg-[#D4AF37] hover:bg-[#AA8417] text-black text-xs font-black tracking-widest rounded-lg transition-colors"
             >
               ADD TO SCHEDULE
             </button>
           </div>
         </div>
       </div>
     )}
   </div>
 );
}
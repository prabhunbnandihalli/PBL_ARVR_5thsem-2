import React, { useState, useEffect } from 'react';
import { Trophy, MessageSquare, Flame, Shield, Award, Send, Users, Sparkles, Filter, Radio } from 'lucide-react';
import { CampusType, ChatMessage, LeaderboardEntry } from '../types';

interface SocialHubProps {
  currentScore?: number;
  playerName: string;
  playerRole: string;
  onClose: () => void;
}

const DEFAULT_LEADERBOARDS: LeaderboardEntry[] = [
  {
    id: 'lead_1',
    playerName: 'Captain Marcus R.',
    campusId: 'school',
    disasterType: 'fire',
    score: 3450,
    timeSeconds: 58,
    efficiency: 98,
    grade: 'S',
    role: 'Safety Warden',
    date: 'Today, 10:14 AM',
  },
  {
    id: 'lead_2',
    playerName: 'Sarah Chen (BioTech)',
    campusId: 'college',
    disasterType: 'chemical',
    score: 3210,
    timeSeconds: 67,
    efficiency: 94,
    grade: 'S',
    role: 'Lab Specialist',
    date: 'Today, 09:30 AM',
  },
  {
    id: 'lead_3',
    playerName: 'Officer Dave K.',
    campusId: 'university',
    disasterType: 'earthquake',
    score: 2980,
    timeSeconds: 84,
    efficiency: 89,
    grade: 'A',
    role: 'Campus Paramedic',
    date: 'Yesterday',
  },
  {
    id: 'lead_4',
    playerName: 'Elena Rostova',
    campusId: 'school',
    disasterType: 'fire',
    score: 2850,
    timeSeconds: 92,
    efficiency: 86,
    grade: 'A',
    role: 'Student',
    date: 'Yesterday',
  },
  {
    id: 'lead_5',
    playerName: 'Tariq Al-Mansoor',
    campusId: 'college',
    disasterType: 'fire',
    score: 2650,
    timeSeconds: 104,
    efficiency: 81,
    grade: 'B',
    role: 'Student',
    date: '2 days ago',
  },
];

const DEFAULT_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'chat_1',
    sender: 'Emergency Dispatch Alpha',
    role: 'Safety Warden',
    badge: 'HQ DISPATCH',
    campus: 'Metro High School',
    message: 'Notice: Always follow the green holographic path line. Red markers indicate blocked fire doors or toxic smoke.',
    timestamp: '10:00 AM',
    isEmergencyAlert: true,
  },
  {
    id: 'chat_2',
    sender: 'Maya (Biology)',
    role: 'Student',
    campus: 'Apex College',
    message: 'Remember to press Crouch [C] when you hit the smoke corridor in the Science wing! Smoke damage drops to 0 while low-crawling.',
    timestamp: '10:04 AM',
  },
  {
    id: 'chat_3',
    sender: 'Ken (Warden)',
    role: 'Safety Warden',
    campus: 'Grand State University',
    message: 'Just logged an S-tier run! The buddy system gives +500 PTS when you assist the stranded peer at Checkpoint 4.',
    timestamp: '10:12 AM',
  },
];

export const SocialHub: React.FC<SocialHubProps> = ({
  currentScore,
  playerName,
  playerRole,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'chat'>('leaderboard');
  const [selectedCampus, setSelectedCampus] = useState<string>('all');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
    const saved = localStorage.getItem('aegis_ar_leaderboard');
    return saved ? JSON.parse(saved) : DEFAULT_LEADERBOARDS;
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('aegis_ar_chat');
    return saved ? JSON.parse(saved) : DEFAULT_CHAT_MESSAGES;
  });

  const [chatInput, setChatInput] = useState('');

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg: ChatMessage = {
      id: 'chat_' + Date.now(),
      sender: playerName || 'Cadet User',
      role: playerRole,
      campus: 'Cadet Channel',
      message: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    localStorage.setItem('aegis_ar_chat', JSON.stringify(updated));
    setChatInput('');
  };

  const handleQuickShout = (text: string) => {
    setChatInput(text);
  };

  const filteredLeaderboard = selectedCampus === 'all'
    ? leaderboard
    : leaderboard.filter(item => item.campusId === selectedCampus);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[85vh]">
        {/* Header Tabs */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                Emergency Response Community Hub
              </h2>
              <p className="text-xs text-slate-400">
                Global drill rankings, peer coordination radio, and tactical guidance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-800/80 p-1 rounded-2xl border border-slate-700/60">
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'leaderboard'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Leaderboards</span>
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'chat'
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/25'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Drill Radio & Chat</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'leaderboard' ? (
          <div className="flex-1 flex flex-col p-4 sm:p-5 overflow-hidden">
            {/* Campus Filter Bar */}
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5 text-cyan-400" />
                  MAP FILTER:
                </span>
                <div className="flex gap-1.5">
                  {[
                    { id: 'all', label: 'All Maps' },
                    { id: 'school', label: 'High School' },
                    { id: 'college', label: 'College' },
                    { id: 'university', label: 'University' },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setSelectedCampus(filter.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-medium border transition-all ${
                        selectedCampus === filter.id
                          ? 'bg-cyan-600/20 border-cyan-400 text-cyan-200'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-300'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-xs text-emerald-400 font-mono bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-1 rounded-xl">
                RANKED BY EFFICIENCY & SURVIVAL TIME
              </div>
            </div>

            {/* Leaderboard Table / Cards */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredLeaderboard.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`p-3 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                    index === 0
                      ? 'bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 border-amber-500/40'
                      : index === 1
                      ? 'bg-gradient-to-r from-slate-400/10 via-slate-900 to-slate-900 border-slate-400/40'
                      : index === 2
                      ? 'bg-gradient-to-r from-amber-700/10 via-slate-900 to-slate-900 border-amber-700/40'
                      : 'bg-slate-800/40 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold font-mono text-xs ${
                        index === 0
                          ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/40'
                          : index === 1
                          ? 'bg-slate-300 text-slate-950'
                          : index === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      #{index + 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-100">{entry.playerName}</span>
                        <span className="text-[10px] bg-slate-800 text-cyan-300 border border-slate-700 px-2 py-0.5 rounded-full font-mono">
                          {entry.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Campus: <span className="text-slate-300 capitalize">{entry.campusId}</span> • {entry.date}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="text-xs font-mono font-bold text-cyan-400">{entry.score} PTS</div>
                      <div className="text-[11px] text-slate-400 font-mono">{entry.timeSeconds}s • {entry.efficiency}% Eff.</div>
                    </div>

                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold font-mono text-xs border ${
                        entry.grade === 'S'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                          : entry.grade === 'A'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                          : 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                      }`}
                    >
                      {entry.grade}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden p-4 sm:p-5">
            {/* Live Drill Radio Status Bar */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-2.5 mb-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-mono">
                <Radio className="w-4 h-4 animate-pulse" />
                <span className="font-semibold">CHANNEL #EVAC-BROADCAST ACTIVE</span>
              </div>
              <span className="text-slate-400 text-[11px]">84 peers connected</span>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-2xl border text-xs leading-relaxed ${
                    msg.isEmergencyAlert
                      ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                      : 'bg-slate-800/50 border-slate-700/60 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100">{msg.sender}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300">
                        {msg.role}
                      </span>
                      {msg.badge && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-900/60 border border-rose-500/50 text-rose-300 font-bold">
                          {msg.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{msg.timestamp}</span>
                  </div>
                  <p className="text-slate-300">{msg.message}</p>
                </div>
              ))}
            </div>

            {/* Quick Tactical Shout Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 text-[11px]">
              <span className="text-slate-400 font-mono text-[10px] shrink-0">QUICK RADIO:</span>
              {[
                'Green path clear on east wing!',
                'Heavy smoke detected, low crawl required!',
                'Assisting student at science lab door!',
                'Assembly muster point reached safely!',
              ].map((shout) => (
                <button
                  key={shout}
                  onClick={() => handleQuickShout(shout)}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 shrink-0 transition-colors"
                >
                  {shout}
                </button>
              ))}
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Broadcast a safety drill message or question to cadets..."
                className="flex-1 bg-slate-800/80 border border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/25 transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

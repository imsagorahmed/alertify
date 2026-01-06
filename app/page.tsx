'use client'

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, SkipForward, Volume2, VolumeX, Coffee, Briefcase, BellRing, BellOff, Bell } from 'lucide-react';

const Home = () => {
  const [workMins, setWorkMins] = useState("25");
  const [workSecs, setWorkSecs] = useState("0");
  const [breakMins, setBreakMins] = useState("5");
  const [breakSecs, setBreakSecs] = useState("0");
  
  const [isActive, setIsActive] = useState(false);
  const [isWorkMode, setIsWorkMode] = useState(true);
  const [timeLeft, setTimeLeft] = useState(1500); 
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  const timerRef = useRef(null);
  const audioIntervalRef = useRef(null);
  const expectedTimeRef = useRef(null);

  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  const requestNotificationPermission = async () => {
    if (typeof Notification !== 'undefined') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };

  const sendNotification = (title, body) => {
    if (notificationPermission === 'granted') {
      try {
        const notification = new Notification(title, {
          body: body,
          icon: 'https://cdn-icons-png.flaticon.com/512/2553/2553391.png'
        });

        notification.onclick = function() {
          window.focus();
          this.close();
        };
      } catch (err) {
        console.error("Notification error:", err);
      }
    }
  };

  useEffect(() => {
    if (!isWorkMode && isActive && !isMuted) {
      audioIntervalRef.current = setInterval(() => {
        playAlarmClockSound();
      }, 1500);
    } else {
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }
    }
    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };
  }, [isWorkMode, isActive, isMuted]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      expectedTimeRef.current = Date.now() + (timeLeft * 1000);
      
      const tick = () => {
        if (!expectedTimeRef.current) return;
        
        const now = Date.now();
        const remaining = Math.max(0, Math.round((expectedTimeRef.current - now) / 1000));
        
        if (remaining !== timeLeft) {
          setTimeLeft(remaining);
        }

        if (remaining <= 0) {
          handlePhaseEnd();
        } else {
          timerRef.current = setTimeout(tick, 1000);
        }
      };

      timerRef.current = setTimeout(tick, 1000);
    } else if (isActive && timeLeft === 0) {
      handlePhaseEnd();
    } else {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isActive, timeLeft]);

  useEffect(() => {
    if (!isActive) {
      const wm = parseInt(workMins) || 0;
      const ws = parseInt(workSecs) || 0;
      const bm = parseInt(breakMins) || 0;
      const bs = parseInt(breakSecs) || 0;
      
      setTimeLeft(isWorkMode ? (wm * 60 + ws) : (bm * 60 + bs));
    }
  }, [workMins, workSecs, breakMins, breakSecs, isWorkMode, isActive]);

  const playAlarmClockSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const ctx = new AudioContextClass();
      const beep = (time, freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(0.1, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.1);
      };
      beep(ctx.currentTime, 880);
      beep(ctx.currentTime + 0.2, 880);
    } catch (e) {
      console.error("Audio failed", e);
    }
  };

  const handlePhaseEnd = () => {
    playAlarmClockSound();
    
    if (isWorkMode) {
      sendNotification("Time's Up!", "Time to take a break.");
    } else {
      sendNotification("Break Over!", "Time to get back to work.");
    }
    
    toggleMode();
  };

  const toggleMode = () => {
    const nextIsWork = !isWorkMode;
    setIsWorkMode(nextIsWork);
    
    const wm = parseInt(workMins) || 0;
    const ws = parseInt(workSecs) || 0;
    const bm = parseInt(breakMins) || 0;
    const bs = parseInt(breakSecs) || 0;
    
    const nextTime = nextIsWork ? (wm * 60 + ws) : (bm * 60 + bs);
    setTimeLeft(nextTime);
    expectedTimeRef.current = Date.now() + (nextTime * 1000);
    
    if (nextIsWork) setIsMuted(false);
  };

  const handleStart = () => {
    if (notificationPermission === 'default') {
      requestNotificationPermission();
    }
    setIsActive(true);
  };
  
  const handlePause = () => setIsActive(false);

  const handleStop = () => {
    setIsActive(false);
    setIsWorkMode(true);
    const wm = parseInt(workMins) || 0;
    const ws = parseInt(workSecs) || 0;
    setTimeLeft(wm * 60 + ws);
    setIsMuted(false);
  };

  const skipCurrent = () => toggleMode();

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const secondsDegrees = (currentTime.getSeconds() / 60) * 360;
  const minutesDegrees = ((currentTime.getMinutes() + currentTime.getSeconds() / 60) / 60) * 360;
  const hoursDegrees = ((currentTime.getHours() % 12 + currentTime.getMinutes() / 60) / 12) * 360;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans text-slate-900">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100 relative overflow-hidden">
        
        {!isWorkMode && isActive && (
          <div className="absolute inset-0 bg-emerald-500/5 animate-pulse pointer-events-none" />
        )}

        <div className="flex justify-between items-center mb-8 relative z-10">
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs shadow-md shadow-indigo-200">A</div>
            Alerity
          </h1>
          <div className="flex gap-2">
            {notificationPermission !== 'granted' && (
              <button 
                onClick={requestNotificationPermission}
                className="p-2 bg-amber-50 text-amber-600 rounded-full hover:bg-amber-100 transition-colors"
                title="Enable Browser Notifications"
              >
                <Bell size={18} />
              </button>
            )}
            {!isWorkMode && (
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                  isMuted ? 'bg-slate-200 text-slate-600' : 'bg-red-500 text-white animate-pulse'
                }`}
              >
                {isMuted ? <BellOff size={14} /> : <BellRing size={14} />}
                {isMuted ? 'ALARM MUTED' : 'STOP ALARM'}
              </button>
            )}
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              {isMuted ? <VolumeX className="text-slate-400" /> : <Volume2 className="text-indigo-600" />}
            </button>
          </div>
        </div>

        <div className="relative w-40 h-40 mx-auto mb-6 border-4 border-slate-100 rounded-full flex items-center justify-center shadow-inner bg-slate-50 z-10">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="absolute inset-1 text-center font-semibold text-slate-300 text-[10px]" style={{ transform: `rotate(${(i + 1) * 30}deg)` }}>
              <span style={{ display: 'inline-block', transform: `rotate(${-(i + 1) * 30}deg)` }}>{i + 1}</span>
            </div>
          ))}
          <div className="absolute w-1 h-10 bg-slate-800 rounded-full origin-bottom bottom-1/2" style={{ transform: `rotate(${hoursDegrees}deg)` }} />
          <div className="absolute w-0.5 h-14 bg-slate-400 rounded-full origin-bottom bottom-1/2" style={{ transform: `rotate(${minutesDegrees}deg)` }} />
          <div className="absolute w-px h-16 bg-red-500 origin-bottom bottom-1/2" style={{ transform: `rotate(${secondsDegrees}deg)` }} />
          <div className="absolute w-2 h-2 bg-slate-800 rounded-full" />
        </div>

        <div className="text-center mb-6 relative z-10">
          <div className="flex items-center justify-center gap-2 mb-1">
            {isWorkMode ? (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wider">
                <Briefcase size={12} /> Work Session
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider">
                <Coffee size={12} /> Break Period
              </span>
            )}
          </div>
          <div className={`text-6xl font-mono font-bold tracking-tighter transition-colors ${!isWorkMode && !isMuted ? 'text-emerald-600' : 'text-slate-800'}`}>
            {formatTime(timeLeft)}
          </div>
        </div>

        <div className="space-y-4 mb-8 relative z-10">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Work Duration</label>
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <input 
                  type="number" 
                  value={workMins}
                  disabled={isActive}
                  placeholder="Min"
                  onChange={(e) => setWorkMins(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-center font-bold"
                />
                <span className="block text-[8px] text-center text-slate-400 mt-1 uppercase">Minutes</span>
              </div>
              <div className="flex-1">
                <input 
                  type="number" 
                  value={workSecs}
                  disabled={isActive}
                  placeholder="Sec"
                  onChange={(e) => setWorkSecs(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-center font-bold"
                />
                <span className="block text-[8px] text-center text-slate-400 mt-1 uppercase">Seconds</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 text-emerald-600">Break Duration</label>
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <input 
                  type="number" 
                  value={breakMins}
                  disabled={isActive}
                  placeholder="Min"
                  onChange={(e) => setBreakMins(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-center font-bold"
                />
                <span className="block text-[8px] text-center text-slate-400 mt-1 uppercase">Minutes</span>
              </div>
              <div className="flex-1">
                <input 
                  type="number" 
                  value={breakSecs}
                  disabled={isActive}
                  placeholder="Sec"
                  onChange={(e) => setBreakSecs(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-center font-bold"
                />
                <span className="block text-[8px] text-center text-slate-400 mt-1 uppercase">Seconds</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 relative z-10">
          <div className="flex gap-3">
            {!isActive ? (
              <button 
                onClick={handleStart}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 transition-all active:scale-95"
              >
                <Play size={20} fill="currentColor" /> Start Alerity
              </button>
            ) : (
              <button 
                onClick={handlePause}
                className="flex-1 bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Pause size={20} fill="currentColor" /> Pause Timer
              </button>
            )}
            <button onClick={handleStop} className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-colors active:scale-95">
              <Square size={20} fill="currentColor" />
            </button>
          </div>
          
          <button 
            onClick={skipCurrent} 
            className="w-full bg-white border-2 border-slate-100 hover:bg-slate-50 text-slate-500 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
          >
            <SkipForward size={16} /> 
            {isWorkMode ? 'Skip to Break' : 'Skip Break'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
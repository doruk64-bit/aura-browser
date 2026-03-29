import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Activity, Globe, Monitor, Zap, Hexagon, Component, MapPin, Cpu, Database, Wifi, Terminal } from 'lucide-react';

interface TelemetryUser {
  id?: string;
  os?: string;
  version?: string;
  locale?: string;
  ram?: number;
  cores?: number;
  resolution?: string;
  country?: string;
  city?: string;
  isp?: string;
  online_at?: string;
}

function App() {
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);

  // States for detailed metrics
  const [osData, setOsData] = useState<{name: string, count: number, icon: string}[]>([]);
  const [versionData, setVersionData] = useState<{name: string, count: number}[]>([]);
  const [topCountry, setTopCountry] = useState<{name: string, count: number} | null>(null);
  const [ispData, setIspData] = useState<{name: string, count: number}[]>([]);
  
  // Hardware
  const [avgRam, setAvgRam] = useState<number>(0);
  const [avgCores, setAvgCores] = useState<number>(0);

  // Activity Log
  const [logs, setLogs] = useState<{id: string, msg: string, time: string}[]>([]);
  const previousUsersRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimer: NodeJS.Timeout;

    const connectWS = () => {
      ws = new WebSocket('ws://localhost:8080');

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'sync') {
            const state = message.state as TelemetryUser[];
            let currentCount = state.length;
            
            const osCounts: Record<string, number> = {};
            const versionCounts: Record<string, number> = {};
            const countryCounts: Record<string, number> = {};
            const ispCounts: Record<string, number> = {};
            let totalRam = 0;
            let totalCores = 0;
            let hwCount = 0;

            const currentUsersSet = new Set<string>();
            const newLogs: {id: string, msg: string, time: string}[] = [];

            state.forEach(client => {
              const userId = client.id || Math.random().toString();
              currentUsersSet.add(userId);

              // Log new connections
              if (!previousUsersRef.current.has(userId)) {
                newLogs.push({
                  id: userId,
                  msg: `Gerçek Bağlantı: ${client.country || 'Bilinmiyor'}, ${client.city || ''} - ${client.isp || 'ISP Yok'} (${client.ram || '?'}GB RAM)`,
                  time: new Date().toLocaleTimeString('tr-TR', { hour12: false })
                });
              }

              // OS
              const os = client.os === 'win32' ? 'Windows' : client.os === 'darwin' ? 'macOS' : client.os === 'linux' ? 'Linux' : 'Bilinmez';
              osCounts[os] = (osCounts[os] || 0) + 1;

              const ver = client.version || 'Eski Sürüm';
              versionCounts[ver] = (versionCounts[ver] || 0) + 1;

              if (client.country) countryCounts[client.country] = (countryCounts[client.country] || 0) + 1;
              if (client.isp) ispCounts[client.isp] = (ispCounts[client.isp] || 0) + 1;

              if (client.ram && client.cores) {
                 totalRam += client.ram;
                 totalCores += client.cores;
                 hwCount++;
              }
            });

            // Apply new logs (keep last 5)
            if (newLogs.length > 0) {
              setLogs(prev => [...newLogs, ...prev].slice(0, 5));
            }
            previousUsersRef.current = currentUsersSet;

            // Parse metrics
            setOsData(Object.entries(osCounts).map(([k,v]) => ({
              name: k, count: v, icon: k === 'Windows' ? '🪟' : k === 'macOS' ? '🍎' : '🐧'
            })).sort((a,b) => b.count - a.count));

            setVersionData(Object.entries(versionCounts).map(([k,v]) => ({ name: k, count: v })).sort((a,b) => b.count - a.count));

            setIspData(Object.entries(ispCounts).map(([k,v]) => ({ name: k, count: v })).sort((a,b) => b.count - a.count).slice(0, 3));

            let maxC = null;
            for(const k in countryCounts) {
               if(!maxC || countryCounts[k] > (maxC.count)) {
                  maxC = { name: k, count: countryCounts[k] };
               }
            }
            
            setActiveUsers(currentCount);
            setTopCountry(maxC);
            setAvgRam(hwCount > 0 ? Math.round(totalRam / hwCount) : 0);
            setAvgCores(hwCount > 0 ? Math.round(totalCores / hwCount) : 0);
          }
        } catch (e) {
          console.error("Parse error", e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        setActiveUsers(0);
        setOsData([]);
        setIspData([]);
        setTopCountry(null);
        reconnectTimer = setTimeout(connectWS, 3000);
      };

      ws.onerror = (e) => {
         ws.close();
      };
    };

    connectWS();

    return () => {
      clearTimeout(reconnectTimer);
      if (ws) ws.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#06060a] text-white flex flex-col items-center justify-start p-4 md:p-8 relative overflow-hidden font-sans">
      <div className="fixed top-0 right-[-10%] w-[800px] h-[800px] bg-purple-700/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="z-10 w-full max-w-7xl flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md">
            <Hexagon size={28} className="text-purple-500" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
              Morrow Command Center
            </h1>
            <p className="text-gray-400 text-sm font-medium">Yerel Soket İstihbarat Ağı (Bağımsız Sunucu)</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-[#110f18]/80 border border-white/10 px-5 py-2.5 rounded-2xl backdrop-blur-md shadow-xl">
          <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${isConnected ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.8)]' : 'bg-red-500'}`} />
          <span className="text-xs font-bold uppercase tracking-widest text-gray-200">
            {isConnected ? 'Yerel Sunucu Aktif' : 'Sunucu Bekleniyor...'}
          </span>
        </div>
      </div>

      {/* Dashboard Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: "spring", damping: 25 }}
        className="z-10 w-full max-w-7xl grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-6"
      >
        {/* BIG HERO CARD */}
        <div className="md:col-span-2 md:row-span-2 relative">
          <div className="absolute -inset-[1px] bg-gradient-to-br from-purple-500/30 to-rose-500/10 rounded-[2rem] z-0" />
          <div className="relative bg-[#0d0b14]/90 backdrop-blur-xl h-full rounded-[2rem] p-8 border border-white/5 shadow-2xl flex flex-col items-center justify-center text-center">
            <AnimatePresence mode="popLayout">
              <motion.h2 
                key={activeUsers}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-9xl font-black text-white drop-shadow-[0_0_60px_rgba(168,85,247,0.4)] tabular-nums tracking-tighter"
              >
                {activeUsers}
              </motion.h2>
            </AnimatePresence>
            <p className="text-gray-400 mt-6 text-xl font-medium flex items-center gap-2 uppercase tracking-widest">
              <Activity size={24} className="text-pink-400" />
              Aktif Oturum
            </p>
          </div>
        </div>

        {/* Global Map / Countries */}
        <div className="md:col-span-2 bg-[#110f18]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col">
          <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-4 flex items-center gap-2">
            <MapPin size={16} className="text-purple-400"/> Lider Konum
          </h3>
          <div className="flex-1 flex items-center p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20">
            <div className="w-16 h-16 rounded-full bg-purple-500/20 flex flex-shrink-0 items-center justify-center border border-purple-500/30 mr-6">
              <Globe size={32} className="text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-gray-400 text-xs tracking-wider uppercase mb-1">Şu Bölgede Yoğunluk Var:</p>
              <p className="text-3xl font-bold text-white uppercase tracking-wider">
                {topCountry ? topCountry.name : 'Veri Yok'}
              </p>
            </div>
            {topCountry && activeUsers > 0 && (
              <div className="text-right">
                <p className="text-pink-400 font-bold text-2xl">{((topCountry.count / activeUsers) * 100).toFixed(0)}%</p>
              </div>
            )}
          </div>
        </div>

        {/* Live Matrix Feed */}
        <div className="md:col-span-1 bg-[#110f18]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-transparent" />
          <h3 className="text-xs uppercase tracking-widest text-green-500/80 font-bold mb-4 flex items-center gap-2">
            <Terminal size={16} /> Canlı Trafik Logu
          </h3>
          <div className="flex flex-col gap-2 flex-1">
            <AnimatePresence>
              {logs.map(log => (
                <motion.div 
                  key={log.time + log.msg}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[11px] font-mono border-l-2 border-green-500/30 pl-2 py-1"
                >
                  <span className="text-green-400 opacity-60">[{log.time}]</span> <span className="text-gray-300">{log.msg}</span>
                </motion.div>
              ))}
              {logs.length === 0 && <p className="text-gray-600 text-[11px] italic mt-2">Sinyal bekleniyor...</p>}
            </AnimatePresence>
          </div>
        </div>

        {/* Hardware Stats */}
        <div className="md:col-span-1 bg-[#110f18]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col">
          <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-5 flex items-center gap-2">
            <Cpu size={16} className="text-rose-400"/> Ortalama Donanım
          </h3>
          <div className="grid grid-rows-2 gap-3 flex-1">
            <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex items-center gap-4">
              <Database size={24} className="text-blue-400 opacity-80" />
              <div>
                <p className="text-gray-400 text-[10px] uppercase tracking-widest">Sistem Belleği (RAM)</p>
                <p className="text-xl font-bold text-white">{avgRam > 0 ? `${avgRam} GB` : '...'}</p>
              </div>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-3 flex items-center gap-4">
              <Component size={24} className="text-yellow-400 opacity-80" />
              <div>
                <p className="text-gray-400 text-[10px] uppercase tracking-widest">İşlemci Gücü</p>
                <p className="text-xl font-bold text-white">{avgCores > 0 ? `${avgCores} Çekirdek` : '...'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ISP Leadership */}
        <div className="md:col-span-1 bg-[#110f18]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col">
           <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-4 flex items-center gap-2">
            <Wifi size={16} className="text-blue-400"/> Top ISP
          </h3>
          <div className="flex flex-col gap-3 flex-1">
            {ispData.length > 0 ? ispData.map((isp) => (
              <div key={isp.name} className="flex justify-between items-center p-2 rounded-xl bg-white/5 border border-white/5">
                <span className="text-gray-300 text-xs font-semibold truncate max-w-[100px]">{isp.name}</span>
                <span className="text-xs font-bold text-white bg-blue-500/20 text-blue-300 px-2 py-1 rounded-md">{isp.count}</span>
              </div>
            )) : <p className="text-gray-600 text-xs italic">Veri akışı yok.</p>}
          </div>
        </div>

        {/* Operating Systems */}
        <div className="md:col-span-2 lg:col-span-1 bg-[#110f18]/80 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col">
          <h3 className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-4 flex items-center gap-2">
            <Monitor size={16} className="text-indigo-400"/> Platformlar
          </h3>
          <div className="flex flex-col gap-4 flex-1 justify-center">
            {osData.length > 0 ? osData.map((os) => (
              <div key={os.name} className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="flex items-center gap-2 text-gray-300"><span>{os.icon}</span> {os.name}</span>
                  <span className="font-bold text-white">{os.count}</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(os.count / activeUsers) * 100}%` }}
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                  />
                </div>
              </div>
            )) : <p className="text-gray-600 text-xs italic">Veri akışı yok.</p>}
          </div>
        </div>

      </motion.div>
    </div>
  );
}

export default App;

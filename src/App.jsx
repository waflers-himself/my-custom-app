import { useEffect, useState } from 'react';
import DiagnosticConsole from './components/DiagnosticConsole';
import {
  LayoutGrid,
  MessageSquare,
  ClipboardList,
  Wind,
  Settings,
  ChevronRight,
  MapPin,
  Sparkles,
  Thermometer,
  Plus,
  Trash2,
  Bot,
  CalendarDays,
  Search,
  Sun,
  Moon,
  CheckCircle2,
  Circle,
  Send,
  RefreshCw,
  Paperclip,
  Mic,
  Folder,
  Bell,
  Navigation,
  Droplets,
  CloudRain,
  Compass,
  Sunrise,
  Sunset,
  Gauge,
  Umbrella,
  Network,
  Wrench
} from 'lucide-react';

const desktopSidebarItems = [
  { label: 'Dashboard', icon: LayoutGrid, tab: 'Home' },
  { label: 'Chat', icon: Bot, tab: 'Comm' },
  { label: 'Diagnostics', icon: Wrench, tab: 'Diagnostics' },
  { label: 'Tasks', icon: ClipboardList, tab: 'Tasks' },
  { label: 'Calendar', icon: CalendarDays, tab: 'Calendar' },
  { label: 'Weather', icon: Wind, tab: 'Weather' },
  { label: 'Graph', icon: Network, tab: 'Graph' },
  { label: 'Files', icon: Folder, tab: 'Files' },
  { label: 'Settings', icon: Settings, tab: 'Settings' }
];

const weatherDays = ['Today', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Yorkshire Locations (Huddersfield set as default #1)
const YORKSHIRE_LOCATIONS = [
  { name: 'Huddersfield', lat: 53.6458, lon: -1.7850 },
  { name: 'Halifax (Calderdale)', lat: 53.7248, lon: -1.8623 },
  { name: 'Brighouse', lat: 53.7042, lon: -1.7828 },
  { name: 'Leeds', lat: 53.7997, lon: -1.5492 },
  { name: 'Bradford', lat: 53.7960, lon: -1.7594 },
  { name: 'Wakefield', lat: 53.6833, lon: -1.4977 },
  { name: 'Sheffield', lat: 53.3811, lon: -1.4701 },
  { name: 'Mirfield', lat: 53.6732, lon: -1.6914 }
];

const getWeatherCondition = (code) => {
  if (code === 0) return 'Clear Sky';
  if (code >= 1 && code <= 3) return 'Partly Cloudy';
  if (code >= 45 && code <= 48) return 'Foggy';
  if (code >= 51 && code <= 67) return 'Rainy';
  if (code >= 71 && code <= 77) return 'Snowy';
  if (code >= 80 && code <= 82) return 'Rain Showers';
  if (code >= 95) return 'Thunderstorm';
  return 'Cloudy';
};

export default function App() {
  const [theme, setTheme] = useState('dark');
  const [activeTab, setActiveTab] = useState('Home');
  const [selectedDay, setSelectedDay] = useState('Today');

  const [selectedLocation, setSelectedLocation] = useState(YORKSHIRE_LOCATIONS[0]);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [newMessageText, setNewMessageText] = useState('');

  const [items, setItems] = useState([]);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('High Priority');
  const [showAddTaskMobile, setShowAddTaskMobile] = useState(false);
  const [taskFilter, setTaskFilter] = useState('All');

  const fetchLiveWeather = (loc = selectedLocation) => {
    setWeatherLoading(true);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,relative_humidity_2m,surface_pressure&hourly=temperature_2m,apparent_temperature,precipitation_probability,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max&timezone=auto`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setWeatherData(data);
        setWeatherLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch weather:', err);
        setWeatherLoading(false);
      });
  };

  const handleSelectLocation = (loc) => {
    setSelectedLocation(loc);
    fetchLiveWeather(loc);
  };

  const fetchData = async () => {
    try {
      const [convRes, itemsRes] = await Promise.all([
        fetch('/api/conversations'),
        fetch('/api/items')
      ]);

      if (convRes.ok) {
        const convData = await convRes.json();
        setConversations(convData);
        if (convData.length > 0 && !selectedConversationId) {
          setSelectedConversationId(convData[0].id);
        }
      }

      if (itemsRes.ok) {
        const itemsData = await itemsRes.json();
        setItems(itemsData);
      }
    } catch (err) {
      console.error('Error fetching backend data:', err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchLiveWeather(selectedLocation);
  }, []);

  const selectedConversation = conversations.find((item) => item.id === selectedConversationId) || conversations[0] || null;

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;

    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTaskName,
          owner: 'User',
          priority: newTaskPriority,
          status: 'In Progress'
        })
      });

      if (response.ok) {
        const created = await response.json();
        setItems((prev) => [created, ...prev]);
        setNewTaskName('');
        setShowAddTaskMobile(false);
      }
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      const response = await fetch(`/api/items/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleToggleTaskStatus = (id) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStatus = item.status === 'Ready' ? 'In Progress' : 'Ready';
          return { ...item, status: nextStatus };
        }
        return item;
      })
    );
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedConversation) return;

    const updatedText = newMessageText;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConversation.id
          ? { ...c, summary: `You: ${updatedText}` }
          : c
      )
    );
    setNewMessageText('');
  };

  const filteredTasks = items.filter((task) => {
    if (taskFilter === 'All') return true;
    return task.status === taskFilter;
  });

  const currentTemp = weatherData?.current ? Math.round(weatherData.current.temperature_2m) : '--';
  const feelsLike = weatherData?.current ? Math.round(weatherData.current.apparent_temperature) : '--';
  const windSpeed = weatherData?.current ? Math.round(weatherData.current.wind_speed_10m) : '--';
  const windDir = weatherData?.current?.wind_direction_10m ? `${weatherData.current.wind_direction_10m}°` : '--';
  const condition = weatherData?.current ? getWeatherCondition(weatherData.current.weather_code) : 'Loading...';
  const highTemp = weatherData?.daily?.temperature_2m_max[0] ? Math.round(weatherData.daily.temperature_2m_max[0]) : '--';
  const lowTemp = weatherData?.daily?.temperature_2m_min[0] ? Math.round(weatherData.daily.temperature_2m_min[0]) : '--';
  const humidity = weatherData?.current?.relative_humidity_2m ?? '--';
  const pressure = weatherData?.current?.surface_pressure ? Math.round(weatherData.current.surface_pressure) : '--';
  const rainProb = weatherData?.daily?.precipitation_probability_max[0] ?? '--';
  const uvMax = weatherData?.daily?.uv_index_max[0] ? weatherData.daily.uv_index_max[0].toFixed(1) : '--';
  const sunriseTime = weatherData?.daily?.sunrise[0] ? weatherData.daily.sunrise[0].split('T')[1].slice(0, 5) : '--:--';
  const sunsetTime = weatherData?.daily?.sunset[0] ? weatherData.daily.sunset[0].split('T')[1].slice(0, 5) : '--:--';

  const hourlyStrip = weatherData?.hourly?.time ? weatherData.hourly.time.slice(0, 12).map((t, idx) => ({
    time: idx === 0 ? 'Now' : t.split('T')[1].slice(0, 5),
    temp: `${Math.round(weatherData.hourly.temperature_2m[idx])}°`,
    rain: `${weatherData.hourly.precipitation_probability[idx]}%`,
    wind: Math.round(weatherData.hourly.wind_speed_10m[idx])
  })) : [];

  const dailyForecast = weatherData?.daily?.time ? weatherData.daily.time.map((d, idx) => {
    const dateObj = new Date(d);
    const dayName = idx === 0 ? 'Today' : dateObj.toLocaleDateString('en-GB', { weekday: 'short' });
    return {
      day: dayName,
      max: Math.round(weatherData.daily.temperature_2m_max[idx]),
      min: Math.round(weatherData.daily.temperature_2m_min[idx]),
      cond: getWeatherCondition(weatherData.daily.weather_code[idx]),
      rain: weatherData.daily.precipitation_probability_max[idx]
    };
  }) : [];

  const mcpUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:9749` : 'http://localhost:9749';

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#070A12] text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans selection:bg-cyan-500/30`}>
      
      {/* MOBILE LAYOUT */}
      <div className="block xl:hidden pb-24">
        <div className="mx-auto max-w-md px-4 pt-3 space-y-3">
          <header className="flex items-center justify-between py-1 px-1">
            <div className="flex items-center gap-2">
              <div className="text-cyan-400">
                <LayoutGrid size={18} className="stroke-[2.2]" />
              </div>
              <h1 className="text-sm font-medium tracking-tight text-slate-100">
                {activeTab === 'Home' && 'Command Center'}
                {activeTab === 'Comm' && 'Comms Hub'}
                {activeTab === 'Diagnostics' && 'Hardware Diagnostics'}
                {activeTab === 'Tasks' && 'Task Manager'}
                {activeTab === 'Weather' && 'Weather Hub'}
                {activeTab === 'Graph' && 'Knowledge Graph'}
                {activeTab === 'Settings' && 'Settings'}
              </h1>
            </div>
            <div className="relative flex items-center gap-2">
              <button className="text-slate-400 hover:text-slate-200">
                <Bell size={16} />
              </button>
              <div className="relative">
                <button onClick={() => setActiveTab('Settings')} className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-[11px] font-semibold text-white shadow-inner">
                  A
                </button>
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-[#070A12] bg-emerald-400"></span>
              </div>
            </div>
          </header>

          {/* HOME TAB */}
          {activeTab === 'Home' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <button onClick={() => setActiveTab('Comm')} className="relative text-left rounded-xl border border-slate-800/80 bg-[#0E1322] px-3 py-2 shadow-sm transition active:scale-95">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-950/60 text-cyan-400 border border-cyan-500/20">
                        <MessageSquare size={14} />
                      </div>
                      <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">ACTIVE CHATS</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-500" />
                  </div>
                  <div className="mt-1 flex items-baseline justify-between pl-9">
                    <span className="text-xl font-bold tracking-tight text-white">{conversations.length}</span>
                    <span className="text-[10px] font-medium text-cyan-400">+8%</span>
                  </div>
                </button>

                <button onClick={() => setActiveTab('Tasks')} className="relative text-left rounded-xl border border-slate-800/80 bg-[#0E1322] px-3 py-2 shadow-sm transition active:scale-95">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-950/60 text-indigo-400 border border-indigo-500/20">
                        <ClipboardList size={14} />
                      </div>
                      <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">DUE TASKS</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-500" />
                  </div>
                  <div className="mt-1 flex items-baseline justify-between pl-9">
                    <span className="text-xl font-bold tracking-tight text-white">{items.length}</span>
                    <span className="text-[10px] font-medium text-sky-400">3 today</span>
                  </div>
                </button>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                <Navigation size={12} className="text-cyan-400 shrink-0 ml-1" />
                {YORKSHIRE_LOCATIONS.map((loc) => (
                  <button
                    key={loc.name}
                    onClick={() => handleSelectLocation(loc)}
                    className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-medium border transition ${
                      selectedLocation.name === loc.name
                        ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 shadow-sm'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {loc.name}
                  </button>
                ))}
              </div>

              <div className="rounded-2xl border border-slate-800/80 bg-[#0E1322] p-4 shadow-sm space-y-3.5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                    <span className="uppercase text-[10px] tracking-wider text-slate-400 font-semibold">WEATHER</span>
                    <MapPin size={13} className="text-cyan-400" />
                    <span className="text-slate-100 font-semibold">{selectedLocation.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white tracking-tight">
                      {weatherLoading ? '...' : `${currentTemp}°C`}
                    </div>
                    <div className="text-[10px] text-slate-400">Feels like {feelsLike}°C</div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 text-xs">
                  <div className="flex gap-4 overflow-x-auto no-scrollbar">
                    {weatherDays.map((day) => (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`relative pb-1 font-medium transition text-xs ${selectedDay === day ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        {day}
                        {selectedDay === day && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 rounded-full"></span>}
                      </button>
                    ))}
                  </div>
                  <ChevronRight size={14} className="text-slate-500 shrink-0" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Wind size={22} className="text-cyan-300" />
                    <div>
                      <p className="text-xs font-semibold text-slate-100">{condition}</p>
                      <p className="text-[10px] text-slate-400">Wind {windSpeed} km/h</p>
                    </div>
                  </div>
                  <div className="text-right text-[11px]">
                    <p><span className="text-rose-400 font-medium">High</span> <span className="font-semibold text-slate-100 ml-1">{highTemp}°C</span></p>
                    <p><span className="text-sky-400 font-medium">Low</span> <span className="font-semibold text-slate-100 ml-2">{lowTemp}°C</span></p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DIAGNOSTICS TAB */}
          {activeTab === 'Diagnostics' && (
            <DiagnosticConsole />
          )}

          {/* WEATHER TAB */}
          {activeTab === 'Weather' && (
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-br from-[#0E1322] via-[#0E1322] to-cyan-950/30 p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-medium">
                      <MapPin size={14} />
                      <span className="text-base font-bold text-white">{selectedLocation.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{condition} · High {highTemp}° / Low {lowTemp}°</p>
                  </div>
                  <div className="text-right">
                    <span className="text-4xl font-black text-white tracking-tight">{currentTemp}°C</span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Feels like {feelsLike}°C</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GRAPH TAB */}
          {activeTab === 'Graph' && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-800/80 bg-[#0E1322] p-4 shadow-sm space-y-3">
                <div className="w-full h-[60vh] rounded-xl overflow-hidden border border-slate-800">
                  <iframe src={mcpUrl} className="w-full h-full border-none" title="Codebase Graph" />
                </div>
              </div>
            </div>
          )}

          {/* CHAT TAB */}
          {activeTab === 'Comm' && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-800/80 bg-[#0E1322] p-4 shadow-sm space-y-4">
                <div className="space-y-3 min-h-[240px]">
                  <div className="flex gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/20">
                      <Bot size={14} />
                    </div>
                    <div className="rounded-2xl bg-slate-900 border border-slate-800/80 p-3 text-xs leading-relaxed text-slate-200 max-w-[85%]">
                      {selectedConversation?.assistantMessage || 'System online and ready.'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TASKS TAB */}
          {activeTab === 'Tasks' && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-800/80 bg-[#0E1322] p-3.5 space-y-2">
                {items.map((task) => (
                  <div key={task.id} className="flex items-center justify-between py-1.5 border-b border-slate-800/40 last:border-0">
                    <span className="text-xs text-slate-100">{task.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'Settings' && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-800/80 bg-[#0E1322] p-4 flex items-center gap-3">
                <div>
                  <p className="font-semibold text-xs text-white">Alicia</p>
                  <p className="text-[10px] text-slate-400">OptiPlex Local Node</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* BOTTOM NAV BAR */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800/80 bg-[#070A12]/95 backdrop-blur-md px-3 py-2">
          <div className="mx-auto flex max-w-md items-center justify-between">
            <button onClick={() => setActiveTab('Home')} className={`flex flex-col items-center gap-0.5 ${activeTab === 'Home' ? 'text-cyan-400' : 'text-slate-500'}`}>
              <LayoutGrid size={18} />
              <span className="text-[9px] font-medium">Home</span>
            </button>
            <button onClick={() => setActiveTab('Comm')} className={`flex flex-col items-center gap-0.5 ${activeTab === 'Comm' ? 'text-cyan-400' : 'text-slate-500'}`}>
              <MessageSquare size={18} />
              <span className="text-[9px] font-medium">Comm</span>
            </button>
            <button onClick={() => setActiveTab('Diagnostics')} className={`flex flex-col items-center gap-0.5 ${activeTab === 'Diagnostics' ? 'text-cyan-400' : 'text-slate-500'}`}>
              <Wrench size={18} />
              <span className="text-[9px] font-medium">Diag</span>
            </button>
            <button onClick={() => setActiveTab('Tasks')} className={`flex flex-col items-center gap-0.5 ${activeTab === 'Tasks' ? 'text-cyan-400' : 'text-slate-500'}`}>
              <ClipboardList size={18} />
              <span className="text-[9px] font-medium">Tasks</span>
            </button>
            <button onClick={() => setActiveTab('Weather')} className={`flex flex-col items-center gap-0.5 ${activeTab === 'Weather' ? 'text-cyan-400' : 'text-slate-500'}`}>
              <Wind size={18} />
              <span className="text-[9px] font-medium">Weather</span>
            </button>
          </div>
        </nav>
      </div>

      {/* DESKTOP LAYOUT */}
      <div className="hidden xl:flex min-h-screen max-w-full flex-row">
        <aside className="flex w-20 flex-none flex-col items-center gap-6 border-r border-slate-800/70 bg-slate-950/90 py-6 text-slate-100">
          <div className="rounded-2xl bg-cyan-500/15 p-2.5 text-cyan-300">
            <Bot size={22} />
          </div>
          <nav className="flex flex-col gap-4 mt-4">
            {desktopSidebarItems.map(({ label, icon: Icon, tab }) => (
              <button
                key={label}
                onClick={() => setActiveTab(tab)}
                title={label}
                className={`flex h-11 w-11 items-center justify-center rounded-2xl transition ${
                  activeTab === tab
                    ? 'border border-cyan-500/50 bg-cyan-500/10 text-cyan-400'
                    : 'border border-slate-800/80 bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon size={18} />
              </button>
            ))}
          </nav>
        </aside>

        <div className="flex-1 flex flex-col">
          <header className="flex h-16 items-center justify-between border-b border-slate-800/70 px-8 bg-slate-950/40">
            <h1 className="text-sm font-semibold text-white">System Command Desk</h1>
          </header>

          <main className="flex-1 p-6 grid grid-cols-12 gap-6 overflow-y-auto">
            {activeTab === 'Diagnostics' ? (
              <div className="col-span-12">
                <DiagnosticConsole />
              </div>
            ) : activeTab === 'Graph' ? (
              <div className="col-span-12 rounded-3xl border border-slate-800/80 bg-[#0E1322] p-5 shadow-sm space-y-3">
                <iframe src={mcpUrl} className="w-full h-[75vh] border-none" title="Codebase Graph" />
              </div>
            ) : (
              <div className="col-span-12 space-y-4">
                <p className="text-slate-400 text-xs">Select a tab from the left sidebar to begin.</p>
              </div>
            )}
          </main>
        </div>
      </div>

    </div>
  );
}

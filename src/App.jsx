import { useEffect, useState } from 'react';
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
  Umbrella
} from 'lucide-react';

const desktopSidebarItems = [
  { label: 'Dashboard', icon: LayoutGrid, tab: 'Home' },
  { label: 'Chat', icon: Bot, tab: 'Comm' },
  { label: 'Tasks', icon: ClipboardList, tab: 'Tasks' },
  { label: 'Calendar', icon: CalendarDays, tab: 'Calendar' },
  { label: 'Weather', icon: Wind, tab: 'Weather' },
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

// Map Open-Meteo weather codes to human text
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

  // Location & Weather State - Defaults to Huddersfield
  const [selectedLocation, setSelectedLocation] = useState(YORKSHIRE_LOCATIONS[0]);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  // App Data States
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [newMessageText, setNewMessageText] = useState('');

  const [items, setItems] = useState([]);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('High Priority');
  const [showAddTaskMobile, setShowAddTaskMobile] = useState(false);
  const [taskFilter, setTaskFilter] = useState('All');

  // Fetch Expanded Weather from Open-Meteo
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

  // Weather variables calculated from API
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

  // Hourly strip (Next 12 hours for Weather tab)
  const hourlyStrip = weatherData?.hourly?.time ? weatherData.hourly.time.slice(0, 12).map((t, idx) => ({
    time: idx === 0 ? 'Now' : t.split('T')[1].slice(0, 5),
    temp: `${Math.round(weatherData.hourly.temperature_2m[idx])}°`,
    rain: `${weatherData.hourly.precipitation_probability[idx]}%`,
    wind: Math.round(weatherData.hourly.wind_speed_10m[idx])
  })) : [];

  // Daily Forecast list
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

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#070A12] text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans selection:bg-cyan-500/30`}>
      
      {/* ========================================== */}
      {/* MOBILE LAYOUT (< xl)                       */}
      {/* ========================================== */}
      <div className="block xl:hidden pb-24">
        <div className="mx-auto max-w-md px-4 pt-3 space-y-3">
          
          {/* Header Bar */}
          <header className="flex items-center justify-between py-1 px-1">
            <div className="flex items-center gap-2">
              <div className="text-cyan-400">
                <LayoutGrid size={18} className="stroke-[2.2]" />
              </div>
              <h1 className="text-sm font-medium tracking-tight text-slate-100">
                {activeTab === 'Home' && 'Command Center'}
                {activeTab === 'Comm' && 'Comms Hub'}
                {activeTab === 'Tasks' && 'Task Manager'}
                {activeTab === 'Weather' && 'Weather Hub'}
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

          {/* TAB 1: HOME DASHBOARD */}
          {activeTab === 'Home' && (
            <div className="space-y-3">
              
              {/* COMPACT STAT CARDS */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => setActiveTab('Comm')}
                  className="relative text-left rounded-xl border border-slate-800/80 bg-[#0E1322] px-3 py-2 shadow-sm transition active:scale-95"
                >
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

                <button
                  onClick={() => setActiveTab('Tasks')}
                  className="relative text-left rounded-xl border border-slate-800/80 bg-[#0E1322] px-3 py-2 shadow-sm transition active:scale-95"
                >
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

              {/* LOCATION SCROLL BAR */}
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

              {/* WEATHER HUB (HOME CARD) */}
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

                {/* Graph & Hourly */}
                <div className="relative pt-1 space-y-2">
                  <div className="relative h-24 w-full flex">
                    <div className="w-6 flex flex-col justify-between text-[9px] text-slate-500 font-mono py-1">
                      <span>20°</span>
                      <span>15°</span>
                      <span>10°</span>
                      <span>5°</span>
                      <span>0°</span>
                    </div>

                    <div className="relative flex-1 h-full">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 300 90" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="tempGradientSpec" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <line x1="0" y1="10" x2="300" y2="10" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="0" y1="30" x2="300" y2="30" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                        <line x1="0" y1="50" x2="300" y2="50" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                        <path d="M 0 55 Q 50 45, 100 50 T 200 35 T 300 45" fill="none" stroke="#cbd5e1" strokeWidth="1.8" strokeDasharray="4 4" />
                        <path d="M 0 42 Q 50 28, 100 34 T 200 22 T 300 32 L 300 90 L 0 90 Z" fill="url(#tempGradientSpec)" />
                        <path d="M 0 42 Q 50 28, 100 34 T 200 22 T 300 32" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                      </svg>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-center pt-1 border-t border-slate-800/60">
                    {hourlyStrip.slice(0, 6).map((item, i) => (
                      <div key={i} className="flex flex-col items-center gap-0.5">
                        <span className="text-[9px] text-slate-400 font-medium">{item.time}</span>
                        <Wind size={12} className="text-slate-300 my-0.5" />
                        <span className="text-xs font-semibold text-slate-200">{item.temp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI WEATHER SUMMARY */}
              <div className="rounded-2xl border border-slate-800/80 bg-[#0E1322] p-3.5 shadow-sm">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 tracking-wider uppercase mb-2">
                  <Sparkles size={12} className="text-cyan-400" />
                  <span>AI WEATHER SUMMARY</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Wind size={20} className="text-cyan-400 shrink-0" />
                    <p className="text-xs text-slate-300 leading-relaxed max-w-[190px]">
                      In <span className="text-slate-100 font-semibold">{selectedLocation.name}</span> it is <span className="text-slate-100 font-semibold">{condition}</span> at <span className="text-slate-100 font-semibold">{currentTemp}°C</span>.
                    </p>
                  </div>
                  <button onClick={() => setActiveTab('Weather')} className="text-xs text-cyan-400 flex items-center gap-0.5 font-medium">
                    Full Hub <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* UPCOMING TASKS */}
              <div className="rounded-2xl border border-slate-800/80 bg-[#0E1322] p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">UPCOMING TASKS</span>
                  <button onClick={() => setActiveTab('Tasks')} className="text-xs text-slate-400 hover:text-cyan-400">
                    View all
                  </button>
                </div>

                <div className="space-y-2">
                  {items.slice(0, 3).map((task) => (
                    <div key={task.id} className="flex items-center justify-between py-1 border-b border-slate-800/40 last:border-0">
                      <div className="flex items-center gap-2.5">
                        <button onClick={() => handleToggleTaskStatus(task.id)} className="text-slate-500 hover:text-cyan-400 transition">
                          {task.status === 'Ready' ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Circle size={16} />}
                        </button>
                        <div>
                          <p className={`text-xs font-medium ${task.status === 'Ready' ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                            {task.name}
                          </p>
                          <p className="text-[10px] text-rose-400 font-medium">{task.priority || 'High Priority'}</p>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-slate-600" />
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB: FULL WEATHER HUB (EXPANDED) */}
          {activeTab === 'Weather' && (
            <div className="space-y-4">
              
              {/* Location Selector */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                <Navigation size={13} className="text-cyan-400 shrink-0 ml-1" />
                {YORKSHIRE_LOCATIONS.map((loc) => (
                  <button
                    key={loc.name}
                    onClick={() => handleSelectLocation(loc)}
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition ${
                      selectedLocation.name === loc.name
                        ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 shadow-sm'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {loc.name}
                  </button>
                ))}
              </div>

              {/* Main Banner Card */}
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

                {/* Yorkshire Advice Banner */}
                <div className="rounded-2xl bg-cyan-950/40 border border-cyan-500/20 p-3 flex items-center gap-3 text-xs text-cyan-200">
                  <Umbrella size={18} className="text-cyan-400 shrink-0" />
                  <p className="leading-snug">
                    {rainProb > 40
                      ? `High chance of rain (${rainProb}%) in ${selectedLocation.name} today. Grab a coat or brolly!`
                      : `Dry outlook in ${selectedLocation.name} with ${windSpeed} km/h winds. Great conditions for outdoor tasks.`}
                  </p>
                </div>
              </div>

              {/* 6 Metric Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-2xl border border-slate-800/80 bg-[#0E1322] p-3.5 space-y-1">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-semibold uppercase">
                    <Droplets size={13} className="text-sky-400" />
                    <span>HUMIDITY</span>
                  </div>
                  <p className="text-xl font-bold text-white">{humidity}%</p>
                  <p className="text-[9px] text-slate-500">Dew point comfortable</p>
                </div>

                <div className="rounded-2xl border border-slate-800/80 bg-[#0E1322] p-3.5 space-y-1">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-semibold uppercase">
                    <Wind size={13} className="text-cyan-400" />
                    <span>WIND & GUSTS</span>
                  </div>
                  <p className="text-xl font-bold text-white">{windSpeed} <span className="text-xs text-slate-400 font-normal">km/h</span></p>
                  <p className="text-[9px] text-slate-500">Direction: {windDir}</p>
                </div>

                <div className="rounded-2xl border border-slate-800/80 bg-[#0E1322] p-3.5 space-y-1">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-semibold uppercase">
                    <CloudRain size={13} className="text-indigo-400" />
                    <span>PRECIPITATION</span>
                  </div>
                  <p className="text-xl font-bold text-white">{rainProb}%</p>
                  <p className="text-[9px] text-slate-500">Peak chance today</p>
                </div>

                <div className="rounded-2xl border border-slate-800/80 bg-[#0E1322] p-3.5 space-y-1">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-semibold uppercase">
                    <Sun size={13} className="text-amber-400" />
                    <span>UV INDEX</span>
                  </div>
                  <p className="text-xl font-bold text-white">{uvMax}</p>
                  <p className="text-[9px] text-slate-500">{uvMax > 5 ? 'Moderate to High' : 'Low Protection Required'}</p>
                </div>

                <div className="rounded-2xl border border-slate-800/80 bg-[#0E1322] p-3.5 space-y-1">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-semibold uppercase">
                    <Gauge size={13} className="text-emerald-400" />
                    <span>PRESSURE</span>
                  </div>
                  <p className="text-xl font-bold text-white">{pressure} <span className="text-xs text-slate-400 font-normal">hPa</span></p>
                  <p className="text-[9px] text-slate-500">Steady atmosphere</p>
                </div>

                <div className="rounded-2xl border border-slate-800/80 bg-[#0E1322] p-3.5 space-y-1">
                  <div className="flex items-center gap-2 text-slate-400 text-[10px] font-semibold uppercase">
                    <Sunrise size={13} className="text-rose-400" />
                    <span>SUNRISE / SUNSET</span>
                  </div>
                  <p className="text-xs font-bold text-white pt-1">{sunriseTime} <span className="text-slate-500 font-normal">/</span> {sunsetTime}</p>
                  <p className="text-[9px] text-slate-500">Daylight hours</p>
                </div>
              </div>

              {/* 24-Hour Forecast Horizontal Scroll */}
              <div className="rounded-3xl border border-slate-800/80 bg-[#0E1322] p-4 shadow-sm space-y-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">12-HOUR FORECAST</span>
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pt-1 pb-1">
                  {hourlyStrip.map((item, idx) => (
                    <div key={idx} className="flex shrink-0 flex-col items-center rounded-2xl bg-slate-900/80 border border-slate-800 p-3 min-w-[68px] text-center space-y-1">
                      <span className="text-[10px] font-medium text-slate-400">{item.time}</span>
                      <Wind size={14} className="text-cyan-400 my-1" />
                      <span className="text-xs font-bold text-white">{item.temp}</span>
                      <span className="text-[9px] text-indigo-400 font-semibold">{item.rain}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 7-Day Forecast */}
              <div className="rounded-3xl border border-slate-800/80 bg-[#0E1322] p-4 shadow-sm space-y-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">7-DAY FORECAST</span>
                <div className="space-y-2.5">
                  {dailyForecast.map((d, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1.5 border-b border-slate-800/50 last:border-0 text-xs">
                      <span className="w-16 font-semibold text-slate-200">{d.day}</span>
                      <div className="flex items-center gap-2 flex-1 px-2">
                        <CloudRain size={13} className="text-cyan-400" />
                        <span className="text-slate-400 text-[11px] min-w-[90px]">{d.cond}</span>
                        <span className="text-[10px] text-indigo-400">{d.rain}% rain</span>
                      </div>
                      <div className="text-right space-x-2">
                        <span className="font-bold text-white">{d.max}°</span>
                        <span className="text-slate-500 font-medium">{d.min}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* CHAT TAB */}
          {activeTab === 'Comm' && (
            <div className="space-y-3">
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConversationId(conv.id)}
                    className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                      selectedConversationId === conv.id
                        ? 'border-cyan-500/50 bg-cyan-950/60 text-cyan-300'
                        : 'border-slate-800 bg-[#0E1322] text-slate-400'
                    }`}
                  >
                    {conv.title}
                  </button>
                ))}
              </div>

              <div className="rounded-2xl border border-slate-800/80 bg-[#0E1322] p-4 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div>
                    <h2 className="text-xs font-semibold text-white">{selectedConversation?.title || 'Active Chat'}</h2>
                    <p className="text-[10px] text-slate-400">Jarvis AI OS · Online</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-medium text-emerald-400 border border-emerald-500/20">Live</span>
                </div>

                <div className="space-y-3 min-h-[240px]">
                  <div className="flex gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/20">
                      <Bot size={14} />
                    </div>
                    <div className="rounded-2xl bg-slate-900 border border-slate-800/80 p-3 text-xs leading-relaxed text-slate-200 max-w-[85%]">
                      {selectedConversation?.assistantMessage || 'System online and ready for queries.'}
                    </div>
                  </div>

                  {selectedConversation?.summary && (
                    <div className="flex gap-2.5 justify-end">
                      <div className="rounded-2xl bg-cyan-600/20 border border-cyan-500/30 p-3 text-xs leading-relaxed text-cyan-100 max-w-[85%]">
                        {selectedConversation.summary}
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-slate-800">
                  <input
                    type="text"
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder="Type message or instruction..."
                    className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-cyan-500"
                  />
                  <button type="submit" className="flex items-center justify-center rounded-xl bg-cyan-500 px-3 text-slate-950 font-semibold hover:bg-cyan-400">
                    <Send size={14} />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TASKS TAB */}
          {activeTab === 'Tasks' && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-800/80 bg-[#0E1322] p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">TASK MANAGEMENT</span>
                  <button
                    onClick={() => setShowAddTaskMobile(!showAddTaskMobile)}
                    className="flex items-center gap-1 text-xs text-cyan-400 font-medium"
                  >
                    <Plus size={14} /> {showAddTaskMobile ? 'Close' : 'Add Task'}
                  </button>
                </div>

                {showAddTaskMobile && (
                  <form onSubmit={handleCreateTask} className="space-y-2 pt-1">
                    <input
                      type="text"
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                      placeholder="Task description..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-cyan-500"
                    />
                    <div className="flex justify-between items-center">
                      <select
                        value={newTaskPriority}
                        onChange={(e) => setNewTaskPriority(e.target.value)}
                        className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 outline-none"
                      >
                        <option value="High Priority">High Priority</option>
                        <option value="Medium Priority">Medium Priority</option>
                        <option value="Low Priority">Low Priority</option>
                      </select>
                      <button type="submit" className="rounded-xl bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400">
                        Save Task
                      </button>
                    </div>
                  </form>
                )}

                <div className="flex gap-2 border-t border-slate-800/60 pt-2.5">
                  {['All', 'In Progress', 'Ready'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setTaskFilter(f)}
                      className={`rounded-lg px-2.5 py-1 text-[10px] font-medium transition ${
                        taskFilter === f ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800/80 bg-[#0E1322] p-3.5 space-y-2">
                {filteredTasks.length === 0 ? (
                  <p className="text-center text-xs text-slate-500 py-4">No tasks found.</p>
                ) : (
                  filteredTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between py-1.5 border-b border-slate-800/40 last:border-0">
                      <div className="flex items-center gap-2.5">
                        <button onClick={() => handleToggleTaskStatus(task.id)} className="text-slate-500 hover:text-cyan-400 transition">
                          {task.status === 'Ready' ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Circle size={16} />}
                        </button>
                        <div>
                          <p className={`text-xs font-medium ${task.status === 'Ready' ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                            {task.name}
                          </p>
                          <p className="text-[10px] text-rose-400 font-medium">{task.priority || 'High Priority'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium border ${
                          task.status === 'Ready' ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300' : 'bg-cyan-950/80 border-cyan-500/30 text-cyan-300'
                        }`}>
                          {task.status || 'In Progress'}
                        </span>
                        <button onClick={() => handleDeleteTask(task.id)} className="text-slate-500 hover:text-rose-400">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'Settings' && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-slate-800/80 bg-[#0E1322] p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-sm font-bold text-white">
                  A
                </div>
                <div>
                  <p className="font-semibold text-xs text-white">Alicia</p>
                  <p className="text-[10px] text-slate-400">OptiPlex Local Node</p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800/80 bg-[#0E1322] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-200 font-medium">Live Weather Refresh</span>
                  <button onClick={() => fetchLiveWeather()} className="flex items-center gap-1 rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1 text-[10px] text-cyan-400">
                    <RefreshCw size={11} /> Refresh
                  </button>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800/60 pt-2.5">
                  <span className="text-xs text-slate-200 font-medium">Theme Mode</span>
                  <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1 text-[10px] text-slate-300 font-semibold uppercase">
                    {theme}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* BOTTOM NAV BAR */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800/80 bg-[#070A12]/95 backdrop-blur-md px-6 py-2">
          <div className="mx-auto flex max-w-md items-center justify-between">
            <button onClick={() => setActiveTab('Home')} className={`flex flex-col items-center gap-0.5 ${activeTab === 'Home' ? 'text-cyan-400' : 'text-slate-500'}`}>
              <LayoutGrid size={18} />
              <span className="text-[9px] font-medium">Home</span>
            </button>

            <button onClick={() => setActiveTab('Comm')} className={`flex flex-col items-center gap-0.5 ${activeTab === 'Comm' ? 'text-cyan-400' : 'text-slate-500'}`}>
              <MessageSquare size={18} />
              <span className="text-[9px] font-medium">Comm</span>
            </button>

            <button onClick={() => setActiveTab('Tasks')} className={`flex flex-col items-center gap-0.5 ${activeTab === 'Tasks' ? 'text-cyan-400' : 'text-slate-500'}`}>
              <ClipboardList size={18} />
              <span className="text-[9px] font-medium">Tasks</span>
            </button>

            <button onClick={() => setActiveTab('Weather')} className={`flex flex-col items-center gap-0.5 ${activeTab === 'Weather' ? 'text-cyan-400' : 'text-slate-500'}`}>
              <Wind size={18} />
              <span className="text-[9px] font-medium">Weather</span>
            </button>

            <button onClick={() => setActiveTab('Settings')} className={`flex flex-col items-center gap-0.5 ${activeTab === 'Settings' ? 'text-cyan-400' : 'text-slate-500'}`}>
              <Settings size={18} />
              <span className="text-[9px] font-medium">Settings</span>
            </button>
          </div>
        </nav>
      </div>

      {/* ========================================== */}
      {/* DESKTOP LAYOUT (>= xl)                      */}
      {/* ========================================== */}
      <div className="hidden xl:flex min-h-screen max-w-full flex-row">
        
        {/* Left Sidebar Rail */}
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

          <div className="mt-auto flex flex-col items-center gap-4">
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-2xl bg-slate-900 p-2.5 text-slate-300">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-xs font-semibold text-white">
              A
            </div>
          </div>
        </aside>

        {/* Main Desktop Container */}
        <div className="flex-1 flex flex-col">
          <header className="flex h-16 items-center justify-between border-b border-slate-800/70 px-8 bg-slate-950/40">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs text-slate-300 border border-slate-800">
                <Search size={14} className="text-slate-500" />
                <input className="w-56 bg-transparent outline-none placeholder:text-slate-500" placeholder="Search commands or tasks..." />
              </label>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-slate-400 hover:text-slate-200">
                <Bell size={18} />
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-200">Alicia</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">A</div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 grid grid-cols-12 gap-6 overflow-y-auto">
            {/* Main AI Chat Column */}
            <div className="col-span-7 flex flex-col rounded-3xl border border-slate-800/80 bg-[#0E1322] p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">{selectedConversation?.title || 'AI Chat Assistant'}</h2>
                  <p className="text-xs text-slate-400">Streaming response · Online</p>
                </div>
                <button className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400">
                  <Plus size={14} /> New Chat
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto min-h-[300px] p-2">
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300 border border-cyan-500/20">
                    <Bot size={16} />
                  </div>
                  <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 text-xs leading-relaxed text-slate-200 max-w-[80%]">
                    {selectedConversation?.assistantMessage || 'Welcome back, Alicia. What would you like to work on today?'}
                  </div>
                </div>

                {selectedConversation?.summary && (
                  <div className="flex gap-3 justify-end">
                    <div className="rounded-2xl bg-cyan-600/20 border border-cyan-500/30 p-4 text-xs leading-relaxed text-cyan-100 max-w-[80%]">
                      {selectedConversation.summary}
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-3 border-t border-slate-800">
                <button type="button" className="text-slate-400 hover:text-slate-200 p-2">
                  <Paperclip size={18} />
                </button>
                <input
                  type="text"
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  placeholder="Ask Jarvis anything or assign a task..."
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-2.5 text-xs text-slate-100 outline-none focus:border-cyan-500"
                />
                <button type="button" className="text-slate-400 hover:text-slate-200 p-2">
                  <Mic size={18} />
                </button>
                <button type="submit" className="rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-semibold text-slate-950 hover:bg-cyan-400">
                  Send
                </button>
              </form>
            </div>

            {/* Right Column */}
            <div className="col-span-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-800/80 bg-[#0E1322] p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">ACTIVE CHATS</p>
                    <p className="text-2xl font-bold text-white mt-0.5">{conversations.length}</p>
                  </div>
                  <span className="text-xs text-cyan-400 font-medium">+8%</span>
                </div>

                <div className="rounded-2xl border border-slate-800/80 bg-[#0E1322] p-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">DUE TASKS</p>
                    <p className="text-2xl font-bold text-white mt-0.5">{items.length}</p>
                  </div>
                  <span className="text-xs text-sky-400 font-medium">3 today</span>
                </div>
              </div>

              {/* Weather Hub (Desktop Right Column) */}
              <div className="rounded-3xl border border-slate-800/80 bg-[#0E1322] p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">WEATHER HUB</span>
                    <h3 className="text-base font-semibold text-white mt-0.5">{selectedLocation.name}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold text-white">{currentTemp}°C</span>
                    <p className="text-[10px] text-slate-400">Feels like {feelsLike}°C</p>
                  </div>
                </div>

                {/* Location selector pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                  {YORKSHIRE_LOCATIONS.map((loc) => (
                    <button
                      key={loc.name}
                      onClick={() => handleSelectLocation(loc)}
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition ${
                        selectedLocation.name === loc.name
                          ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300'
                          : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {loc.name}
                    </button>
                  ))}
                </div>

                <div className="rounded-2xl bg-slate-900/80 p-3 border border-slate-800 text-xs text-slate-300 leading-relaxed flex items-center gap-2.5">
                  <Sparkles size={16} className="text-cyan-400 shrink-0" />
                  <span>In {selectedLocation.name}, it's currently {condition.toLowerCase()} at {currentTemp}°C with peak high of {highTemp}°C and wind at {windSpeed} km/h.</span>
                </div>
              </div>

              {/* Tasks Manager */}
              <div className="rounded-3xl border border-slate-800/80 bg-[#0E1322] p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">TASK MANAGER</span>
                  <span className="text-xs text-slate-400">{items.length} Pending</span>
                </div>

                <form onSubmit={handleCreateTask} className="flex gap-2">
                  <input
                    type="text"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    placeholder="Quick add task..."
                    className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-100 outline-none focus:border-cyan-500"
                  />
                  <button type="submit" className="rounded-xl bg-cyan-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400">
                    Add
                  </button>
                </form>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {items.map((task) => (
                    <div key={task.id} className="flex items-center justify-between py-1.5 border-b border-slate-800/40 last:border-0">
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleToggleTaskStatus(task.id)} className="text-slate-500 hover:text-cyan-400">
                          {task.status === 'Ready' ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Circle size={16} />}
                        </button>
                        <span className={`text-xs ${task.status === 'Ready' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {task.name}
                        </span>
                      </div>
                      <button onClick={() => handleDeleteTask(task.id)} className="text-slate-500 hover:text-rose-400">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </main>
        </div>

      </div>

    </div>
  );
}

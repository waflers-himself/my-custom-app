import { useEffect, useMemo, useState } from 'react';
import {
  Bot,
  CalendarDays,
  ChevronRight,
  LayoutGrid,
  Moon,
  PanelRight,
  Search,
  Settings,
  Sun,
  Trash2,
  Wind,
  Droplets,
  Thermometer,
  MessageCircleMore,
  Plus
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: LayoutGrid },
  { label: 'COMMS', icon: Bot },
  { label: 'Project', icon: CalendarDays },
  { label: 'Status', icon: Search },
  { label: 'Settings', icon: Settings }
];

const tableData = [
  { id: 1, name: 'Bike repair', owner: 'Mina', priority: 'High', status: 'In Progress' },
  { id: 2, name: 'Route planning', owner: 'Leo', priority: 'Medium', status: 'Queued' },
  { id: 3, name: 'Weather briefing', owner: 'Ava', priority: 'Low', status: 'Ready' }
];

const weatherSlides = [
  { label: 'Wind', value: '12 km/h', icon: Wind },
  { label: 'Feels like', value: '9°C', icon: Thermometer },
  { label: 'Rain', value: '0.2 mm', icon: Droplets }
];

function App() {
  const [theme, setTheme] = useState('dark');
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [conversationLoading, setConversationLoading] = useState(true);
  const [conversationError, setConversationError] = useState(null);
  const [weatherIndex, setWeatherIndex] = useState(0);
  const [selectedRow, setSelectedRow] = useState(tableData[0]);

  const WeatherIcon = weatherSlides[weatherIndex].icon;
  const currentWeather = useMemo(() => weatherSlides[weatherIndex], [weatherIndex]);

  useEffect(() => {
    let isMounted = true;
    const fetchConversations = async () => {
      setConversationLoading(true);
      setConversationError(null);

      try {
        const response = await fetch('/api/conversations');
        if (!response.ok) {
          throw new Error(`Failed to load conversations (${response.status})`);
        }
        const data = await response.json();
        if (isMounted) {
          setConversations(data);
          setSelectedConversationId(data?.[0]?.id ?? null);
        }
      } catch (error) {
        if (isMounted) {
          setConversationError(error.message);
        }
      } finally {
        if (isMounted) {
          setConversationLoading(false);
        }
      }
    };

    fetchConversations();
    return () => {
      isMounted = false;
    };
  }, []);

  const selectedConversation = conversations.find((item) => item.id === selectedConversationId) || null;

  const handleDelete = (id) => {
    console.log('Delete request for item', id);
  };

  const cycleWeather = () => {
    setWeatherIndex((prev) => (prev + 1) % weatherSlides.length);
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="mx-auto flex min-h-screen max-w-full flex-col xl:flex-row">
        <aside className={`flex w-full flex-none flex-col gap-6 border-b border-slate-800/70 bg-slate-950/90 p-5 text-slate-100 xl:w-72 xl:border-b-0 xl:border-r xl:p-6 ${theme === 'dark' ? '' : 'bg-slate-100 text-slate-900 border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-3xl bg-cyan-500/15 p-3 text-cyan-300">
                <Bot size={22} />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Jervis</p>
                <p className="text-xs text-slate-400">AI OS</p>
              </div>
            </div>
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="rounded-2xl bg-slate-900/80 p-3 text-slate-200 transition hover:bg-slate-800">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          <nav className="space-y-3">
            {navItems.map(({ label, icon: Icon }) => (
              <button key={label} className="flex w-full items-center gap-3 rounded-3xl border border-slate-800/70 bg-slate-950/90 px-4 py-4 text-left text-sm font-medium text-slate-100 transition hover:border-cyan-500/50 hover:bg-slate-900/90">
                <Icon size={18} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-auto rounded-3xl border border-slate-800/70 bg-slate-950/90 p-4">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Account</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-500 font-semibold text-slate-950">A</div>
              <div>
                <p className="font-semibold">Alicia</p>
                <p className="text-sm text-slate-400">Product Lead</p>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-5 xl:p-8">
          <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
            <div className="rounded-[2rem] border border-slate-800/80 bg-slate-950/90 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.45)]">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Good Evening,</p>
                  <h1 className="mt-2 text-4xl font-semibold">Command Center</h1>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="flex items-center gap-2 rounded-full bg-slate-900/90 px-4 py-3 text-sm text-slate-300">
                    <Search size={16} />
                    <input className="w-40 bg-transparent text-sm outline-none placeholder:text-slate-500" placeholder="Search" />
                  </label>
                  <button className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
                    <Plus size={16} /> New chat
                  </button>
                </div>
              </div>

              <div className="mt-8 grid gap-5 xl:grid-cols-3">
                <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/90 p-5">
                  <p className="text-sm text-slate-400">Active Chats</p>
                  <p className="mt-4 text-3xl font-semibold">24</p>
                  <p className="mt-2 text-sm text-emerald-300">+8%</p>
                </div>
                <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/90 p-5">
                  <p className="text-sm text-slate-400">Due Tasks</p>
                  <p className="mt-4 text-3xl font-semibold">7</p>
                  <p className="mt-2 text-sm text-slate-400">3 today</p>
                </div>
                <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/90 p-5">
                  <p className="text-sm text-slate-400">Weather</p>
                  <p className="mt-4 text-3xl font-semibold">12°C</p>
                  <p className="mt-2 text-sm text-slate-400">Feels like 9°C</p>
                </div>
              </div>

              <div className="mt-8 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-[2rem] border border-slate-800/80 bg-slate-950/90 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Conversations</p>
                      <h2 className="mt-2 text-2xl font-semibold">Comms Hub</h2>
                    </div>
                    <button className="rounded-3xl border border-slate-800/70 px-4 py-2 text-sm text-slate-300 hover:border-cyan-500/50">All chats</button>
                  </div>

                  <div className="mt-6 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
                    <div className="space-y-3 rounded-[2rem] border border-slate-800/70 bg-slate-900/90 p-4">
                      {conversationLoading ? (
                        <div className="p-6 text-center text-sm text-slate-400">Loading conversations...</div>
                      ) : conversationError ? (
                        <div className="p-6 rounded-3xl bg-rose-500/10 text-sm text-rose-300">{conversationError}</div>
                      ) : conversations.length === 0 ? (
                        <div className="p-6 text-center text-sm text-slate-400">No conversations found.</div>
                      ) : (
                        conversations.map((conversation) => (
                          <button
                            key={conversation.id}
                            onClick={() => setSelectedConversationId(conversation.id)}
                            className={`w-full rounded-[1.5rem] px-4 py-4 text-left transition ${selectedConversationId === conversation.id ? 'border border-cyan-500/50 bg-cyan-500/10' : 'border border-slate-800/70 bg-slate-950/80 hover:border-cyan-400/40'}`}
                          >
                            <p className="font-semibold text-slate-100">{conversation.title}</p>
                            <p className="mt-1 text-sm text-slate-400">{conversation.summary}</p>
                          </button>
                        ))
                      )}
                    </div>
                    <div className="rounded-[2rem] border border-slate-800/70 bg-slate-900/80 p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Active thread</p>
                          <h3 className="mt-2 text-2xl font-semibold">{selectedConversation ? selectedConversation.title : 'Select a conversation'}</h3>
                        </div>
                        <button className="rounded-3xl border border-slate-800/70 px-3 py-2 text-sm text-slate-300 hover:border-cyan-500/50">
                          <ChevronRight size={16} />
                        </button>
                      </div>
                      <div className="mt-6 space-y-4">
                        <div className="rounded-[1.75rem] bg-slate-950/90 p-4">
                          <p className="text-sm text-slate-400">Jervis</p>
                          <p className="mt-2 text-sm leading-6 text-slate-200">{selectedConversation?.assistantMessage ?? 'Choose a conversation to view the details.'}</p>
                        </div>
                        {selectedConversation && (
                          <div className="rounded-[1.75rem] bg-slate-950/90 p-4">
                            <p className="text-sm text-slate-400">Summary</p>
                            <p className="mt-2 text-sm leading-6 text-slate-200">{selectedConversation.summary}</p>
                          </div>
                        )}
                        <div className="flex items-center gap-3 rounded-[1.75rem] border border-slate-800/70 bg-slate-950/90 px-4 py-3">
                          <input className="flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500" placeholder="Message Jervis..." />
                          <button className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-cyan-500 text-slate-950 transition hover:bg-cyan-400">
                            <Plus size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="rounded-[2rem] border border-slate-800/70 bg-slate-950/90 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Weather Hub</p>
                        <h2 className="mt-2 text-3xl font-semibold">New York</h2>
                      </div>
                      <div className="rounded-3xl bg-slate-900/80 px-4 py-3 text-right">
                        <p className="text-5xl font-semibold">12°C</p>
                        <p className="text-sm text-slate-400">Feels like 9°C</p>
                      </div>
                    </div>
                    <div className="mt-6 grid gap-3 rounded-[1.75rem] border border-slate-800/70 bg-slate-900/80 p-4">
                      <div className="flex items-center justify-between text-sm text-slate-400">
                        <span>Temperature</span>
                        <span>16°</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                        <div className="h-full w-[75%] rounded-full bg-cyan-500"></div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-slate-400">
                        <span>Feels like</span>
                        <span>9°</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                        <div className="h-full w-[55%] rounded-full bg-sky-500"></div>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[1.5rem] bg-slate-950/90 p-4 text-center">
                        <p className="text-sm text-slate-400">Now</p>
                        <p className="mt-2 text-xl font-semibold">12°</p>
                      </div>
                      <div className="rounded-[1.5rem] bg-slate-950/90 p-4 text-center">
                        <p className="text-sm text-slate-400">02:00</p>
                        <p className="mt-2 text-xl font-semibold">11°</p>
                      </div>
                      <div className="rounded-[1.5rem] bg-slate-950/90 p-4 text-center">
                        <p className="text-sm text-slate-400">04:00</p>
                        <p className="mt-2 text-xl font-semibold">10°</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-slate-800/70 bg-slate-950/90 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Action Queue</p>
                        <h2 className="mt-2 text-2xl font-semibold">Task Manager</h2>
                      </div>
                      <button className="text-sm text-slate-400 hover:text-white">View all</button>
                    </div>
                    <div className="mt-5 space-y-3">
                      {tableData.map((row) => (
                        <div key={row.id} className="flex items-center justify-between rounded-[1.75rem] border border-slate-800/70 bg-slate-900/80 px-4 py-4">
                          <div>
                            <p className="font-semibold text-slate-100">{row.name}</p>
                            <p className="mt-1 text-sm text-slate-400">{row.owner} · {row.priority}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`rounded-full px-3 py-1 text-xs ${row.status === 'In Progress' ? 'bg-cyan-500/15 text-cyan-300' : row.status === 'Queued' ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'}`}>{row.status}</span>
                            <button onClick={() => handleDelete(row.id)} className="rounded-full border border-rose-500/30 p-2 text-rose-400 hover:bg-rose-500/10"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;

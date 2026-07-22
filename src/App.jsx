import { useEffect, useMemo, useState } from 'react';
import {
  Bot,
  CalendarDays,
  ChevronRight,
  LayoutGrid,
  Moon,
  Search,
  Settings,
  Sun,
  Trash2,
  Wind,
  Droplets,
  Thermometer,
  Plus
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: LayoutGrid },
  { label: 'COMMS', icon: Bot },
  { label: 'Project', icon: CalendarDays },
  { label: 'Status', icon: Search },
  { label: 'Settings', icon: Settings }
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

  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [newTaskName, setNewTaskName] = useState('');

  const [weatherIndex, setWeatherIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setConversationLoading(true);
      setItemsLoading(true);

      try {
        const [convRes, itemsRes] = await Promise.all([
          fetch('/api/conversations'),
          fetch('/api/items')
        ]);

        if (convRes.ok) {
          const convData = await convRes.json();
          if (isMounted) {
            setConversations(convData);
            setSelectedConversationId(convData?.[0]?.id ?? null);
          }
        } else {
          throw new Error('Failed loading conversations');
        }

        if (itemsRes.ok) {
          const itemsData = await itemsRes.json();
          if (isMounted) setItems(itemsData);
        }
      } catch (error) {
        if (isMounted) setConversationError(error.message);
      } finally {
        if (isMounted) {
          setConversationLoading(false);
          setItemsLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      isMounted = false;
    };
  }, []);

  const selectedConversation = conversations.find((item) => item.id === selectedConversationId) || null;

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;

    try {
      const response = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTaskName, owner: 'User', priority: 'Medium', status: 'In Progress' })
      });

      if (response.ok) {
        const created = await response.json();
        setItems((prev) => [created, ...prev]);
        setNewTaskName('');
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
                  <p className="mt-4 text-3xl font-semibold">{conversations.length}</p>
                  <p className="mt-2 text-sm text-emerald-300">Live DB Sync</p>
                </div>
                <div className="rounded-[2rem] border border-slate-800/80 bg-slate-900/90 p-5">
                  <p className="text-sm text-slate-400">Due Tasks</p>
                  <p className="mt-4 text-3xl font-semibold">{items.length}</p>
                  <p className="mt-2 text-sm text-slate-400">In Task Manager</p>
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
                      </div>
                      <div className="mt-6 space-y-4">
                        <div className="rounded-[1.75rem] bg-slate-950/90 p-4">
                          <p className="text-sm text-slate-400">Jervis</p>
                          <p className="mt-2 text-sm leading-6 text-slate-200">{selectedConversation?.assistantMessage ?? 'Choose a conversation to view details.'}</p>
                        </div>
                        {selectedConversation && (
                          <div className="rounded-[1.75rem] bg-slate-950/90 p-4">
                            <p className="text-sm text-slate-400">Summary</p>
                            <p className="mt-2 text-sm leading-6 text-slate-200">{selectedConversation.summary}</p>
                          </div>
                        )}
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
                  </div>

                  <div className="rounded-[2rem] border border-slate-800/70 bg-slate-950/90 p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Action Queue</p>
                        <h2 className="mt-2 text-2xl font-semibold">Task Manager</h2>
                      </div>
                    </div>

                    <form onSubmit={handleCreateTask} className="mt-4 flex gap-2">
                      <input
                        type="text"
                        value={newTaskName}
                        onChange={(e) => setNewTaskName(e.target.value)}
                        placeholder="Add a new task..."
                        className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/90 px-4 py-2 text-sm outline-none focus:border-cyan-500"
                      />
                      <button type="submit" className="rounded-2xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
                        Add
                      </button>
                    </form>

                    <div className="mt-5 space-y-3">
                      {itemsLoading ? (
                        <p className="text-center text-sm text-slate-400 py-4">Loading tasks...</p>
                      ) : items.length === 0 ? (
                        <p className="text-center text-sm text-slate-400 py-4">No tasks found. Create one above!</p>
                      ) : (
                        items.map((row) => (
                          <div key={row.id} className="flex items-center justify-between rounded-[1.75rem] border border-slate-800/70 bg-slate-900/80 px-4 py-4">
                            <div>
                              <p className="font-semibold text-slate-100">{row.name}</p>
                              <p className="mt-1 text-sm text-slate-400">{row.owner} · {row.priority}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`rounded-full px-3 py-1 text-xs ${row.status === 'In Progress' ? 'bg-cyan-500/15 text-cyan-300' : row.status === 'Queued' ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'}`}>
                                {row.status}
                              </span>
                              <button onClick={() => handleDeleteTask(row.id)} className="rounded-full border border-rose-500/30 p-2 text-rose-400 hover:bg-rose-500/10">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
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

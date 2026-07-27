import React, { useState, useEffect } from 'react'; 
import { 
  Cloud, Sun, CloudRain, CloudLightning, CloudSnow, CloudFog, 
  Wind, Droplets, Calendar, Clock, MapPin, Search, Gauge
} from 'lucide-react';

const getWeatherDetails = (code) => {
  switch (code) {
    case 0:
      return { desc: 'Clear Sky', icon: Sun, color: 'text-amber-500' };
    case 1:
    case 2:
    case 3:
      return { desc: 'Partly Cloudy', icon: Cloud, color: 'text-slate-400' };
    case 45:
    case 48:
      return { desc: 'Foggy', icon: CloudFog, color: 'text-slate-400' };
    case 51:
    case 53:
    case 55:
      return { desc: 'Drizzle', icon: CloudRain, color: 'text-blue-400' };
    case 61:
    case 63:
    case 65:
      return { desc: 'Rain', icon: CloudRain, color: 'text-blue-600' };
    case 71:
    case 73:
    case 75:
      return { desc: 'Snow', icon: CloudSnow, color: 'text-indigo-300' };
    case 80:
    case 81:
    case 82:
      return { desc: 'Rain Showers', icon: CloudRain, color: 'text-blue-500' };
    case 95:
    case 96:
    case 99:
      return { desc: 'Thunderstorm', icon: CloudLightning, color: 'text-purple-500' };
    default:
      return { desc: 'Unknown', icon: Cloud, color: 'text-slate-400' };
  }
};

export default function WeatherWidget() {
  const [location, setLocation] = useState({ name: 'Huddersfield, UK', lat: 53.6458, lon: -1.7850 });
  const [searchQuery, setSearchQuery] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWeather(location.lat, location.lon);
  }, [location]);

  const fetchWeather = async (lat, lon) => {
    setLoading(true);
    setError(null);
    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,relative_humidity_2m,surface_pressure,precipitation&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,sunrise,sunset,uv_index_max&wind_speed_unit=mph&timezone=auto`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch weather data.');
      const data = await response.json();
      setWeatherData(data);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=1&language=en&format=json`;
      const res = await fetch(geoUrl);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const place = data.results[0];
        setLocation({
          name: `${place.name}${place.admin1 ? `, ${place.admin1}` : ''}, ${place.country_code ? place.country_code.toUpperCase() : ''}`,
          lat: place.latitude,
          lon: place.longitude
        });
        setSearchQuery('');
      } else {
        alert('Location not found');
      }
    } catch (err) {
      alert('Error searching for location');
    }
  };

  const getNextRainWindow = () => {
    if (!weatherData?.hourly?.time) return null;
    const now = new Date();
    const hourly = weatherData.hourly;
    
    for (let i = 0; i < hourly.time.length; i++) {
      const timeDate = new Date(hourly.time[i]);
      if (timeDate >= now && hourly.precipitation?.[i] > 0.1) {
        return {
          time: timeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: timeDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
          amount: hourly.precipitation[i],
          prob: hourly.precipitation_probability?.[i] || 0
        };
      }
    }
    return null;
  };

  const nextRain = weatherData ? getNextRainWindow() : null;
  const current = weatherData?.current;
  const currentDetails = current ? getWeatherDetails(current.weather_code) : null;
  const CurrentIcon = currentDetails?.icon;

  return (
    <div className="space-y-6 my-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 mb-1">
            <MapPin size={20} />
            <span className="text-sm font-semibold tracking-wider uppercase">Location</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-100">{location.name}</h1>
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-2.5 pl-10 text-sm focus:outline-none focus:border-indigo-500 transition-colors text-slate-100"
            />
            <Search className="absolute left-3 top-3 text-slate-400" size={16} />
          </div>
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-indigo-600/30 text-sm"
          >
            Search
          </button>
        </form>
      </div>

      {loading && (
        <div className="text-center py-12 bg-slate-800/40 rounded-2xl border border-slate-700/50">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto mb-3"></div>
          <p className="text-slate-400 text-sm">Loading weather data...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-center text-sm">
          {error}
        </div>
      )}

      {!loading && !error && weatherData && current && currentDetails && (
        <>
          <div className="bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-800/60 border border-indigo-500/30 p-4 rounded-2xl flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl">
                <CloudRain size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-indigo-200">Rainfall Alert</h3>
                <p className="text-sm text-slate-300">
                  {nextRain ? (
                    <span>
                      Next rain expected: <strong className="text-blue-400">{nextRain.time} ({nextRain.date})</strong> — approx. <strong className="text-blue-300">{nextRain.amount} mm</strong> ({nextRain.prob}% chance).
                    </span>
                  ) : (
                    <span className="text-emerald-400">No rain forecast over the next 24 hours!</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 shadow-xl flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Right Now</span>
                <div className="flex items-center justify-between mt-4">
                  <div>
                    <div className="text-5xl font-extrabold text-slate-100">{Math.round(current.temperature_2m)}°C</div>
                    <p className="text-slate-400 text-sm mt-1">Feels like {Math.round(current.apparent_temperature)}°C</p>
                  </div>
                  {CurrentIcon && <CurrentIcon size={64} className={currentDetails.color} />}
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-700/50">
                <span className="text-lg font-medium text-slate-200">{currentDetails.desc}</span>
              </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/50 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs uppercase font-medium">Wind Speed</span>
                  <Wind size={18} className="text-indigo-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-100">{Math.round(current.wind_speed_10m)} <span className="text-base font-normal text-slate-400">mph</span></div>
                  <div className="text-xs text-slate-400 mt-1">Dir: {current.wind_direction_10m}°</div>
                </div>
              </div>

              <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/50 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs uppercase font-medium">Current Rain</span>
                  <CloudRain size={18} className="text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-100">{current.precipitation} <span className="text-base font-normal text-slate-400">mm</span></div>
                  <div className="text-xs text-slate-400 mt-1">{current.precipitation > 0 ? 'Raining now' : 'Dry currently'}</div>
                </div>
              </div>

              <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/50 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs uppercase font-medium">Humidity</span>
                  <Droplets size={18} className="text-cyan-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-100">{current.relative_humidity_2m}%</div>
                  <div className="text-xs text-slate-400 mt-1">Moisture</div>
                </div>
              </div>

              <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/50 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs uppercase font-medium">Pressure</span>
                  <Gauge size={18} className="text-amber-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-100">{Math.round(current.surface_pressure)} <span className="text-base font-normal text-slate-400">hPa</span></div>
                  <div className="text-xs text-slate-400 mt-1">Surface</div>
                </div>
              </div>

              <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/50 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs uppercase font-medium">UV Index</span>
                  <Sun size={18} className="text-yellow-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-100">{weatherData.daily?.uv_index_max?.[0] ?? 'N/A'}</div>
                  <div className="text-xs text-slate-400 mt-1">Peak today</div>
                </div>
              </div>

              <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/50 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs uppercase font-medium">Today Total Rain</span>
                  <CloudRain size={18} className="text-blue-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-100">{weatherData.daily?.precipitation_sum?.[0] ?? 0} <span className="text-base font-normal text-slate-400">mm</span></div>
                  <div className="text-xs text-slate-400 mt-1">{weatherData.daily?.precipitation_probability_max?.[0] ?? 0}% max chance</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="text-indigo-400" size={20} />
                <h2 className="text-xl font-bold text-slate-100">Hourly Breakdown</h2>
              </div>
              <span className="text-xs text-slate-400">Scroll horizontally &rarr;</span>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 pt-2 scrollbar-thin scrollbar-thumb-slate-700">
              {weatherData.hourly?.time?.slice(0, 24).map((timeStr, index) => {
                const hourDate = new Date(timeStr);
                const hourLabel = hourDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const temp = Math.round(weatherData.hourly.temperature_2m[index]);
                const rainProb = weatherData.hourly.precipitation_probability[index];
                const rainMm = weatherData.hourly.precipitation[index];
                const windMph = Math.round(weatherData.hourly.wind_speed_10m[index]);
                const code = weatherData.hourly.weather_code[index];
                const details = getWeatherDetails(code);
                const Icon = details.icon;
                const isRaining = rainMm > 0;

                return (
                  <div
                    key={timeStr}
                    className={`flex-shrink-0 w-28 p-4 rounded-xl border text-center transition-all ${
                      isRaining
                        ? 'bg-blue-950/40 border-blue-500/50 shadow-lg shadow-blue-500/10'
                        : 'bg-slate-900/60 border-slate-700/50'
                    }`}
                  >
                    <span className="text-xs text-slate-400 font-medium">{hourLabel}</span>
                    <Icon size={28} className={`mx-auto my-2 ${details.color}`} />
                    <span className="text-lg font-bold block text-slate-100">{temp}°C</span>

                    <div className="mt-3 pt-2 border-t border-slate-800 space-y-1">
                      <div className="flex items-center justify-center gap-1 text-xs text-blue-400 font-semibold">
                        <Droplets size={12} />
                        <span>{rainProb}%</span>
                      </div>
                      <div className={`text-xs font-bold ${rainMm > 0 ? 'text-blue-300' : 'text-slate-500'}`}>
                        {rainMm} mm
                      </div>
                    </div>

                    <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-center gap-1">
                      <Wind size={11} />
                      <span>{windMph} mph</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="text-indigo-400" size={20} />
              <h2 className="text-xl font-bold text-slate-100">7-Day Forecast</h2>
            </div>

            <div className="divide-y divide-slate-700/50">
              {weatherData.daily?.time?.map((dayStr, index) => {
                const dayDate = new Date(dayStr);
                const dayName = index === 0 ? 'Today' : dayDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
                const maxTemp = Math.round(weatherData.daily.temperature_2m_max[index]);
                const minTemp = Math.round(weatherData.daily.temperature_2m_min[index]);
                const rainProb = weatherData.daily.precipitation_probability_max[index];
                const rainSum = weatherData.daily.precipitation_sum[index];
                const code = weatherData.daily.weather_code[index];
                const details = getWeatherDetails(code);
                const Icon = details.icon;

                return (
                  <div key={dayStr} className="py-3 flex items-center justify-between gap-4">
                    <div className="w-28 sm:w-36 font-medium text-sm text-slate-200">{dayName}</div>
                    
                    <div className="flex items-center gap-2 flex-1">
                      <Icon size={22} className={details.color} />
                      <span className="text-xs text-slate-400 hidden sm:inline">{details.desc}</span>
                    </div>

                    <div className="flex items-center gap-3 w-32 justify-end text-xs">
                      <div className="text-right">
                        <span className="text-blue-400 font-semibold block">{rainProb}%</span>
                        <span className="text-slate-400 text-[11px]">{rainSum} mm</span>
                      </div>
                    </div>

                    <div className="text-right w-20 text-sm">
                      <span className="font-bold text-slate-100">{maxTemp}°</span>
                      <span className="text-slate-400 ml-2">{minTemp}°</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

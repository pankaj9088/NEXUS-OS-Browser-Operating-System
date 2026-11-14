import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ArrowRight, 
  RotateCw, 
  Home, 
  Globe, 
  Search, 
  Plus, 
  X, 
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Star
} from 'lucide-react';

interface Tab {
  id: string;
  title: string;
  url: string;
}

export const BrowserApp: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'tab-1', title: 'Nexus Portal', url: 'https://nexus.os/portal' },
    { id: 'tab-2', title: 'DevDocs Documentation', url: 'https://devdocs.io' },
  ]);
  const [activeTabId, setActiveTabId] = useState('tab-1');
  const [inputUrl, setInputUrl] = useState('https://nexus.os/portal');
  const [history, setHistory] = useState<string[]>(['https://nexus.os/portal']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [searchProvider, setSearchProvider] = useState<'duckduckgo' | 'google' | 'wikipedia'>('duckduckgo');

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const searchEngines = {
    duckduckgo: { name: 'DuckDuckGo', queryUrl: 'https://duckduckgo.com/?q=' },
    google: { name: 'Google', queryUrl: 'https://www.google.com/search?q=' },
    wikipedia: { name: 'Wikipedia', queryUrl: 'https://en.wikipedia.org/wiki/Special:Search?search=' },
  };

  const bookmarks = [
    { name: 'Nexus Portal', url: 'https://nexus.os/portal' },
    { name: 'DevDocs API', url: 'https://devdocs.io' },
    { name: 'Wikipedia OS', url: 'https://en.wikipedia.org/wiki/Operating_system' },
    { name: 'MDN Web Docs', url: 'https://developer.mozilla.org' },
  ];

  const navigateTo = (url: string, title?: string) => {
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }
    setInputUrl(cleanUrl);
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId ? { ...t, url: cleanUrl, title: title || cleanUrl.replace('https://', '').split('/')[0] } : t
      )
    );
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), cleanUrl]);
    setHistoryIndex((prev) => prev + 1);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.includes('.') && !inputUrl.includes(' ')) {
      navigateTo(inputUrl);
    } else {
      // Search via provider
      const searchTarget = `${searchEngines[searchProvider].queryUrl}${encodeURIComponent(inputUrl)}`;
      navigateTo(searchTarget, `Search: ${inputUrl}`);
    }
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const prevUrl = history[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setInputUrl(prevUrl);
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, url: prevUrl } : t))
      );
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const nextUrl = history[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setInputUrl(nextUrl);
      setTabs((prev) =>
        prev.map((t) => (t.id === activeTabId ? { ...t, url: nextUrl } : t))
      );
    }
  };

  const addNewTab = () => {
    const newId = `tab-${Date.now()}`;
    const newTab: Tab = {
      id: newId,
      title: 'New Tab',
      url: 'https://nexus.os/portal',
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
    setInputUrl('https://nexus.os/portal');
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length <= 1) return;
    const remaining = tabs.filter((t) => t.id !== id);
    setTabs(remaining);
    if (activeTabId === id) {
      setActiveTabId(remaining[0].id);
      setInputUrl(remaining[0].url);
    }
  };

  const isInternalPortal = activeTab.url.includes('nexus.os');

  return (
    <div className="flex flex-col h-full w-full bg-[#080d1a] text-slate-200 select-none">
      {/* Tabs Row */}
      <div className="h-9 bg-slate-950/80 px-2 flex items-center gap-1 border-b border-white/5 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => {
                setActiveTabId(tab.id);
                setInputUrl(tab.url);
              }}
              className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-xl text-xs max-w-[180px] cursor-pointer transition-colors border-t border-l border-r ${
                isActive
                  ? 'bg-[#0b1222] border-white/10 text-cyan-300 font-medium'
                  : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Globe className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
              <span className="truncate">{tab.title}</span>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => closeTab(tab.id, e)}
                  className="opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded p-0.5 ml-auto text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
        <button
          onClick={addNewTab}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 ml-1"
          title="New Tab"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Nav Controls & URL Input */}
      <div className="h-10 bg-[#0b1222] px-3 flex items-center gap-2 border-b border-white/5">
        <button
          onClick={handleBack}
          disabled={historyIndex <= 0}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
          title="Back"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleForward}
          disabled={historyIndex >= history.length - 1}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
          title="Forward"
        >
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => navigateTo(activeTab.url)}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
          title="Reload"
        >
          <RotateCw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => navigateTo('https://nexus.os/portal', 'Nexus Portal')}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
          title="Home"
        >
          <Home className="w-3.5 h-3.5" />
        </button>

        {/* Search Engine Selector */}
        <select
          value={searchProvider}
          onChange={(e) => setSearchProvider(e.target.value as any)}
          className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-slate-300 outline-none"
        >
          <option value="duckduckgo">DuckDuckGo</option>
          <option value="google">Google</option>
          <option value="wikipedia">Wikipedia</option>
        </select>

        {/* Address / Search input */}
        <form onSubmit={handleUrlSubmit} className="flex-1 flex items-center">
          <div className="w-full flex items-center gap-2 px-3 py-1 bg-slate-950/70 border border-white/10 rounded-full text-xs text-slate-200 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/20">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-xs text-slate-100 font-sans"
              placeholder={`Search via ${searchEngines[searchProvider].name} or enter web URL...`}
            />
          </div>
        </form>

        <a
          href={activeTab.url}
          target="_blank"
          rel="noreferrer"
          className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/10"
          title="Open in new browser window safely"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Bookmarks bar */}
      <div className="h-7 bg-[#080d1a] px-3 flex items-center gap-4 text-[11px] text-slate-400 border-b border-white/5">
        {bookmarks.map((b) => (
          <button
            key={b.name}
            onClick={() => navigateTo(b.url, b.name)}
            className="flex items-center gap-1.5 hover:text-cyan-300 transition-colors"
          >
            <Star className="w-3 h-3 text-amber-400/80 fill-amber-400/20" />
            <span>{b.name}</span>
          </button>
        ))}
      </div>

      {/* Viewport Area */}
      <div className="flex-1 bg-slate-950 relative overflow-hidden">
        {isInternalPortal ? (
          // Nexus Portal Hub
          <div className="h-full overflow-y-auto p-8 flex flex-col items-center">
            <div className="max-w-2xl w-full text-center space-y-6 pt-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Nexus Surf Engine</h1>
                <p className="text-xs text-slate-400 mt-1">Web portal and research gateway with search provider integration</p>
              </div>

              {/* Integrated Knowledge hubs */}
              <div className="grid grid-cols-2 gap-3 pt-4 text-left">
                <div
                  onClick={() => navigateTo('https://devdocs.io', 'DevDocs API')}
                  className="p-3.5 bg-slate-900/60 hover:bg-slate-900 border border-white/5 hover:border-cyan-500/30 rounded-xl cursor-pointer transition-all"
                >
                  <h3 className="text-xs font-semibold text-cyan-300">DevDocs API Documentation</h3>
                  <p className="text-[11px] text-slate-400 mt-1">Full documentation for React, TypeScript, Python, HTML5</p>
                </div>

                <div
                  onClick={() => navigateTo('https://en.wikipedia.org/wiki/Operating_system', 'Wikipedia')}
                  className="p-3.5 bg-slate-900/60 hover:bg-slate-900 border border-white/5 hover:border-cyan-500/30 rounded-xl cursor-pointer transition-all"
                >
                  <h3 className="text-xs font-semibold text-cyan-300">Operating System Science</h3>
                  <p className="text-[11px] text-slate-400 mt-1">Architecture of kernels, virtual memory, process scheduling</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full relative">
            {/* Sandbox Notice Banner */}
            <div className="px-3 py-1 bg-slate-900/90 border-b border-white/10 text-[11px] text-slate-400 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Web Sandbox: Sites with strict X-Frame-Options policies may require opening externally.</span>
              </div>
              <a
                href={activeTab.url}
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:text-cyan-300 font-medium underline flex items-center gap-1"
              >
                <span>Launch in new tab</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <iframe
              src={activeTab.url}
              title={activeTab.title}
              className="w-full h-[calc(100%-28px)] border-none bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
        )}
      </div>
    </div>
  );
};

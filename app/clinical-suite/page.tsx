'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BrainCircuit,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  FileText,
  MessageSquare,
  Paperclip,
  Send,
  Square,
} from 'lucide-react';

type SuiteTab =
  | 'ai-decision'
  | 'task-board'
  | 'secure-chat'
  | 'document-generator';

type ChatChannel = 'nurses' | 'lab' | 'pharmacy' | 'reception';

type DailyTask = {
  id: string;
  label: string;
  category: 'follow-up' | 'pending-report' | 'critical';
  checked: boolean;
};

type ChatMessage = {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
};

type DocTemplate = {
  id: string;
  title: string;
  description: string;
};

const PIPELINE_SUMMARY =
  'Standalone clinical intelligence · AI decision support · task routing · secure comms · document generation · 13 Jul 2026';

const SUITE_TABS: { key: SuiteTab; label: string }[] = [
  { key: 'ai-decision', label: 'AI Decision Support' },
  { key: 'task-board', label: 'Task Board' },
  { key: 'secure-chat', label: 'Internal Secure Chat' },
  { key: 'document-generator', label: 'Document Generator' },
];

const CHAT_CHANNELS: { key: ChatChannel; label: string }[] = [
  { key: 'nurses', label: 'Chat with Nurses' },
  { key: 'lab', label: 'Lab' },
  { key: 'pharmacy', label: 'Pharmacy' },
  { key: 'reception', label: 'Reception' },
];

const INITIAL_TASKS: DailyTask[] = [
  { id: 't-1', label: 'Follow-up · P.N. · post-op review 14 Jul', category: 'follow-up', checked: false },
  { id: 't-2', label: 'Follow-up · R.S. · diabetes control check', category: 'follow-up', checked: true },
  { id: 't-3', label: 'Pending · CBC report · K.V.', category: 'pending-report', checked: false },
  { id: 't-4', label: 'Pending · Chest X-ray sign-off · M.A.', category: 'pending-report', checked: false },
  { id: 't-5', label: 'CRITICAL · P.N. · elevated potassium 6.1', category: 'critical', checked: false },
  { id: 't-6', label: 'CRITICAL · S.D. · chest pain triage escalation', category: 'critical', checked: false },
];

const INITIAL_CHAT: Record<ChatChannel, ChatMessage[]> = {
  nurses: [
    { id: 'n-1', sender: 'Nurse A.', text: 'Vitals updated for OT-03 · BP stable.', timestamp: '08:45' },
    { id: 'n-2', sender: 'You', text: 'Acknowledged. Prepare PACU handoff checklist.', timestamp: '08:47' },
  ],
  lab: [
    { id: 'l-1', sender: 'Lab Desk', text: 'HbA1c result ready for P.N. · flagged borderline.', timestamp: '09:10' },
  ],
  pharmacy: [
    { id: 'p-1', sender: 'Pharmacy', text: 'Warfarin interaction query on pending Rx.', timestamp: '09:22' },
    { id: 'p-2', sender: 'You', text: 'Reviewing · hold dispense until consult note.', timestamp: '09:25' },
  ],
  reception: [
    { id: 'r-1', sender: 'Reception', text: 'Walk-in slot opened · 11:30 · sandbox queue.', timestamp: '10:00' },
  ],
};

const DOC_TEMPLATES: DocTemplate[] = [
  { id: 'ref', title: 'Referral Letters', description: 'Specialist referral with clinical summary block' },
  { id: 'med-cert', title: 'Medical Certificates', description: 'Sick leave · fitness for duty · sandbox template' },
  { id: 'fit-cert', title: 'Fitness Certificates', description: 'Pre-employment · sports · travel clearance' },
  { id: 'consent', title: 'Procedure Consent Forms', description: 'Informed consent · risks · witness signatures' },
];

const INPUT_CLASS =
  'w-full rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-950 placeholder:text-slate-500 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200';

const TEXTAREA_CLASS = `${INPUT_CLASS} min-h-[100px] resize-y`;

function formatTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export default function ClinicalSuitePage() {
  const [activeTab, setActiveTab] = useState<SuiteTab>('ai-decision');
  const [tasks, setTasks] = useState<DailyTask[]>(INITIAL_TASKS);
  const [drugQuery, setDrugQuery] = useState('Warfarin + Amiodarone');
  const [allergyQuery, setAllergyQuery] = useState('Penicillin · Sulfa');
  const [aiSuggestions, setAiSuggestions] = useState(
    'Protocol match · Hypertension Stage 2 · JNC-8 first-line ARB suggested · monitor renal function · sandbox AI output only.',
  );
  const [suggestionsExpanded, setSuggestionsExpanded] = useState(true);
  const [activeChannel, setActiveChannel] = useState<ChatChannel>('nurses');
  const [chatLogs, setChatLogs] = useState<Record<ChatChannel, ChatMessage[]>>(INITIAL_CHAT);
  const [chatInput, setChatInput] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<DocTemplate | null>(null);
  const [actionNote, setActionNote] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const showNotice = useCallback((message: string) => {
    setActionNote(message);
    window.setTimeout(() => setActionNote(null), 4500);
  }, []);

  const followUpTasks = useMemo(() => tasks.filter((t) => t.category === 'follow-up'), [tasks]);
  const pendingReports = useMemo(() => tasks.filter((t) => t.category === 'pending-report'), [tasks]);
  const criticalAlerts = useMemo(() => tasks.filter((t) => t.category === 'critical'), [tasks]);

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, checked: !t.checked } : t)));
  };

  const runInteractionCheck = () => {
    showNotice(`Drug interaction scan · ${drugQuery} · sandbox · elevated bleeding risk flagged`);
  };

  const runAllergyCheck = () => {
    showNotice(`Allergy alert scan · ${allergyQuery} · cross-reactivity review simulated`);
  };

  const sendChatMessage = () => {
    const trimmed = chatInput.trim();
    if (!trimmed) return;
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'You',
      text: trimmed,
      timestamp: formatTime(),
    };
    setChatLogs((prev) => ({
      ...prev,
      [activeChannel]: [...prev[activeChannel], msg],
    }));
    setChatInput('');
    window.setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const handleFileShare = () => {
    showNotice('File sharing · sandbox attachment · no upload pipeline connected');
  };

  const renderTaskList = (items: DailyTask[], critical = false) => (
    <ul className="space-y-2">
      {items.map((task) => (
        <li key={task.id}>
          <button
            type="button"
            onClick={() => toggleTask(task.id)}
            className="flex w-full items-start gap-3 rounded-lg border-2 border-slate-200 bg-slate-50 px-3 py-2.5 text-left hover:bg-white"
          >
            {task.checked ? (
              <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800" aria-hidden />
            ) : (
              <Square className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" aria-hidden />
            )}
            <span
              className={`text-xs font-bold ${
                critical ? 'font-black text-rose-950' : 'text-slate-950'
              } ${task.checked ? 'line-through decoration-slate-400' : ''}`}
            >
              {task.label}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="min-h-screen w-full font-sans text-slate-950 selection:bg-slate-200">
      <div className="w-full space-y-5 p-4 sm:p-6 lg:p-8">
        <header className="flex w-full flex-col gap-4 border-b-2 border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Clinical Intelligence &amp; Administrative Operations
            </h1>
            <p className="mt-1 max-w-3xl text-sm font-medium leading-relaxed text-slate-800">
              {PIPELINE_SUMMARY}
            </p>
            <p className="mt-2 font-mono text-xs font-black text-slate-950">
              Active module · {SUITE_TABS.find((t) => t.key === activeTab)?.label} · tasks{' '}
              {tasks.filter((t) => t.checked).length}/{tasks.length}
            </p>
          </div>
          <div className="inline-flex shrink-0 items-center gap-2 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-xs font-black uppercase tracking-wide text-slate-950 shadow-sm">
            <BrainCircuit className="h-4 w-4 text-violet-700" aria-hidden />
            <span>INTEL_CORE_ONLINE</span>
          </div>
        </header>

        {actionNote && (
          <p role="status" className="w-full rounded-lg border-2 border-sky-300 bg-sky-50 px-4 py-2.5 text-sm font-bold text-sky-950">
            {actionNote}
          </p>
        )}

        <nav className="flex w-full flex-wrap gap-2">
          {SUITE_TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`rounded-lg border-2 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide ${
                activeTab === key
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-950 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="w-full rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] p-4 shadow-sm sm:p-5">
          {activeTab === 'ai-decision' && (
            <div className="grid w-full grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="space-y-4">
                <h2 className="text-sm font-black text-slate-950">Clinical Query Inputs</h2>
                <label className="block space-y-1.5">
                  <span className="text-xs font-black uppercase text-slate-950">Drug Interactions</span>
                  <input className={INPUT_CLASS} value={drugQuery} onChange={(e) => setDrugQuery(e.target.value)} />
                  <button
                    type="button"
                    onClick={runInteractionCheck}
                    className="mt-2 rounded-lg border-2 border-slate-900 bg-slate-900 px-3 py-2 text-[10px] font-black uppercase text-white hover:bg-slate-800"
                  >
                    Run Interaction Scan
                  </button>
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-black uppercase text-slate-950">Allergy Alerts</span>
                  <input className={INPUT_CLASS} value={allergyQuery} onChange={(e) => setAllergyQuery(e.target.value)} />
                  <button
                    type="button"
                    onClick={runAllergyCheck}
                    className="mt-2 rounded-lg border-2 border-slate-200 bg-white px-3 py-2 text-[10px] font-black uppercase text-slate-950 hover:bg-slate-50"
                  >
                    Run Allergy Scan
                  </button>
                </label>
              </div>
              <div className="space-y-4">
                <div className="rounded-xl border-2 border-rose-400 bg-rose-50 p-4">
                  <p className="flex items-center gap-2 text-xs font-black uppercase text-rose-950">
                    <AlertTriangle className="h-4 w-4" aria-hidden />
                    High-Risk Medicine Warning
                  </p>
                  <p className="mt-2 text-sm font-bold text-rose-950">
                    Warfarin + NSAID co-prescription · bleeding risk elevated · review INR schedule · sandbox alert
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)]">
                  <button
                    type="button"
                    onClick={() => setSuggestionsExpanded((p) => !p)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                  >
                    <span className="text-sm font-black text-slate-950">
                      AI Clinical Suggestions &amp; Disease Protocols
                    </span>
                    {suggestionsExpanded ? (
                      <ChevronUp className="h-4 w-4 text-slate-950" aria-hidden />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-950" aria-hidden />
                    )}
                  </button>
                  {suggestionsExpanded && (
                    <div className="border-t-2 border-slate-200 px-4 pb-4">
                      <textarea
                        className={`${TEXTAREA_CLASS} mt-3`}
                        value={aiSuggestions}
                        onChange={(e) => setAiSuggestions(e.target.value)}
                        rows={5}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'task-board' && (
            <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-3">
              <section className="rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] p-4">
                <h2 className="text-sm font-black text-slate-950">Follow-up Reminders</h2>
                <div className="mt-3">{renderTaskList(followUpTasks)}</div>
              </section>
              <section className="rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] p-4">
                <h2 className="text-sm font-black text-slate-950">Pending Reports</h2>
                <div className="mt-3">{renderTaskList(pendingReports)}</div>
              </section>
              <section className="rounded-xl border-2 border-rose-300 bg-rose-50 p-4">
                <h2 className="text-sm font-black text-rose-950">Critical Patient Alerts</h2>
                <div className="mt-3">{renderTaskList(criticalAlerts, true)}</div>
              </section>
            </div>
          )}

          {activeTab === 'secure-chat' && (
            <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-[30%_70%]">
              <div className="space-y-2">
                {CHAT_CHANNELS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveChannel(key)}
                    className={`flex w-full items-center gap-2 rounded-lg border-2 px-3 py-2.5 text-left text-xs font-black ${
                      activeChannel === key
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-950 hover:bg-white'
                    }`}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0" aria-hidden />
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex flex-col rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)]">
                <div className="border-b-2 border-slate-200 px-4 py-3">
                  <p className="text-sm font-black text-slate-950">
                    {CHAT_CHANNELS.find((c) => c.key === activeChannel)?.label}
                  </p>
                  <p className="text-[10px] font-bold text-slate-800">Internal secure channel · sandbox only</p>
                </div>
                <div className="max-h-64 flex-1 space-y-2 overflow-y-auto p-4" role="log" aria-live="polite">
                  {chatLogs[activeChannel].map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === 'You' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-3 py-2 text-xs font-bold ${
                          msg.sender === 'You'
                            ? 'bg-slate-900 text-white'
                            : 'border-2 border-slate-200 bg-white text-slate-950'
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="mt-0.5 text-[10px] font-bold text-slate-600">
                        {msg.sender} · {msg.timestamp}
                      </span>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="flex gap-2 border-t-2 border-slate-200 p-3">
                  <button
                    type="button"
                    onClick={handleFileShare}
                    className="shrink-0 rounded-lg border-2 border-slate-200 bg-white p-2 text-slate-950 hover:bg-slate-50"
                    aria-label="File sharing"
                  >
                    <Paperclip className="h-4 w-4" aria-hidden />
                  </button>
                  <input
                    type="text"
                    className={INPUT_CLASS}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), sendChatMessage())}
                    placeholder="Type secure message…"
                    aria-label="Chat input"
                  />
                  <button
                    type="button"
                    onClick={sendChatMessage}
                    disabled={!chatInput.trim()}
                    className="shrink-0 rounded-lg border-2 border-slate-900 bg-slate-900 p-2 text-white hover:bg-slate-800 disabled:opacity-40"
                    aria-label="Send message"
                  >
                    <Send className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'document-generator' && (
            <div className="grid w-full grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {DOC_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      setSelectedTemplate(tpl);
                      showNotice(`Template loaded · ${tpl.title} · preview sandbox`);
                    }}
                    className={`rounded-xl border-2 p-4 text-left transition-all hover:scale-[1.02] ${
                      selectedTemplate?.id === tpl.id
                        ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900 ring-offset-2'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <FileText className="h-5 w-5 text-slate-950" aria-hidden />
                    <p className="mt-2 text-sm font-black text-slate-950">{tpl.title}</p>
                    <p className="mt-1 text-xs font-bold text-slate-800">{tpl.description}</p>
                  </button>
                ))}
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-white shadow-[0_4px_16px_-4px_rgba(0,117,140,0.03)] p-5">
                <h2 className="text-sm font-black text-slate-950">Document Preview</h2>
                {selectedTemplate ? (
                  <article className="mt-4 space-y-3 rounded-lg border-2 border-slate-200 bg-white p-4">
                    <p className="text-xs font-black uppercase text-slate-800">Nexora Clinical · Sandbox</p>
                    <p className="text-lg font-black text-slate-950">{selectedTemplate.title}</p>
                    <p className="text-sm font-bold text-slate-950">Patient · P.N. · UHID NX-2026-301882</p>
                    <p className="text-xs font-bold leading-relaxed text-slate-800">
                      This document is generated in standalone sandbox mode. Content blocks populate from
                      clinical context. {selectedTemplate.description}. Date · 13 Jul 2026.
                    </p>
                    <p className="border-t-2 border-slate-200 pt-3 text-[10px] font-bold text-slate-800">
                      Authorized signatory · Dr. Sandbox · Registration NX-MD-00421
                    </p>
                  </article>
                ) : (
                  <p className="mt-4 text-sm font-bold text-slate-800">
                    Select a template to open structured preview.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

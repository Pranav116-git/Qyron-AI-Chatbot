export default function EmptyState({ onSuggestionClick, isLoading, onSavePrompt }) {
  const suggestions = [
    { icon: 'school', label: 'Learn', prompt: 'Explain a difficult topic to me in simple words.', description: 'Understand any topic in simple words', colorClass: 'bg-secondary-container/20 text-secondary' },
    { icon: 'code', label: 'Code', prompt: 'Help me debug and improve my code.', description: 'Write, debug and improve your code', colorClass: 'bg-tertiary-container/20 text-tertiary' },
    { icon: 'lightbulb', label: 'Create', prompt: 'Help me brainstorm creative ideas.', description: 'Brainstorm ideas and create content', colorClass: 'bg-warning/20 text-warning' },
    { icon: 'edit_document', label: 'Write', prompt: 'Help me improve and refine my writing.', description: 'Improve, summarize and refine writing', colorClass: 'bg-secondary/20 text-secondary' },
  ]

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full">
      {/* Central Focal Point — Qyron Core */}
      <div className={`mb-8 relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center qyron-core-container group ${isLoading ? 'is-thinking' : ''}`}>
        <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
        <svg className="w-full h-full drop-shadow-2xl pointer-events-none" fill="none" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient cx="50%" cy="50%" id="coreGlow" r="50%">
              <stop offset="0%" stopColor="#6063ee" stopOpacity="0.9"></stop>
              <stop offset="50%" stopColor="#4648d4" stopOpacity="0.5"></stop>
              <stop offset="100%" stopColor="#8127cf" stopOpacity="0"></stop>
            </radialGradient>
            <radialGradient cx="50%" cy="50%" id="innerGlow" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8"></stop>
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0"></stop>
            </radialGradient>
          </defs>
          <g className="core-glow pointer-events-none">
            <circle cx="100" cy="100" fill="url(#coreGlow)" r="45"></circle>
            <circle cx="100" cy="100" fill="url(#innerGlow)" r="20"></circle>
          </g>
          <g className="orbital-arcs pointer-events-none">
            <circle cx="100" cy="100" fill="none" r="70" stroke="#8127cf" strokeDasharray="20 10 50 40 10 30" strokeOpacity="0.3" strokeWidth="1.5"></circle>
            <circle cx="100" cy="100" fill="none" r="80" stroke="#6063ee" strokeDasharray="30 40 10 20 60 10" strokeOpacity="0.2" strokeWidth="1"></circle>
            <circle cx="100" cy="100" fill="none" r="90" stroke="#4648d4" strokeDasharray="100 50 10 20" strokeOpacity="0.15" strokeWidth="0.5"></circle>
          </g>
          <g className="particles pointer-events-none">
            <circle cx="30" cy="100" fill="#6063ee" opacity="0.6" r="2"></circle>
            <circle cx="170" cy="100" fill="#8127cf" opacity="0.8" r="1.5"></circle>
            <circle cx="100" cy="25" fill="#4648d4" opacity="0.5" r="2.5"></circle>
            <circle cx="100" cy="175" fill="#c0c1ff" opacity="0.7" r="1"></circle>
            <circle cx="50" cy="50" fill="#9c48ea" opacity="0.6" r="1.5"></circle>
            <circle cx="150" cy="150" fill="#57dffe" opacity="0.4" r="2"></circle>
          </g>
        </svg>
      </div>

      {/* Welcome Text */}
      <div className="text-center mb-12 px-4">
        <h2 className="text-headline-lg md:text-[48px] md:leading-[56px] mb-4 font-bold">
          Hi, I'm <span className="gradient-text">Qyron.</span>
        </h2>
        <p className="text-body-lg text-on-surface-variant max-w-xl mx-auto">
          Your intelligent AI assistant. Ask anything. Learn anything. Create anything.
        </p>
      </div>

      {/* Prompt Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full px-4">
        {suggestions.map((s) => (
          <button
            key={s.label}
            onClick={() => onSuggestionClick(s.prompt)}
            className="glass-panel rounded-2xl p-5 text-left flex flex-col gap-3 hover:bg-surface-container-low/60 hover:-translate-y-1 transition-all duration-300 group"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.colorClass}`}>
              <span className="material-symbols-outlined">{s.icon}</span>
            </div>
            <div>
              <h3 className="text-headline-sm mb-1 text-on-surface">{s.label}</h3>
              <p className="text-body-md text-on-surface-variant group-hover:text-on-surface transition-colors">{s.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

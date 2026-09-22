import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from 'react'
import {
  AnimatePresence,
  LayoutGroup,
  animate,
  motion,
  type MotionValue,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from 'motion/react'
import { TextShimmer } from './components/ui/shimmer-text'

const DISCLOSE = {
  type: 'spring',
  stiffness: 150,
  damping: 27,
  mass: 1,
} as const

const CROSSFADE = {
  type: 'spring',
  stiffness: 260,
  damping: 34,
  mass: .8,
} as const

const ASK_REVEAL = {
  type: 'spring',
  stiffness: 140,
  damping: 24,
  mass: .95,
} as const

const ASK_ORB = {
  type: 'spring',
  stiffness: 72,
  damping: 16,
  mass: 1.15,
} as const

const STORY_MORPH = {
  type: 'spring',
  stiffness: 280,
  damping: 32,
  mass: .9,
} as const

const LEAVE = [.4, 0, 1, 1] as const

const ORB_HOME = {
  top: 536,
  left: -65,
  width: 524,
  height: 531,
  borderRadius: 262,
} as const

const ORB_ASK = {
  top: 770,
  left: 39,
  width: 20,
  height: 20,
  borderRadius: 20,
} as const

type SwipeIntent = { dir: -1 | 0 | 1; step: number }

const BLANK_SWIPE: SwipeIntent = { dir: 0, step: 0 }

const stories = [
  {
    topic: 'Artificial intelligence',
    title: 'Is the AI industry really ready to slow down?',
    summary:
      'We’re seeing a big debate over AI safety and a potential slowdown, as Anthropic CEO Dario Amodei recently published a plan to “pace the frontier,” while industry leaders remain divided.',
    age: '25min ago',
  },
  {
    topic: 'Emerging interfaces',
    title: 'AI hardware is moving beyond the screen',
    summary:
      'A new group of devices is betting that ambient, voice-first interfaces can make computing feel less demanding and more present.',
    age: '1hr ago',
  },
  {
    topic: 'Robotics',
    title: 'Humanoid robots are entering their factory era',
    summary:
      'Pilot programs are becoming longer and more practical, revealing where general-purpose robots are useful—and where they still fall short.',
    age: '2hrs ago',
  },
  {
    topic: 'Consumer technology',
    title: 'The next phone upgrade may be mostly invisible',
    summary:
      'This year’s biggest changes are likely to come from on-device models, improved battery chemistry, and software that understands more context.',
    age: '3hrs ago',
  },
  {
    topic: 'Startups',
    title: 'Small teams are learning to build at a new scale',
    summary:
      'Agentic development tools are changing the economics of early-stage products, but distribution remains harder than production.',
    age: '5hrs ago',
  },
  {
    topic: 'AI in healthcare',
    title: 'Clinical copilots are facing their real test',
    summary:
      'Hospitals are moving from limited trials to daily use, putting reliability, workflow integration, and accountability under scrutiny.',
    age: '7hrs ago',
  },
  {
    topic: 'Research',
    title: 'A quieter week still produced one important signal',
    summary:
      'Researchers found a more efficient way to adapt smaller models, potentially making private, specialized AI easier to deploy.',
    age: '9hrs ago',
  },
]

const agents = [
  { id: 'climate', label: 'Climate radar', image: '/assets/orb-climate.png', background: '/assets/orb-bg-climate.png', contrast: 'dark' },
  { id: 'travel', label: 'Travel watch', image: '/assets/orb-travel.png', background: '/assets/orb-bg-travel.png', contrast: 'dark' },
  { id: 'culture', label: 'Culture scout', image: '/assets/orb-culture.png', background: '/assets/orb-bg-culture.png', contrast: 'dark' },
  { id: 'tech', label: 'Tech radar', image: '/assets/orb-tech.png', background: '/assets/orb-bg-tech.png', contrast: 'light' },
  { id: 'money', label: 'Money watch', image: '/assets/orb-money.png', background: '/assets/orb-bg-money.png', contrast: 'dark' },
  { id: 'science', label: 'Science brief', image: '/assets/orb-science.png', background: '/assets/orb-bg-science.png', contrast: 'dark' },
  { id: 'world', label: 'World watch', image: '/assets/orb-world.png', background: '/assets/orb-bg-world.png', contrast: 'dark' },
]

const AGENT_PROMPTS: Record<string, string[]> = {
  climate: [
    'What climate signals matter most today?',
    'What changed fastest this week?',
    'What deserves more attention?',
  ],
  travel: [
    'Where is travel changing right now?',
    'What destinations should I watch?',
    'What might affect upcoming trips?',
  ],
  culture: [
    'What is shaping culture right now?',
    'What should I be paying attention to?',
    'What is emerging outside the mainstream?',
  ],
  tech: [
    'What are the biggest AI trends right now?',
    'What’s changing fastest in tech?',
    'What’s overhyped in AI',
  ],
  money: [
    'What is moving markets right now?',
    'What economic signals should I watch?',
    'What changed this week?',
  ],
  science: [
    'What scientific advances matter right now?',
    'What research should I be watching?',
    'What findings are still uncertain?',
  ],
  world: [
    'What global developments matter most?',
    'Where are perspectives changing?',
    'What might I have missed?',
  ],
}

const sourceIcons = [
  '/assets/source-tc.svg',
  '/assets/source-cnn.svg',
  '/assets/source-b.svg',
  '/assets/source-a.svg',
  '/assets/source-nbc.svg',
]

type Agent = (typeof agents)[number]

const AGENT_SLOT = 72
const AGENT_VIEWPORT = 393
const AGENT_CENTER = AGENT_VIEWPORT / 2
const AGENT_COPIES = 35
const AGENT_HOME_GROUP = 14

function AgentOrb({
  agent,
  virtualIndex,
  trackX,
  onSelect,
  accessible,
}: {
  agent: Agent
  virtualIndex: number
  trackX: MotionValue<number>
  onSelect: (virtualIndex: number) => void
  accessible: boolean
}) {
  const center = (virtualIndex * AGENT_SLOT) + (AGENT_SLOT / 2)
  const distance = useTransform(trackX, (value) => value + center - AGENT_CENTER)
  const scale = useTransform(distance, [-AGENT_SLOT, 0, AGENT_SLOT], [.61, 1, .61])
  const opacity = useTransform(
    distance,
    [-AGENT_SLOT, -20, 20, AGENT_SLOT],
    [.35, 1, 1, .35],
  )

  return (
    <div className="agent-slot">
      <motion.button
        type="button"
        className="agent-orb"
        style={{ scale, opacity }}
        onClick={() => onSelect(virtualIndex)}
        aria-label={accessible ? `Center ${agent.label}` : undefined}
        aria-hidden={!accessible}
        tabIndex={accessible ? 0 : -1}
      >
        <img src={agent.image} alt="" />
      </motion.button>
    </div>
  )
}

function AgentCarousel({
  activeId,
  onSelect,
}: {
  activeId: string
  onSelect: (agent: Agent) => void
}) {
  const reduced = useReducedMotion() === true
  const initialAgent = Math.max(0, agents.findIndex((agent) => agent.id === activeId))
  const initialIndex = AGENT_HOME_GROUP + initialAgent
  const positionFor = (virtualIndex: number) => (
    AGENT_CENTER - ((virtualIndex * AGENT_SLOT) + (AGENT_SLOT / 2))
  )
  const trackX = useMotionValue(positionFor(initialIndex))
  const selectedIndex = useRef(initialIndex)
  const dragging = useRef(false)
  const dragged = useRef(false)
  const pointerStart = useRef<number | null>(null)
  const pointerTrackStart = useRef(0)
  const releaseHandled = useRef(false)
  const wheelTimer = useRef<number | null>(null)

  const virtualAgents = Array.from({ length: AGENT_COPIES }, (_, index) => ({
    agent: agents[index % agents.length],
    virtualIndex: index,
  }))

  const nearestIndex = () => {
    const raw = Math.round(
      (AGENT_CENTER - trackX.get() - (AGENT_SLOT / 2)) / AGENT_SLOT,
    )
    return Math.max(0, Math.min(AGENT_COPIES - 1, raw))
  }

  const reportCentered = () => {
    const nearest = nearestIndex()
    if (nearest === selectedIndex.current) return
    selectedIndex.current = nearest
    onSelect(agents[nearest % agents.length])
  }

  const snapTo = (virtualIndex: number) => {
    const bounded = Math.max(0, Math.min(AGENT_COPIES - 1, virtualIndex))
    selectedIndex.current = bounded
    onSelect(agents[bounded % agents.length])
    const target = positionFor(bounded)
    const controls = animate(
      trackX,
      target,
      reduced ? { duration: 0 } : DISCLOSE,
    )

    controls.then(() => {
      const normalized = AGENT_HOME_GROUP + (bounded % agents.length)
      if (normalized !== bounded) {
        selectedIndex.current = normalized
        trackX.set(positionFor(normalized))
      }
    })
  }

  const finishDrag = () => {
    if (releaseHandled.current) return
    releaseHandled.current = true
    dragging.current = false
    snapTo(nearestIndex())
    window.setTimeout(() => {
      dragged.current = false
    }, 0)
  }

  useEffect(() => {
    const agentIndex = agents.findIndex((agent) => agent.id === activeId)
    if (agentIndex < 0 || dragging.current) return
    if ((selectedIndex.current % agents.length) === agentIndex) return
    snapTo(AGENT_HOME_GROUP + agentIndex)
  }, [activeId])

  useEffect(() => () => {
    if (wheelTimer.current !== null) window.clearTimeout(wheelTimer.current)
  }, [])

  return (
    <div
      className="agent-carousel"
      aria-label="Your agents"
      role="group"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
        event.preventDefault()
        snapTo(selectedIndex.current + (event.key === 'ArrowRight' ? 1 : -1))
      }}
      onWheel={(event) => {
        event.preventDefault()
        const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY
        trackX.set(trackX.get() - delta)
        reportCentered()
        if (wheelTimer.current !== null) window.clearTimeout(wheelTimer.current)
        wheelTimer.current = window.setTimeout(() => snapTo(nearestIndex()), 90)
      }}
    >
      <motion.div
        className="agent-track"
        drag="x"
        dragMomentum={false}
        dragElastic={0}
        style={{ x: trackX }}
        onPointerDown={(event) => {
          pointerStart.current = event.clientX
          pointerTrackStart.current = trackX.get()
          releaseHandled.current = false
          dragging.current = true
          dragged.current = false
        }}
        onPointerMove={(event) => {
          if (pointerStart.current === null) return
          const dx = event.clientX - pointerStart.current
          if (Math.abs(dx) > 3) dragged.current = true
          trackX.set(pointerTrackStart.current + dx)
          reportCentered()
        }}
        onPointerUp={() => {
          pointerStart.current = null
          if (dragged.current) {
            queueMicrotask(finishDrag)
          } else {
            releaseHandled.current = true
            dragging.current = false
          }
        }}
        onPointerCancel={() => {
          pointerStart.current = null
          finishDrag()
        }}
        onDragStart={() => {
          releaseHandled.current = false
          dragging.current = true
        }}
        onDrag={() => reportCentered()}
        onDragEnd={finishDrag}
      >
        {virtualAgents.map(({ agent, virtualIndex }) => (
          <AgentOrb
            agent={agent}
            virtualIndex={virtualIndex}
            trackX={trackX}
            accessible={
              virtualIndex >= AGENT_HOME_GROUP
              && virtualIndex < AGENT_HOME_GROUP + agents.length
            }
            onSelect={(index) => {
              if (dragged.current) return
              snapTo(index)
            }}
            key={`${agent.id}-${virtualIndex}`}
          />
        ))}
      </motion.div>
    </div>
  )
}

function StatusBar({
  background = 'light',
}: {
  background?: 'light' | 'dark'
}) {
  return (
    <div
      className={`status-bar${background === 'dark' ? ' status-bar--inverse' : ''}`}
      aria-label="iPhone status bar"
    >
      <span className="status-time">9:41</span>
      <div className="status-icons" aria-hidden="true">
        <svg viewBox="0 0 18 12"><path d="M1 11V8.5M5 11V6M9 11V3.5M13 11V1" /></svg>
        <svg className="wifi" viewBox="0 0 18 12"><path d="M1 4c4.4-4 11.6-4 16 0M4 7c2.8-2.5 7.2-2.5 10 0M7.3 10c1-.9 2.4-.9 3.4 0" /></svg>
        <span className="battery"><span /></span>
      </div>
    </div>
  )
}

type AppPage = 'home' | 'discover'

const menuItems = [
  { id: 'home' as const, label: 'Home', icon: '/assets/menu-home.svg', idleIcon: '/assets/menu-home-stroke.svg' },
  { id: 'agents' as const, label: 'My agents', icon: '/assets/menu-agents.svg' },
  { id: 'discover' as const, label: 'Discover', icon: '/assets/menu-discover-filled.svg', idleIcon: '/assets/menu-discover.svg' },
  { id: 'account' as const, label: 'Account', icon: '/assets/menu-account.svg' },
]

const discoverPeople = [
  '/assets/discover-person-1.png',
  '/assets/discover-person-2.png',
  '/assets/discover-person-3.png',
  '/assets/discover-person-4.png',
  '/assets/discover-person-5.png',
]

const discoverForYou = [
  {
    id: 'healthcare',
    agentId: 'tech',
    title: 'AI in healthcare',
    summary: 'AI is moving from administrative tools to clinical environments.',
  },
  {
    id: 'hotels',
    agentId: 'culture',
    title: 'Japanese design hotels',
    summary: 'A new wave of design hotels is redefining travel in Japan.',
  },
  {
    id: 'agents-consumers',
    agentId: 'tech',
    title: 'Are AI agents becoming consumers?',
    summary: 'A question worth following as software starts buying, booking, and negotiating on our behalf.',
  },
  {
    id: 'humanoids',
    agentId: 'science',
    title: 'Humanoid robots enter factories',
    summary: 'An emerging topic outside your usual radar, now moving from demos to daily work.',
  },
]

function MenuLayer({
  open,
  page,
  onNavigate,
  onClose,
  closeRef,
}: {
  open: boolean
  page: AppPage
  onNavigate: (page: AppPage) => void
  onClose: () => void
  closeRef: RefObject<HTMLButtonElement | null>
}) {
  return (
    <div
      className="menu-layer"
      role="dialog"
      aria-label="Menu"
      aria-modal={open || undefined}
      aria-hidden={!open}
      inert={!open}
    >
      <StatusBar background="dark" />
      <nav className="menu-nav" aria-label="Primary navigation">
        {menuItems.map((item) => {
          const navigable = item.id === 'home' || item.id === 'discover'
          const active = item.id === page
          const icon = !active && item.idleIcon ? item.idleIcon : item.icon

          if (!navigable) {
            return (
              <div className="menu-item" key={item.label}>
                <span className="menu-item-icon">
                  <img src={icon} alt="" />
                </span>
                <span>{item.label}</span>
              </div>
            )
          }

          return (
            <button
              className={`menu-item${active ? ' is-active' : ''}`}
              type="button"
              aria-current={active ? 'page' : undefined}
              onClick={() => {
                onNavigate(item.id)
                onClose()
              }}
              key={item.label}
            >
              <span className="menu-item-icon">
                <img src={icon} alt="" />
              </span>
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
      <button
        className="menu-close-hint"
        type="button"
        onClick={onClose}
        ref={closeRef}
      >
        Slide up
      </button>
    </div>
  )
}

type ChatMessage = {
  id: number
  role: 'user' | 'agent'
  text: string
}

function AskScreen({
  agent,
  showOrb,
  seedQuestion,
  onAgentChange,
  onClose,
}: {
  agent: Agent
  showOrb: boolean
  seedQuestion?: string
  onAgentChange: (agent: Agent) => void
  onClose: () => void
}) {
  const [value, setValue] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (!seedQuestion) return []
    const storyAsk = seedQuestion.startsWith('What should I understand about')
    return [
      { id: 1, role: 'user', text: seedQuestion },
      {
        id: 2,
        role: 'agent',
        text: storyAsk
          ? `${agent.label} compared the sources on this story. The synthesis is the same one you just read: what is agreed, where perspectives differ, and what is still unclear. There is no truth score—ask a follow-up if you want to inspect a claim or a source.`
          : `${agent.label} reviewed today’s signals and compressed them into one briefing. The strongest through-line is change at the frontier—what’s moving, what’s overhyped, and what still needs watching.`,
      },
    ]
  })
  const [agentMenuOpen, setAgentMenuOpen] = useState(false)
  const prompts = AGENT_PROMPTS[agent.id] ?? AGENT_PROMPTS.tech

  const sendQuestion = (question: string) => {
    const text = question.trim()
    if (!text) return

    const id = Date.now()
    setMessages((current) => [
      ...current,
      { id, role: 'user', text },
      {
        id: id + 1,
        role: 'agent',
        text: `${agent.label} is monitoring this. I’ll prioritize meaningful changes, compare sources, and separate the signal from the noise.`,
      },
    ])
    setValue('')
  }

  return (
    <motion.section
      className="ask-screen"
      role="dialog"
      aria-modal="true"
      aria-label={`Ask ${agent.label}`}
      initial={{ backgroundColor: 'rgba(245, 243, 241, 0)' }}
      animate={{ backgroundColor: 'rgba(245, 243, 241, 1)' }}
      exit={{ backgroundColor: 'rgba(245, 243, 241, 0)' }}
      transition={{ duration: .42, ease: [.22, 1, .36, 1] }}
    >
      <motion.div
        className="ask-screen-ui"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: .42, delay: .28, ease: [.22, 1, .36, 1] }}
      >
        <StatusBar />

        <button
          className="ask-screen-close"
          type="button"
          onClick={onClose}
          aria-label="Close chat"
        >
          <img src="/assets/ask-close.svg" alt="" />
        </button>

        {messages.length === 0 ? (
          <div className="ask-prompts" aria-label="Suggested questions">
            {prompts.map((prompt, index) => (
              <motion.button
                type="button"
                onClick={() => sendQuestion(prompt)}
                key={prompt}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: .36, delay: .4 + index * .06, ease: [.22, 1, .36, 1] }}
              >
                {prompt}
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="chat-thread" aria-live="polite">
            {messages.map((message) => (
              <div
                className={`chat-message chat-message--${message.role}`}
                key={message.id}
              >
                {message.role === 'agent' && (
                  <img src={agent.image} alt="" aria-hidden="true" />
                )}
                <p>{message.text}</p>
              </div>
            ))}
          </div>
        )}

        <form
          className="ask-composer"
          onSubmit={(event) => {
            event.preventDefault()
            sendQuestion(value)
          }}
        >
          <textarea
            autoFocus
            value={value}
            rows={2}
            placeholder="Ask me anything.."
            aria-label={`Message ${agent.label}`}
            onChange={(event) => setValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' || event.shiftKey) return
              event.preventDefault()
              sendQuestion(value)
            }}
          />

          <div className="ask-agent-picker">
            <button
              className="ask-agent-trigger"
              type="button"
              aria-haspopup="listbox"
              aria-expanded={agentMenuOpen}
              onClick={() => setAgentMenuOpen((current) => !current)}
            >
              <img
                className="ask-agent-orb"
                src={agent.background}
                alt=""
                style={{ opacity: showOrb ? 1 : 0 }}
              />
              <span>{agent.label}</span>
              <img className="ask-agent-chevron" src="/assets/ask-chevron.svg" alt="" />
            </button>

          {agentMenuOpen && (
            <div className="ask-agent-menu" role="listbox" aria-label="Choose an agent">
              {agents.map((option) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={option.id === agent.id}
                  onClick={() => {
                    onAgentChange(option)
                    setAgentMenuOpen(false)
                  }}
                  key={option.id}
                >
                  <img src={option.image} alt="" />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          className="ask-send"
          type="submit"
          disabled={!value.trim()}
          aria-label="Send message"
        >
          <img src="/assets/ask-send.svg" alt="" />
        </button>
      </form>
      </motion.div>
    </motion.section>
  )
}

function SourceRow({
  age,
  layoutId,
}: {
  age: string
  layoutId?: string
}) {
  return (
    <motion.div className="story-meta" layoutId={layoutId} layout="position">
      <div className="sources">
        <div className="source-icons" aria-hidden="true">
          {sourceIcons.map((icon) => <img src={icon} alt="" key={icon} />)}
        </div>
        <span>12 sources</span>
      </div>
      <div className="age">
        <img src="/assets/clock.svg" alt="" />
        <span>{age}</span>
      </div>
    </motion.div>
  )
}

const STORY_DETAIL = {
  title: 'Should AI have a seat in the therapy room?',
  lede: 'AI is starting to enter therapy sessions as a copilot, helping psychologists take notes, remember important details and spot patterns across conversations. The idea is not to replace clinical judgment, but to give therapists better tools to support it.',
  image: '/assets/story-hero.png',
  age: '25min ago',
  duration: '3:50',
  brief: {
    tldr: [
      'AI tools can now listen to sessions, create notes and bring back relevant moments from previous conversations.',
      'For therapists, this could mean less time documenting and more attention on the patient. But therapy involves deeply personal information, making privacy, consent and the role AI plays in the session especially important.',
      'The debate is shifting from whether AI should be used in therapy to where its role should end.',
    ],
    deep: [
      'AI tools can now listen to sessions, create notes and bring back relevant moments from previous conversations. Vendors describe this as a copilot for documentation and recall, not a replacement for the therapist.',
      'For therapists, this could mean less time documenting and more attention on the patient. Clinics testing these systems report faster notes and better continuity between sessions, especially when a patient returns weeks later.',
      'Therapy involves deeply personal information, so privacy, consent, and the limit of AI’s role are the real fault lines. Professional bodies are still writing guidance on recording, storage, and whether a model should ever interpret emotion or risk.',
      'The debate is shifting from whether AI should be used in therapy to where its role should end—and who is accountable when a suggestion is wrong.',
    ],
  },
  needToKnow: [
    {
      title: 'AI copilots are already entering clinical workflows.',
      body: 'Tools can assist with transcription, documentation, session summaries and preparation for future sessions.',
    },
    {
      title: 'The distinction between assistance and treatment matters.',
      body: 'Most sources agree AI can support notes and recall. Far fewer agree it should interpret symptoms, suggest diagnoses, or speak during the session.',
    },
    {
      title: 'Privacy is one of the biggest concerns.',
      body: 'Sessions contain highly sensitive information. Sources diverge on recording consent, data retention, and whether third-party models should ever process the conversation.',
    },
    {
      title: 'Human judgment remains central.',
      body: 'Clinical decisions, empathy, and responsibility stay with the therapist. The synthesis is consistent on this point even when the tools themselves become more capable.',
    },
  ],
  perspectives: [
    {
      title: 'More attention for the patient',
      body: 'Supporters believe AI can handle documentation and recall, allowing therapists to focus more completely on the conversation.',
    },
    {
      title: 'Keep the therapy room human',
      body: 'Others worry that having AI listen and process conversations could affect privacy and the trust between patient and therapist.',
    },
  ],
  stand: [
    {
      kind: 'agreement' as const,
      label: 'Agreement',
      icon: '/assets/stance-agreement.svg',
      text: 'AI should support therapists, not replace their clinical judgment.',
    },
    {
      kind: 'debate' as const,
      label: 'Debate',
      icon: '/assets/stance-debate.svg',
      text: 'How much AI should interpret and surface patterns from patient sessions.',
    },
    {
      kind: 'unclear' as const,
      label: 'Unclear',
      icon: '/assets/stance-unclear.svg',
      text: 'How AI involvement could affect the therapist patient relationship over time.',
    },
  ],
  originals: [
    { name: 'TechCrunch', icon: '/assets/source-tc.svg' },
    { name: 'CNN', icon: '/assets/source-cnn.svg' },
    { name: 'Bloomberg', icon: '/assets/source-b.svg' },
    { name: 'Associated Press', icon: '/assets/source-a.svg' },
    { name: 'NBC News', icon: '/assets/source-nbc.svg' },
  ],
}

function StoryDetails({
  storyIndex,
  onClose,
  onAsk,
}: {
  storyIndex: number
  onClose: () => void
  onAsk: (question: string) => void
}) {
  const reduced = useReducedMotion() === true
  const story = stories[storyIndex]
  const [depth, setDepth] = useState<'tldr' | 'deep'>('tldr')
  const [openNeed, setOpenNeed] = useState(0)
  const [playing, setPlaying] = useState(false)
  const brief = STORY_DETAIL.brief[depth]
  const restDelay = reduced ? 0 : .12

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <motion.div
      className="story-details"
      role="dialog"
      aria-modal="true"
      aria-labelledby="story-detail-title"
      initial={false}
    >
      <motion.article
        className="story-details-sheet"
        layoutId={reduced ? undefined : 'story-shell'}
        transition={reduced ? { duration: 0 } : STORY_MORPH}
        style={{ borderRadius: 0, backgroundColor: '#fff' }}
      >
        <div className="story-details-hero">
          <div className="story-details-top">
            <SourceRow
              age={story.age}
              layoutId={reduced ? undefined : 'story-meta'}
            />

            <div className="story-details-intro">
              <div className="story-details-heading">
                <motion.h2
                  id="story-detail-title"
                  layoutId={reduced ? undefined : 'story-title'}
                  layout="position"
                >
                  {story.title}
                </motion.h2>
                <motion.img
                  className="story-details-photo"
                  src={STORY_DETAIL.image}
                  alt=""
                  initial={reduced ? false : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 200 }}
                  transition={reduced ? { duration: 0 } : { delay: restDelay, ...DISCLOSE }}
                />
              </div>
              <motion.p
                layoutId={reduced ? undefined : 'story-lede'}
                layout="position"
              >
                {story.summary}
              </motion.p>
            </div>
          </div>

          <motion.button
            className="story-audio"
            type="button"
            aria-pressed={playing}
            aria-label={playing ? 'Pause briefing' : 'Play briefing'}
            onClick={() => setPlaying((current) => !current)}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={reduced ? { duration: 0 } : { delay: restDelay + .08, duration: .28 }}
          >
            <span className="story-audio-play">
              <img src="/assets/story-play.svg" alt="" />
            </span>
            <span className="story-audio-wave">
              <img src="/assets/story-waveform.svg" alt="" />
            </span>
            <span>{STORY_DETAIL.duration}</span>
          </motion.button>
        </div>

        <motion.div
          className="story-details-rest"
          initial={reduced ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduced ? { duration: 0 } : { delay: restDelay + .12, duration: .36, ease: [.22, 1, .36, 1] }}
        >

        <section className="story-section" aria-labelledby="story-brief-heading">
          <img className="story-section-rule" src="/assets/story-divider.svg" alt="" />
          <div className="story-section-body">
            <div className="story-section-head">
              <h3 id="story-brief-heading">The brief</h3>
              <div className="brief-toggle" role="group" aria-label="Brief length">
                <button
                  type="button"
                  className={depth === 'tldr' ? 'is-active' : ''}
                  aria-pressed={depth === 'tldr'}
                  onClick={() => setDepth('tldr')}
                >
                  TLDR;
                </button>
                <button
                  type="button"
                  className={depth === 'deep' ? 'is-active' : ''}
                  aria-pressed={depth === 'deep'}
                  onClick={() => setDepth('deep')}
                >
                  Deep
                </button>
              </div>
            </div>
            <div className="story-brief-copy">
              {brief.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </div>
        </section>

        <section className="story-section" aria-labelledby="story-need-heading">
          <img className="story-section-rule" src="/assets/story-divider.svg" alt="" />
          <div className="story-section-body">
            <h3 id="story-need-heading">What you need to know?</h3>
            <div className="need-list">
              {STORY_DETAIL.needToKnow.map((item, index) => {
                const expanded = openNeed === index
                return (
                  <div className={`need-item${expanded ? ' is-open' : ''}`} key={item.title}>
                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() => setOpenNeed(expanded ? -1 : index)}
                    >
                      <span>{item.title}</span>
                      <span className={`need-icon${expanded ? ' is-open' : ''}`}>
                        <img src="/assets/story-plus.svg" alt="" />
                      </span>
                    </button>
                    {expanded && <p>{item.body}</p>}
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="story-section story-section--perspectives" aria-labelledby="story-perspectives-heading">
          <img className="story-section-rule" src="/assets/story-divider.svg" alt="" />
          <div className="story-section-body">
            <h3 id="story-perspectives-heading">Where perspectives differ</h3>
            <div className="perspective-scroller">
              {STORY_DETAIL.perspectives.map((item) => (
                <article className="perspective-card" key={item.title}>
                  <h4>{item.title}</h4>
                  <p>{item.body}</p>
                </article>
              ))}
            </div>
          </div>
          <div className="perspective-dots" aria-hidden="true">
            <span className="is-active" />
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </section>

        <section className="story-section" aria-labelledby="story-stand-heading">
          <img className="story-section-rule" src="/assets/story-divider.svg" alt="" />
          <div className="story-section-body">
            <h3 id="story-stand-heading">Where things stand</h3>
            <div className="stand-list">
              {STORY_DETAIL.stand.map((item) => (
                <div className={`stand-item stand-item--${item.kind}`} key={item.label}>
                  <span className="stand-pill">
                    <img src={item.icon} alt="" />
                    {item.label}
                  </span>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="story-section" aria-labelledby="story-sources-heading">
          <img className="story-section-rule" src="/assets/story-divider.svg" alt="" />
          <div className="story-section-body">
            <h3 id="story-sources-heading">Original sources</h3>
            <p className="story-sources-lede">
              This story is a synthesis of twelve sources. Inspect where the reporting came from—there is no truth score.
            </p>
            <ul className="original-sources">
              {STORY_DETAIL.originals.map((source) => (
                <li key={source.name}>
                  <img src={source.icon} alt="" />
                  <span>{source.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <button
          className="story-ask"
          type="button"
          onClick={() => onAsk(`What should I understand about “${story.title}”?`)}
        >
          <span className="story-ask-icon" aria-hidden="true">
            <img src="/assets/story-plus.svg" alt="" />
          </span>
          Ask about this story
        </button>
        </motion.div>
      </motion.article>

      <motion.button
        className="story-details-close"
        type="button"
        onClick={onClose}
        aria-label="Close story"
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={reduced ? { duration: 0 } : { delay: .22, duration: .2 }}
      >
        <img src="/assets/ask-close.svg" alt="" />
      </motion.button>

      <motion.div
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={reduced ? { duration: 0 } : { delay: .18, duration: .2 }}
      >
        <StatusBar />
      </motion.div>
    </motion.div>
  )
}

function StoryCardContent({
  storyIndex,
  shared,
}: {
  storyIndex: number
  shared?: boolean
}) {
  const story = stories[storyIndex]

  return (
    <>
      <span className="story-topic">{story.topic}</span>
      <span className="story-body">
        <SourceRow
          age={story.age}
          layoutId={shared ? 'story-meta' : undefined}
        />
        <span className="story-copy">
          <motion.span
            className="story-title"
            layoutId={shared ? 'story-title' : undefined}
            layout="position"
          >
            {story.title}
          </motion.span>
          <motion.span
            className="story-summary"
            layoutId={shared ? 'story-lede' : undefined}
            layout="position"
          >
            {story.summary}
          </motion.span>
        </span>
      </span>
    </>
  )
}

type DeckStoryCardProps = {
  storyIndex: number
  depth: number
  active: boolean
  intent: SwipeIntent
  steps: number
  flowDirection: -1 | 1
  reduced: boolean
  opened: boolean
  onMove: (dx: number) => void
  onRelease: (dx: number, velocity: number) => boolean
  onOpen: () => void
}

function DeckStoryCard({
  storyIndex,
  depth,
  active,
  intent,
  steps,
  flowDirection,
  reduced,
  opened,
  onMove,
  onRelease,
  onOpen,
}: DeckStoryCardProps) {
  const story = stories[storyIndex]
  const x = useMotionValue(0)
  const didDrag = useRef(false)
  const pointerStart = useRef<number | null>(null)
  const releaseHandled = useRef(false)
  const rotate = useTransform(x, [-220, 0, 220], [-8, 0, 8], { clamp: false })
  const fade = useTransform(x, [-560, -180, 0, 180, 560], [0, 1, 1, 1, 0])
  const commit = active ? 0 : intent.step / steps

  const y = depth === 0
    ? 0
    : depth === 1
      ? 38 * (1 - commit)
      : 86 - (55 * commit)
  const scale = depth === 0
    ? 1
    : depth === 1
      ? .899 + (.101 * commit)
      : .742 + (.157 * commit)
  const restingOpacity = depth === 0
    ? 1
    : depth === 1
      ? .72 + (.28 * commit)
      : .42 + (.3 * commit)
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!active || event.target !== event.currentTarget) return
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault()
      const direction = event.key === 'ArrowRight' ? 1 : -1
      onRelease(direction * 100, 0)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onOpen()
    }
  }

  const finishRelease = (dx: number, velocity: number) => {
    if (releaseHandled.current) return
    releaseHandled.current = true
    const committed = onRelease(dx, velocity)
    if (!committed) {
      animate(x, 0, reduced ? { duration: 0 } : DISCLOSE)
    }
  }

  return (
    <motion.div
      role={active ? 'button' : 'group'}
      aria-label={active ? `Open story: ${story.title}` : story.title}
      aria-hidden={!active}
      inert={!active}
      tabIndex={active ? 0 : -1}
      custom={flowDirection}
      variants={{
        exit: (direction: number) => ({
          x: direction * 560,
          zIndex: 12,
          transition: reduced
            ? { duration: 0 }
            : { x: { duration: .3, ease: LEAVE } },
        }),
      }}
      initial={depth === 2 ? { y: 116, scale: .65, opacity: 0 } : { y, scale }}
      animate={{
        y,
        scale,
        opacity: active && opened ? 0 : restingOpacity,
      }}
      exit="exit"
      transition={
        active && opened
          ? { opacity: { duration: 0 } }
          : reduced
            ? { duration: 0 }
            : { ...CROSSFADE, layout: STORY_MORPH }
      }
      layoutId={active && !opened && !reduced ? 'story-shell' : undefined}
      drag={active && !opened ? 'x' : false}
      dragDirectionLock
      dragMomentum={false}
      dragElastic={1}
      dragConstraints={{ left: 0, right: 0 }}
      dragTransition={{ bounceStiffness: 260, bounceDamping: 34 }}
      whileDrag={reduced ? undefined : { scale: 1.03 }}
      onPointerDown={(event) => {
        if (!active) return
        pointerStart.current = event.clientX
        releaseHandled.current = false
        didDrag.current = false
      }}
      onPointerMove={(event) => {
        if (!active || pointerStart.current === null) return
        const dx = event.clientX - pointerStart.current
        if (Math.abs(dx) > 3) didDrag.current = true
        onMove(dx)
      }}
      onPointerUp={(event) => {
        if (!active || pointerStart.current === null) return
        const dx = event.clientX - pointerStart.current
        pointerStart.current = null
        queueMicrotask(() => finishRelease(dx, 0))
      }}
      onPointerCancel={() => {
        pointerStart.current = null
        releaseHandled.current = true
        onMove(0)
        animate(x, 0, reduced ? { duration: 0 } : DISCLOSE)
      }}
      onDragStart={() => {
        didDrag.current = false
      }}
      onDrag={(_event, info) => {
        if (Math.abs(info.offset.x) > 3) didDrag.current = true
        onMove(info.offset.x)
      }}
      onDragEnd={(_event, info) => {
        finishRelease(info.offset.x, info.velocity.x)
      }}
      onClick={active ? () => {
        if (!didDrag.current) onOpen()
        didDrag.current = false
      } : undefined}
      onKeyDown={handleKeyDown}
      style={{
        x,
        rotate,
        ...(active && !opened ? { opacity: fade } : {}),
        zIndex: 10 - depth,
        borderRadius: 32,
        backgroundColor: '#ebe9e7',
        transformOrigin: '50% 0%',
        touchAction: 'pan-y',
        pointerEvents: active && opened ? 'none' : undefined,
      }}
      className={`story-card story-card-motion ${
        active
          ? 'story-card-front'
          : depth === 1
            ? 'stack-layer stack-layer-middle'
            : 'stack-layer stack-layer-back'
      }`}
    >
      <StoryCardContent
        storyIndex={storyIndex}
        shared={active && !opened && !reduced}
      />
    </motion.div>
  )
}

function StoryCardStack({
  storyIndex,
  intent,
  steps,
  flowDirection,
  opened,
  onMove,
  onRelease,
  onOpen,
}: {
  storyIndex: number
  intent: SwipeIntent
  steps: number
  flowDirection: -1 | 1
  opened: boolean
  onMove: (dx: number) => void
  onRelease: (dx: number, velocity: number) => boolean
  onOpen: () => void
}) {
  const reduced = useReducedMotion() === true
  const stack = [0, 1, 2].map((depth) => (
    storyIndex + depth
  ) % stories.length)

  return (
    <div className="story-stack">
      <AnimatePresence initial={false} custom={flowDirection}>
        {stack.map((cardIndex, depth) => (
          <DeckStoryCard
            key={cardIndex}
            storyIndex={cardIndex}
            depth={depth}
            active={depth === 0}
            intent={intent}
            steps={steps}
            flowDirection={flowDirection}
            reduced={reduced}
            opened={opened}
            onMove={onMove}
            onRelease={onRelease}
            onOpen={onOpen}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

const SUMMARY_BRIEFING =
  'Here is what your agents found today. The main signal is whether the AI industry is ready to slow down. Anthropic wants to pace the frontier, and industry leaders are still divided. Hardware is moving beyond the screen, humanoid robots are entering factories, and the next phone upgrade may be mostly invisible. Smaller teams are building faster, clinical copilots are facing real use, and one research result could make private models easier to deploy. You are caught up.'

const WAVE_REST = Array.from({ length: 58 }, (_, index) => {
  if (index < 33) return 0.25
  const shape = [0.25, 0.5, 0.62, 0.38, 0.88, 0.75, 0.38, 0.25, 0.38, 0.62, 0.38, 0.62, 0.38, 0.25, 0.25, 0.5, 0.62, 0.38, 0.62, 0.88, 0.38, 0.25, 0.25, 0.38, 0.75, 1, 0.38]
  return shape[(index - 33) % shape.length]
})

function preferredVoice() {
  const voices = window.speechSynthesis.getVoices()
  return (
    voices.find((voice) => /samantha|google us english|karen|daniel/i.test(voice.name))
    ?? voices.find((voice) => /^en/i.test(voice.lang))
  )
}

function SummaryScreen({
  agent,
  onClose,
}: {
  agent: Agent
  onClose: () => void
}) {
  const [phase, setPhase] = useState<'speaking' | 'paused' | 'ended'>('speaking')
  const barsRef = useRef<Array<HTMLSpanElement | null>>([])
  const voiceGeneration = useRef(0)
  const onCloseRef = useRef(onClose)
  const reduceMotion = useReducedMotion()
  const live = phase === 'speaking'
  onCloseRef.current = onClose

  const speak = () => {
    const generation = voiceGeneration.current + 1
    voiceGeneration.current = generation

    if (!('speechSynthesis' in window)) {
      setPhase('speaking')
      setTimeout(() => {
        if (voiceGeneration.current === generation) setPhase('ended')
      }, 14000)
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(SUMMARY_BRIEFING)
    utterance.rate = 0.98
    utterance.pitch = 1
    const voice = preferredVoice()
    if (voice) utterance.voice = voice
    utterance.onstart = () => {
      if (voiceGeneration.current === generation) setPhase('speaking')
    }
    utterance.onend = () => {
      if (voiceGeneration.current !== generation) return
      setPhase((current) => (current === 'paused' ? current : 'ended'))
    }
    utterance.onerror = () => {
      if (voiceGeneration.current === generation) setPhase('ended')
    }
    window.speechSynthesis.speak(utterance)
    setPhase('speaking')
  }

  useEffect(() => {
    const start = () => speak()
    if (!('speechSynthesis' in window)) {
      start()
    } else if (window.speechSynthesis.getVoices().length) {
      start()
    } else {
      window.speechSynthesis.addEventListener('voiceschanged', start, { once: true })
    }

    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      voiceGeneration.current += 1
      window.speechSynthesis?.cancel()
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  useEffect(() => {
    const paint = (scale: (index: number, time: number) => number, time = 0) => {
      barsRef.current.forEach((bar, index) => {
        if (bar) bar.style.transform = `scaleY(${scale(index, time)})`
      })
    }

    if (!live || reduceMotion) {
      paint((index) => WAVE_REST[index])
      return
    }

    let frame = 0
    const tick = (time: number) => {
      paint((index) => {
        const pulse = Math.abs(Math.sin(time / 170 + index * 0.48))
        const energy = 0.22 + pulse * (0.28 + (index / WAVE_REST.length) * 0.7)
        return Math.max(WAVE_REST[index], energy)
      }, time)
      frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [live, reduceMotion])

  const toggleVoice = () => {
    if (!('speechSynthesis' in window)) {
      setPhase((current) => (current === 'speaking' ? 'paused' : 'speaking'))
      return
    }

    if (phase === 'speaking') {
      window.speechSynthesis.pause()
      setPhase('paused')
      return
    }

    if (phase === 'paused' && window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
      setPhase('speaking')
      return
    }

    speak()
  }

  return (
    <motion.section
      className="summary-screen"
      role="dialog"
      aria-modal="true"
      aria-labelledby="summary-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.28 }}
    >
      <StatusBar />
      <h1 id="summary-title">Summary</h1>
      <p className="summary-transcript">{SUMMARY_BRIEFING}</p>
      <button className="summary-close" type="button" onClick={onClose} aria-label="Close summary">
        <img src="/assets/ask-close.svg" alt="" />
      </button>
      <img
        className={`summary-orb${live ? ' is-speaking' : ''}`}
        src={agent.background}
        alt=""
      />
      <div className="summary-bar">
        <button className="summary-round" type="button" onClick={speak} aria-label="Replay summary">
          <img src="/assets/summary-plus.svg" alt="" />
        </button>
        <div className={`summary-waveform${live ? ' is-live' : ''}`} aria-hidden="true">
          <img src="/assets/summary-waveform.svg" alt="" />
          <span className="summary-waveform-live">
            {WAVE_REST.map((_, index) => (
              <span
                key={index}
                ref={(node) => {
                  barsRef.current[index] = node
                }}
              />
            ))}
          </span>
        </div>
        <button
          className="summary-round"
          type="button"
          aria-pressed={live}
          aria-label={phase === 'speaking' ? 'Pause voice' : 'Play voice'}
          onClick={toggleVoice}
        >
          <img src="/assets/summary-mic.svg" alt="" />
        </button>
      </div>
    </motion.section>
  )
}

function DiscoverPage({
  menuButtonRef,
  onMenu,
  onAsk,
  onSelectAgent,
}: {
  menuButtonRef: RefObject<HTMLButtonElement | null>
  onMenu: () => void
  onAsk: (agentId: string, question: string) => void
  onSelectAgent: (agentId: string) => void
}) {
  const [showAllForYou, setShowAllForYou] = useState(false)
  const [followed, setFollowed] = useState<string[]>([])
  const cards = showAllForYou ? discoverForYou : discoverForYou.slice(0, 2)

  return (
    <div className="discover">
      <div className="discover-chrome">
        <StatusBar />
        <button
          className="menu-button"
          type="button"
          ref={menuButtonRef}
          onClick={onMenu}
          aria-label="Open menu"
        >
          <img src="/assets/menu.svg" alt="" />
        </button>
      </div>

      <header className="discover-header">
        <h1>Discover</h1>
        <p>Expand your world.</p>
      </header>

      <section className="discover-section" aria-labelledby="discover-for-you">
        <div className="discover-section-head">
          <h2 id="discover-for-you">For you</h2>
          <button
            className="discover-see-all"
            type="button"
            aria-expanded={showAllForYou}
            onClick={() => setShowAllForYou((current) => !current)}
          >
            {showAllForYou ? 'Show less' : 'See all'}
          </button>
        </div>
        <div className="discover-cards">
          {cards.map((card) => {
            const agent = agents.find((item) => item.id === card.agentId) ?? agents[3]
            const watching = followed.includes(card.id)

            return (
              <article className="discover-card" key={card.id}>
                <button
                  className="discover-card-main"
                  type="button"
                  onClick={() => onAsk(agent.id, `What should I understand about “${card.title}”?`)}
                >
                  <span className="discover-card-agent">
                    <img src={agent.image} alt="" />
                    {agent.label}
                  </span>
                  <span className="discover-card-copy">
                    <span className="discover-card-title">{card.title}</span>
                    <span className="discover-card-summary">{card.summary}</span>
                  </span>
                </button>
                <button
                  className="discover-add"
                  type="button"
                  aria-pressed={watching}
                  aria-label={watching ? `Stop monitoring ${card.title}` : `Keep monitoring ${card.title}`}
                  onClick={() => {
                    setFollowed((current) => (
                      current.includes(card.id)
                        ? current.filter((id) => id !== card.id)
                        : [...current, card.id]
                    ))
                  }}
                >
                  <img src="/assets/story-plus.svg" alt="" />
                </button>
              </article>
            )
          })}
        </div>
      </section>

      <section className="discover-section" aria-labelledby="discover-people">
        <div className="discover-section-head">
          <h2 id="discover-people">Personalities</h2>
          <button className="discover-see-all" type="button">
            See all
          </button>
        </div>
        <p className="discover-section-lede">People your agents think you might like.</p>
        <div className="discover-people" role="list">
          {discoverPeople.map((src) => (
            <img src={src} alt="" role="listitem" key={src} />
          ))}
        </div>
      </section>

      <section className="discover-section discover-section--agents" aria-labelledby="discover-agents">
        <div className="discover-section-head">
          <h2 id="discover-agents">Most used agents</h2>
        </div>
        <p className="discover-section-lede">Discover new topics by selecting new agents</p>
        <div className="discover-agents">
          {agents.map((agent) => (
            <button
              type="button"
              key={agent.id}
              aria-label={`Open ${agent.label}`}
              onClick={() => onSelectAgent(agent.id)}
            >
              <img src={agent.image} alt="" />
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState<AppPage>('home')
  const [storyIndex, setStoryIndex] = useState(0)
  const [activeAgent, setActiveAgent] = useState('tech')
  const [swipeIntent, setSwipeIntent] = useState<SwipeIntent>(BLANK_SWIPE)
  const [flowDirection, setFlowDirection] = useState<-1 | 1>(1)
  const [menuOpen, setMenuOpen] = useState(false)
  const [askOpen, setAskOpen] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [askSeed, setAskSeed] = useState<string | undefined>()
  const [storyOpen, setStoryOpen] = useState(false)
  const [orbLanded, setOrbLanded] = useState(false)
  const menuCloseRef = useRef<HTMLButtonElement>(null)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const menuWasOpened = useRef(false)
  const reduceMotion = useReducedMotion()

  const selectedAgent = agents.find((agent) => agent.id === activeAgent) ?? agents[3]
  const swipeSteps = 6
  const swipeReach = 92

  useEffect(() => {
    if (!menuOpen) {
      if (!menuWasOpened.current) return
      menuWasOpened.current = false
      const frame = window.requestAnimationFrame(() => menuButtonRef.current?.focus())
      return () => window.cancelAnimationFrame(frame)
    }

    menuWasOpened.current = true
    const frame = window.requestAnimationFrame(() => menuCloseRef.current?.focus())
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [menuOpen])

  useEffect(() => {
    if (!askOpen) setOrbLanded(false)
    if (askOpen && reduceMotion) setOrbLanded(true)
  }, [askOpen, reduceMotion])

  const reportSwipe = (dx: number) => {
    const step = Math.min(
      swipeSteps,
      Math.round((Math.abs(dx) / swipeReach) * swipeSteps),
    )
    const direction: -1 | 0 | 1 = step === 0 ? 0 : dx > 0 ? 1 : -1
    setSwipeIntent((current) => (
      current.dir === direction && current.step === step
        ? current
        : { dir: direction, step }
    ))
  }

  const releaseSwipe = (dx: number, velocity: number) => {
    const intentional = Math.abs(dx) > 8
    const flicked = Math.abs(velocity) >= 520 && Math.abs(dx) >= 3

    if (!intentional && !flicked) {
      setSwipeIntent(BLANK_SWIPE)
      return false
    }

    const vector = Math.abs(dx) > 3 ? dx : velocity
    setFlowDirection(vector > 0 ? 1 : -1)
    setSwipeIntent(BLANK_SWIPE)
    setStoryIndex((current) => (current + 1) % stories.length)
    return true
  }

  return (
    <main className="stage">
      <LayoutGroup>
      <section
        className={`device${menuOpen ? ' menu-open' : ''}`}
        aria-label="AI news app"
      >
        <MenuLayer
          open={menuOpen}
          page={page}
          onNavigate={(next) => {
            setPage(next)
            setAskOpen(false)
            setAskSeed(undefined)
            setStoryOpen(false)
          }}
          onClose={() => setMenuOpen(false)}
          closeRef={menuCloseRef}
        />

        <motion.div
          className={`app-front${menuOpen ? ' is-menu-open' : ''}`}
          animate={{ y: menuOpen ? 506 : 0 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 180, damping: 28, mass: 1 }
          }
          inert={menuOpen || storyOpen}
          onPanEnd={(_, info) => {
            if (menuOpen && info.offset.y < -42) setMenuOpen(false)
          }}
        >
          {page === 'home' && (
            <>
          <motion.div
            className={`world-glow${askOpen ? ' is-morphing' : ''}`}
            initial={false}
            animate={{
              ...(askOpen ? ORB_ASK : ORB_HOME),
              opacity: askOpen && orbLanded ? 0 : 1,
            }}
            transition={reduceMotion ? { duration: 0 } : ASK_ORB}
            onAnimationComplete={(definition) => {
              if (!askOpen || typeof definition !== 'object' || !definition) return
              if ('width' in definition && definition.width === ORB_ASK.width) setOrbLanded(true)
            }}
          >
            <AnimatePresence initial={false}>
              <motion.img
                src={selectedAgent.background}
                alt=""
                key={selectedAgent.id}
                initial={{ opacity: 0, scale: .98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={CROSSFADE}
              />
            </AnimatePresence>
          </motion.div>

          <motion.div
            className="home-surface"
            animate={{ y: askOpen ? -820 : 0 }}
            transition={reduceMotion ? { duration: 0 } : ASK_REVEAL}
            inert={askOpen}
          >
            <StatusBar />

            <header className="home-header">
              <p>Hi Joshua,</p>
              <h1>Your world is here.</h1>
              <span>We found 14 new things for you today.</span>
            </header>

            <button
              className="menu-button"
              type="button"
              ref={menuButtonRef}
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <img src="/assets/menu.svg" alt="" />
            </button>

            <StoryCardStack
              storyIndex={storyIndex}
              intent={swipeIntent}
              steps={swipeSteps}
              flowDirection={flowDirection}
              opened={storyOpen}
              onMove={reportSwipe}
              onRelease={releaseSwipe}
              onOpen={() => setStoryOpen(true)}
            />

            <div className="story-progress" aria-label={`Story ${storyIndex + 1} of ${stories.length}`}>
              {stories.map((_, index) => (
                <span className={index === storyIndex ? 'active' : ''} key={index} />
              ))}
            </div>

            <button
              className="summarize-button"
              type="button"
              onClick={() => setSummaryOpen(true)}
            >
              <span className="summarize-icon">
                <img src="/assets/summarize.svg" alt="" />
              </span>
              Summarize all
            </button>

            <p className="agent-label">{selectedAgent.label}</p>
            <AgentCarousel
              activeId={activeAgent}
              onSelect={(agent) => setActiveAgent(agent.id)}
            />
          </motion.div>

          <motion.button
            className={`ask-button ask-button--${selectedAgent.contrast}`}
            type="button"
            onClick={() => {
              setAskSeed(undefined)
              setAskOpen(true)
            }}
            onTap={() => {
              setAskSeed(undefined)
              setAskOpen(true)
            }}
            animate={{
              opacity: askOpen ? 0 : 1,
              y: askOpen ? -18 : 0,
            }}
            transition={reduceMotion ? { duration: 0 } : { duration: .28, ease: LEAVE }}
            style={{ x: '-50%', pointerEvents: askOpen ? 'none' : 'auto' }}
          >
            <span className="ask-icon" aria-hidden="true" />
            <TextShimmer
              baseColor={
                selectedAgent.contrast === 'light'
                  ? 'rgba(255, 255, 255, .6)'
                  : 'rgba(22, 17, 28, .6)'
              }
              gradientColor={selectedAgent.contrast === 'light' ? '#fff' : '#16111c'}
              duration={3}
            >
              Ask anything
            </TextShimmer>
          </motion.button>
            </>
          )}

          {page === 'discover' && (
            <DiscoverPage
              menuButtonRef={menuButtonRef}
              onMenu={() => setMenuOpen(true)}
              onAsk={(agentId, question) => {
                setActiveAgent(agentId)
                setAskSeed(question)
                setAskOpen(true)
                setOrbLanded(true)
              }}
              onSelectAgent={(agentId) => {
                setActiveAgent(agentId)
                setPage('home')
              }}
            />
          )}

          <AnimatePresence>
            {summaryOpen && (
              <SummaryScreen
                agent={selectedAgent}
                onClose={() => setSummaryOpen(false)}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {askOpen && (
              <AskScreen
                agent={selectedAgent}
                showOrb={orbLanded}
                seedQuestion={askSeed}
                onAgentChange={(agent) => setActiveAgent(agent.id)}
                onClose={() => {
                  setAskOpen(false)
                  setAskSeed(undefined)
                }}
              />
            )}
          </AnimatePresence>
        </motion.div>

        <motion.button
          className="menu-dragger"
          type="button"
          aria-label="Close menu"
          aria-hidden={!menuOpen}
          tabIndex={menuOpen ? 0 : -1}
          animate={{
            y: menuOpen ? 506 : 0,
            opacity: menuOpen ? 1 : 0,
          }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { type: 'spring', stiffness: 180, damping: 28, mass: 1 }
          }
          drag={menuOpen ? 'y' : false}
          dragConstraints={{ top: -96, bottom: 0 }}
          dragElastic={0}
          onDragEnd={(_, info) => {
            if (info.offset.y < -24) setMenuOpen(false)
          }}
          onClick={() => setMenuOpen(false)}
        />

        <AnimatePresence>
          {storyOpen && (
            <StoryDetails
              storyIndex={storyIndex}
              onClose={() => setStoryOpen(false)}
              onAsk={(question) => {
                setStoryOpen(false)
                setAskSeed(question)
                setAskOpen(true)
              }}
            />
          )}
        </AnimatePresence>
      </section>
      </LayoutGroup>
    </main>
  )
}

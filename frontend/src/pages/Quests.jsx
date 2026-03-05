import { useEffect, useState } from 'react'
import { useAuthStore, useQuestStore, useUIStore } from '../lib/store'
import { Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// ─── SVG Quest Icons (inline, crisp, no emoji jank) ────────────────────────

const IconBook = () => (
    <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
        <rect x="4" y="3" width="24" height="26" rx="3" fill="#58CC02" />
        <rect x="7" y="6" width="18" height="20" rx="2" fill="#fff" />
        <rect x="10" y="10" width="12" height="2" rx="1" fill="#58CC02" />
        <rect x="10" y="14" width="8" height="2" rx="1" fill="#89E219" />
    </svg>
)

const IconQuiz = () => (
    <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
        <circle cx="16" cy="16" r="13" fill="#CE82FF" />
        <circle cx="16" cy="16" r="10" fill="#fff" />
        <text x="16" y="21" textAnchor="middle" fill="#CE82FF" fontSize="14" fontWeight="800">✓</text>
    </svg>
)

const IconTimer = () => (
    <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
        <circle cx="16" cy="17" r="12" fill="#1CB0F6" />
        <circle cx="16" cy="17" r="9" fill="#fff" />
        <rect x="14" y="1" width="4" height="5" rx="1" fill="#1CB0F6" />
        <line x1="16" y1="17" x2="16" y2="11" stroke="#1CB0F6" strokeWidth="2" strokeLinecap="round" />
        <line x1="16" y1="17" x2="21" y2="17" stroke="#1CB0F6" strokeWidth="2" strokeLinecap="round" />
    </svg>
)

const IconPerfect = () => (
    <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
        <polygon points="16,2 20,12 31,12 22,19 25,29 16,23 7,29 10,19 1,12 12,12" fill="#FF9600" />
        <polygon points="16,7 18.5,13 25,13 20,17.5 22,23 16,19.5 10,23 12,17.5 7,13 13.5,13" fill="#FFC800" />
    </svg>
)

const IconBooks = () => (
    <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
        <rect x="3" y="5" width="8" height="22" rx="2" fill="#58CC02" transform="rotate(-5 7 16)" />
        <rect x="11" y="4" width="8" height="22" rx="2" fill="#1CB0F6" />
        <rect x="20" y="5" width="8" height="22" rx="2" fill="#FF9600" transform="rotate(5 24 16)" />
    </svg>
)

const IconSlides = () => (
    <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
        <rect x="3" y="6" width="26" height="20" rx="3" fill="#FF4B4B" />
        <rect x="6" y="9" width="20" height="14" rx="2" fill="#fff" />
        <polygon points="14,12 14,20 21,16" fill="#FF4B4B" />
    </svg>
)

const IconTarget = () => (
    <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
        <circle cx="16" cy="16" r="13" fill="#FF4B4B" />
        <circle cx="16" cy="16" r="9" fill="#fff" />
        <circle cx="16" cy="16" r="6" fill="#FF4B4B" />
        <circle cx="16" cy="16" r="3" fill="#fff" />
        <circle cx="16" cy="16" r="1.5" fill="#FF4B4B" />
    </svg>
)

const IconFlame = () => (
    <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
        <path d="M16 2C16 2 8 10 8 18C8 22.4 11.6 26 16 26C20.4 26 24 22.4 24 18C24 10 16 2 16 2Z" fill="#FF9600" />
        <path d="M16 10C16 10 12 15 12 19C12 21.2 13.8 23 16 23C18.2 23 20 21.2 20 19C20 15 16 10 16 10Z" fill="#FFC800" />
    </svg>
)

const IconChapter = () => (
    <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
        <rect x="5" y="3" width="22" height="26" rx="3" fill="#1CB0F6" />
        <rect x="5" y="3" width="6" height="26" rx="3" fill="#0096D6" />
        <rect x="13" y="8" width="10" height="2" rx="1" fill="#fff" />
        <rect x="13" y="12" width="10" height="2" rx="1" fill="#fff" opacity="0.6" />
        <rect x="13" y="16" width="7" height="2" rx="1" fill="#fff" opacity="0.6" />
    </svg>
)

const IconTrophy = () => (
    <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
        <path d="M8 6H24V14C24 18.4 20.4 22 16 22C11.6 22 8 18.4 8 14V6Z" fill="#FFC800" />
        <rect x="12" y="22" width="8" height="3" fill="#FFC800" />
        <rect x="10" y="25" width="12" height="3" rx="1" fill="#FF9600" />
        <path d="M8 6V12C5 12 3 10 3 8V6H8Z" fill="#FF9600" />
        <path d="M24 6V12C27 12 29 10 29 8V6H24Z" fill="#FF9600" />
    </svg>
)

const IconLightning = () => (
    <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
        <polygon points="18,2 8,18 15,18 14,30 24,14 17,14" fill="#FFC800" />
        <polygon points="17,5 10,17 14.5,17 13.8,26 21,15 17,15" fill="#FFE34D" />
    </svg>
)

const IconCart = () => (
    <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
        <path d="M4 4H8L12 22H24L28 8H10" stroke="#58CC02" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="13" cy="27" r="2.5" fill="#58CC02" />
        <circle cx="23" cy="27" r="2.5" fill="#58CC02" />
    </svg>
)

const IconCourse = () => (
    <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
        <path d="M16 4L3 10L16 16L29 10L16 4Z" fill="#CE82FF" />
        <path d="M3 10V20L16 26L29 20V10" stroke="#CE82FF" strokeWidth="2" fill="none" />
        <line x1="29" y1="10" x2="29" y2="24" stroke="#CE82FF" strokeWidth="2" />
    </svg>
)

const IconCoin = () => (
    <svg viewBox="0 0 20 20" fill="none" className="w-full h-full">
        <circle cx="10" cy="10" r="9" fill="#FFC800" stroke="#FF9600" strokeWidth="1.5" />
        <circle cx="10" cy="10" r="6" fill="#FFE34D" />
        <text x="10" y="14" textAnchor="middle" fill="#FF9600" fontSize="10" fontWeight="900">$</text>
    </svg>
)

// Map quest requirement types to icons
const QUEST_ICONS = {
    lessons: IconBook,
    quizzes: IconQuiz,
    study_time: IconTimer,
    perfect_quiz: IconPerfect,
    slides: IconSlides,
    streak: IconFlame,
    chapter: IconChapter,
    course: IconCourse,
    shop_buy: IconCart,
}

// ─── Section configs ────────────────────────────────────────────────────────

const SECTIONS = [
    {
        key: 'daily',
        title: 'Daily Quests',
        subtitle: 'Complete for bonus coins!',
        gradient: 'from-[#58CC02] to-[#46A302]',
        progressGradient: 'from-[#58CC02] to-[#89E219]',
        bgAccent: 'bg-[#58CC02]/5',
        borderAccent: 'border-[#58CC02]/20',
        iconBg: 'bg-[#58CC02]/10',
        headerIcon: IconTarget,
    },
    {
        key: 'weekly',
        title: 'Weekly Quests',
        subtitle: 'Bigger rewards, bigger goals',
        gradient: 'from-[#CE82FF] to-[#A855F7]',
        progressGradient: 'from-[#CE82FF] to-[#E8B5FF]',
        bgAccent: 'bg-[#CE82FF]/5',
        borderAccent: 'border-[#CE82FF]/20',
        iconBg: 'bg-[#CE82FF]/10',
        headerIcon: IconLightning,
    },
    {
        key: 'milestone',
        title: 'Milestones',
        subtitle: 'One-time achievements',
        gradient: 'from-[#FF9600] to-[#FFC800]',
        progressGradient: 'from-[#FF9600] to-[#FFC800]',
        bgAccent: 'bg-[#FF9600]/5',
        borderAccent: 'border-[#FF9600]/20',
        iconBg: 'bg-[#FF9600]/10',
        headerIcon: IconTrophy,
    },
]

// ─── Component ──────────────────────────────────────────────────────────────

export default function Quests() {
    const navigate = useNavigate()
    const { user, fetchUser } = useAuthStore()
    const { quests, isLoading, fetchQuests, claimQuest } = useQuestStore()
    const { showToast } = useUIStore()
    const [claimingId, setClaimingId] = useState(null)
    const [claimedIds, setClaimedIds] = useState(new Set())
    const [now, setNow] = useState(() => new Date())

    // Tick every second so countdowns stay live
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000)
        return () => clearInterval(id)
    }, [])

    useEffect(() => {
        if (!user) { navigate('/login'); return }
        fetchQuests()
    }, [user])

    const handleClaim = async (uq) => {
        if (claimingId) return
        setClaimingId(uq.id)
        try {
            const res = await claimQuest(uq.id)
            await fetchUser()
            setClaimedIds(prev => new Set([...prev, uq.id]))
            showToast(`+${res.coins_awarded} coins!`, 'success')
        } catch (e) {
            showToast(e.message || 'Claim failed', 'error')
        } finally {
            setClaimingId(null)
        }
    }

    // Compute time-to-reset from the live `now` tick
    const pad = (n) => String(n).padStart(2, '0')
    const getTimeUntilReset = (type) => {
        if (type === 'daily') {
            const tomorrow = new Date(now)
            tomorrow.setDate(tomorrow.getDate() + 1)
            tomorrow.setHours(0, 0, 0, 0)
            const diff = tomorrow - now
            const h = Math.floor(diff / 3600000)
            const m = Math.floor((diff % 3600000) / 60000)
            const s = Math.floor((diff % 60000) / 1000)
            return `${h}h`
        }
        if (type === 'weekly') {
            const dow = now.getDay()
            const daysLeft = dow === 0 ? 1 : 8 - dow
            const next = new Date(now)
            next.setDate(next.getDate() + daysLeft)
            next.setHours(0, 0, 0, 0)
            const diff = next - now
            const d = Math.floor(diff / 86400000)
            const h = Math.floor((diff % 86400000) / 3600000)
            const m = Math.floor((diff % 3600000) / 60000)
            const s = Math.floor((diff % 60000) / 1000)
            return `${d}d ${h}h`
        }
        return null
    }

    if (!user) return null

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[#AFAFAF]" />
            </div>
        )
    }

    return (
        <div className="max-w-xl mx-auto pb-8">
            {/* Coin Header */}
            <div className="flex items-center justify-between mb-6 px-1">
                <div>
                    <h1 className="text-2xl font-extrabold tracking-tight">Quests</h1>
                    <p className="text-sm text-[#AFAFAF] mt-0.5">Earn coins to unlock items</p>
                </div>
                <div className="flex items-center gap-1.5 bg-[#FFF8E1] border border-[#FFC800]/30 rounded-full px-4 py-2">
                    <div className="w-5 h-5"><IconCoin /></div>
                    <span className="font-extrabold text-[#FF9600] text-lg">{user?.coins || 0}</span>
                </div>
            </div>

            {/* Quest Sections */}
            {SECTIONS.map(section => {
                const sectionQuests = quests.filter(q => q.quest.quest_type === section.key)
                if (sectionQuests.length === 0) return null

                const completed = sectionQuests.filter(q => q.coins_claimed).length
                const total = sectionQuests.length
                const resetTime = getTimeUntilReset(section.key)
                const SectionIcon = section.headerIcon

                return (
                    <div key={section.key} className="mb-6">
                        {/* Section Header */}
                        <div className={`rounded-2xl p-4 mb-3 bg-gradient-to-r ${section.gradient}`}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                    <div className="w-6 h-6"><SectionIcon /></div>
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-white font-extrabold text-lg leading-tight">{section.title}</h2>
                                    <p className="text-white/70 text-xs mt-0.5">{section.subtitle}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-white font-bold text-sm">{completed}/{total}</div>
                                    {resetTime && (
                                        <div className="text-white/80 text-xs font-bold mt-0.5 tracking-wide">⏳ {resetTime}</div>
                                    )}
                                </div>
                            </div>
                            {/* Section progress bar */}
                            <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-white/60 rounded-full transition-all duration-700"
                                    style={{ width: `${total ? (completed / total) * 100 : 0}%` }}
                                />
                            </div>
                        </div>

                        {/* Quest Cards */}
                        <div className="space-y-2">
                            {sectionQuests.map(uq => (
                                <QuestCard
                                    key={uq.id}
                                    uq={uq}
                                    section={section}
                                    claimingId={claimingId}
                                    justClaimed={claimedIds.has(uq.id)}
                                    onClaim={handleClaim}
                                />
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// ─── Quest Card ──────────────────────────────────────────────────────────────

function QuestCard({ uq, section, claimingId, justClaimed, onClaim }) {
    const quest = uq.quest
    const pct = Math.min(100, Math.round((uq.progress / quest.requirement_value) * 100))
    const isClaimable = uq.is_complete && !uq.coins_claimed
    const isClaimed = uq.coins_claimed

    const QuestIcon = QUEST_ICONS[quest.requirement_type] || IconTarget

    return (
        <div
            className={`
        relative flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300
        ${isClaimed
                    ? 'bg-[#F7F7F7] border-[#E5E5E5] opacity-60'
                    : isClaimable
                        ? `${section.bgAccent} ${section.borderAccent} shadow-lg ring-2 ring-[#58CC02]/30`
                        : 'bg-white border-[#E5E5E5] hover:shadow-md'
                }
      `}
        >
            {/* Icon */}
            <div className={`w-12 h-12 rounded-xl ${section.iconBg} flex items-center justify-center flex-shrink-0 p-2.5`}>
                <QuestIcon />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm ${isClaimed ? 'line-through text-[#AFAFAF]' : 'text-[#4B4B4B]'}`}>
                        {quest.title}
                    </span>
                    {isClaimed && (
                        <svg viewBox="0 0 16 16" className="w-4 h-4 flex-shrink-0">
                            <circle cx="8" cy="8" r="8" fill="#58CC02" />
                            <path d="M4.5 8L7 10.5L11.5 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                        </svg>
                    )}
                </div>

                {/* Progress bar */}
                <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-3 bg-[#E5E5E5] rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r ${isClaimed ? 'from-[#AFAFAF] to-[#CDCDCD]' : section.progressGradient
                                }`}
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                    <span className="text-xs font-bold text-[#AFAFAF] tabular-nums whitespace-nowrap">
                        {uq.progress}/{quest.requirement_value}
                    </span>
                </div>
            </div>

            {/* Reward / Action */}
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0 ml-1">
                {/* Coin reward */}
                <div className="flex items-center gap-1">
                    <div className="w-4 h-4"><IconCoin /></div>
                    <span className={`font-extrabold text-sm ${isClaimed ? 'text-[#AFAFAF]' : 'text-[#FF9600]'}`}>
                        {quest.coin_reward}
                    </span>
                </div>

                {/* Claim button */}
                {isClaimable && (
                    <button
                        disabled={claimingId === uq.id}
                        onClick={() => onClaim(uq)}
                        className={`
              px-4 py-1.5 rounded-xl font-extrabold text-xs text-white uppercase tracking-wide
              bg-[#58CC02] hover:bg-[#46A302] active:bg-[#3D8F02]
              shadow-[0_4px_0_#46A302] hover:shadow-[0_3px_0_#3D8F02]
              active:shadow-[0_1px_0_#3D8F02] active:translate-y-[2px]
              transition-all duration-100
              disabled:opacity-50
            `}
                    >
                        {claimingId === uq.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            'Claim'
                        )}
                    </button>
                )}

                {/* "Claimed" with celebration */}
                {isClaimed && justClaimed && (
                    <span className="text-[10px] font-bold text-[#58CC02] animate-bounce">Claimed! 🎉</span>
                )}
            </div>
        </div>
    )
}

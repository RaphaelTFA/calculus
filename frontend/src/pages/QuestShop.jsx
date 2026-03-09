/**
 * QuestShop.jsx — single merged file
 * Combines Quests, Shop, and the unified QuestShop layout.
 *
 * Layout:
 *   Mobile/tablet  → tab-switched single column
 *   Desktop (≥lg)  → asymmetric side-by-side
 *                     Quest: flex-[7] (wider, ~58%)
 *                     Shop:  flex-[5] (narrower, ~42%)
 *   Both panels escape the Layout container → full viewport width
 */

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore, useQuestStore, useShopStore, useUIStore } from '../lib/store'
import { Flame, Loader2, ScrollText, ShoppingBag, Star, Zap } from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════
// ─── SVG PRIMITIVES ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

const SvgCoin = ({ size = 18 }) => (
  <svg viewBox="0 0 20 20" fill="none" width={size} height={size} className="inline-block flex-shrink-0">
    <circle cx="10" cy="10" r="9" fill="#FFC800" stroke="#FF9600" strokeWidth="1.5" />
    <circle cx="10" cy="10" r="6" fill="#FFE34D" />
    <text x="10" y="14" textAnchor="middle" fill="#FF9600" fontSize="10" fontWeight="900">$</text>
  </svg>
)

const SvgGem = ({ size = 18 }) => (
  <svg viewBox="0 0 20 20" fill="none" width={size} height={size} className="inline-block flex-shrink-0">
    <polygon points="10,2 18,8 14,18 6,18 2,8" fill="#1CB0F6" />
    <polygon points="10,5 15,9 12,16 8,16 5,9" fill="#6DD5FA" />
  </svg>
)

// ── Quest-specific SVGs ───────────────────────────────────────────
const IcoBook      = () => <svg viewBox="0 0 32 32" fill="none" className="w-full h-full"><rect x="4" y="3" width="24" height="26" rx="3" fill="#58CC02"/><rect x="7" y="6" width="18" height="20" rx="2" fill="#fff"/><rect x="10" y="10" width="12" height="2" rx="1" fill="#58CC02"/><rect x="10" y="14" width="8" height="2" rx="1" fill="#89E219"/></svg>
const IcoQuiz      = () => <svg viewBox="0 0 32 32" fill="none" className="w-full h-full"><circle cx="16" cy="16" r="13" fill="#CE82FF"/><circle cx="16" cy="16" r="10" fill="#fff"/><text x="16" y="21" textAnchor="middle" fill="#CE82FF" fontSize="14" fontWeight="800">✓</text></svg>
const IcoTimer     = () => <svg viewBox="0 0 32 32" fill="none" className="w-full h-full"><circle cx="16" cy="17" r="12" fill="#1CB0F6"/><circle cx="16" cy="17" r="9" fill="#fff"/><rect x="14" y="1" width="4" height="5" rx="1" fill="#1CB0F6"/><line x1="16" y1="17" x2="16" y2="11" stroke="#1CB0F6" strokeWidth="2" strokeLinecap="round"/><line x1="16" y1="17" x2="21" y2="17" stroke="#1CB0F6" strokeWidth="2" strokeLinecap="round"/></svg>
const IcoPerfect   = () => <svg viewBox="0 0 32 32" fill="none" className="w-full h-full"><polygon points="16,2 20,12 31,12 22,19 25,29 16,23 7,29 10,19 1,12 12,12" fill="#FF9600"/><polygon points="16,7 18.5,13 25,13 20,17.5 22,23 16,19.5 10,23 12,17.5 7,13 13.5,13" fill="#FFC800"/></svg>
const IcoSlides    = () => <svg viewBox="0 0 32 32" fill="none" className="w-full h-full"><rect x="3" y="6" width="26" height="20" rx="3" fill="#FF4B4B"/><rect x="6" y="9" width="20" height="14" rx="2" fill="#fff"/><polygon points="14,12 14,20 21,16" fill="#FF4B4B"/></svg>
const IcoTarget    = () => <svg viewBox="0 0 32 32" fill="none" className="w-full h-full"><circle cx="16" cy="16" r="13" fill="#FF4B4B"/><circle cx="16" cy="16" r="9" fill="#fff"/><circle cx="16" cy="16" r="6" fill="#FF4B4B"/><circle cx="16" cy="16" r="3" fill="#fff"/><circle cx="16" cy="16" r="1.5" fill="#FF4B4B"/></svg>
const IcoFlame     = () => <svg viewBox="0 0 32 32" fill="none" className="w-full h-full"><path d="M16 2C16 2 8 10 8 18C8 22.4 11.6 26 16 26C20.4 26 24 22.4 24 18C24 10 16 2 16 2Z" fill="#FF9600"/><path d="M16 10C16 10 12 15 12 19C12 21.2 13.8 23 16 23C18.2 23 20 21.2 20 19C20 15 16 10 16 10Z" fill="#FFC800"/></svg>
const IcoChapter   = () => <svg viewBox="0 0 32 32" fill="none" className="w-full h-full"><rect x="5" y="3" width="22" height="26" rx="3" fill="#1CB0F6"/><rect x="5" y="3" width="6" height="26" rx="3" fill="#0096D6"/><rect x="13" y="8" width="10" height="2" rx="1" fill="#fff"/><rect x="13" y="12" width="10" height="2" rx="1" fill="#fff" opacity="0.6"/><rect x="13" y="16" width="7" height="2" rx="1" fill="#fff" opacity="0.6"/></svg>
const IcoTrophy    = () => <svg viewBox="0 0 32 32" fill="none" className="w-full h-full"><path d="M8 6H24V14C24 18.4 20.4 22 16 22C11.6 22 8 18.4 8 14V6Z" fill="#FFC800"/><rect x="12" y="22" width="8" height="3" fill="#FFC800"/><rect x="10" y="25" width="12" height="3" rx="1" fill="#FF9600"/><path d="M8 6V12C5 12 3 10 3 8V6H8Z" fill="#FF9600"/><path d="M24 6V12C27 12 29 10 29 8V6H24Z" fill="#FF9600"/></svg>
const IcoLightning = () => <svg viewBox="0 0 32 32" fill="none" className="w-full h-full"><polygon points="18,2 8,18 15,18 14,30 24,14 17,14" fill="#FFC800"/><polygon points="17,5 10,17 14.5,17 13.8,26 21,15 17,15" fill="#FFE34D"/></svg>
const IcoCart      = () => <svg viewBox="0 0 32 32" fill="none" className="w-full h-full"><path d="M4 4H8L12 22H24L28 8H10" stroke="#58CC02" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/><circle cx="13" cy="27" r="2.5" fill="#58CC02"/><circle cx="23" cy="27" r="2.5" fill="#58CC02"/></svg>
const IcoCourse    = () => <svg viewBox="0 0 32 32" fill="none" className="w-full h-full"><path d="M16 4L3 10L16 16L29 10L16 4Z" fill="#CE82FF"/><path d="M3 10V20L16 26L29 20V10" stroke="#CE82FF" strokeWidth="2" fill="none"/><line x1="29" y1="10" x2="29" y2="24" stroke="#CE82FF" strokeWidth="2"/></svg>
const IcoCoinSm    = () => <svg viewBox="0 0 20 20" fill="none" className="w-full h-full"><circle cx="10" cy="10" r="9" fill="#FFC800" stroke="#FF9600" strokeWidth="1.5"/><circle cx="10" cy="10" r="6" fill="#FFE34D"/><text x="10" y="14" textAnchor="middle" fill="#FF9600" fontSize="10" fontWeight="900">$</text></svg>

// ── Shop-specific SVGs ────────────────────────────────────────────
const IcoBag       = () => <svg viewBox="0 0 32 32" fill="none" className="w-full h-full"><path d="M8 12H24L22 28H10L8 12Z" fill="#58CC02"/><path d="M8 12H24L22 28H10L8 12Z" stroke="#46A302" strokeWidth="1.5" fill="none"/><path d="M12 12V8C12 5.8 13.8 4 16 4C18.2 4 20 5.8 20 8V12" stroke="#46A302" strokeWidth="2" fill="none"/><rect x="13" y="16" width="6" height="4" rx="1" fill="#fff" opacity="0.5"/></svg>
const IcoBackpack  = () => <svg viewBox="0 0 32 32" fill="none" className="w-full h-full"><rect x="7" y="8" width="18" height="20" rx="4" fill="#CE82FF"/><rect x="10" y="14" width="12" height="8" rx="2" fill="#fff" opacity="0.4"/><path d="M12 8V6C12 4.3 13.8 3 16 3C18.2 3 20 4.3 20 6V8" stroke="#A855F7" strokeWidth="2" fill="none"/><rect x="14" y="18" width="4" height="3" rx="1" fill="#CE82FF"/></svg>
const IcoSnowflake = () => <svg viewBox="0 0 32 32" fill="none" className="w-full h-full"><circle cx="16" cy="16" r="13" fill="#1CB0F6" opacity="0.15"/><line x1="16" y1="4" x2="16" y2="28" stroke="#1CB0F6" strokeWidth="2.5" strokeLinecap="round"/><line x1="4" y1="16" x2="28" y2="16" stroke="#1CB0F6" strokeWidth="2.5" strokeLinecap="round"/><line x1="7" y1="7" x2="25" y2="25" stroke="#1CB0F6" strokeWidth="2" strokeLinecap="round"/><line x1="25" y1="7" x2="7" y2="25" stroke="#1CB0F6" strokeWidth="2" strokeLinecap="round"/><circle cx="16" cy="16" r="3" fill="#1CB0F6"/></svg>
const IcoBolt      = () => <svg viewBox="0 0 32 32" fill="none" className="w-full h-full"><polygon points="18,2 8,18 15,18 14,30 24,14 17,14" fill="#FFC800"/><polygon points="17,5 10,17 14.5,17 13.8,26 21,15 17,15" fill="#FFE34D"/></svg>
const IcoBulb      = () => <svg viewBox="0 0 32 32" fill="none" className="w-full h-full"><circle cx="16" cy="13" r="9" fill="#58CC02"/><rect x="12" y="22" width="8" height="3" rx="1" fill="#46A302"/><rect x="13" y="25" width="6" height="2" rx="1" fill="#46A302"/><path d="M12 13C12 10.8 13.8 9 16 9" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.6"/></svg>
const IcoKey       = () => <svg viewBox="0 0 32 32" fill="none" className="w-full h-full"><circle cx="12" cy="14" r="6" fill="#FF9600"/><circle cx="12" cy="14" r="3" fill="#FFC800"/><rect x="16" y="12" width="12" height="4" rx="2" fill="#FF9600"/><rect x="24" y="10" width="3" height="4" rx="1" fill="#FF9600"/><rect x="20" y="10" width="3" height="4" rx="1" fill="#FF9600"/></svg>
const IcoFrame     = ({ variant }) => {
  const c = variant === 'gold' ? '#FFC800' : variant === 'diamond' ? '#1CB0F6' : '#CE82FF'
  return <svg viewBox="0 0 32 32" fill="none" className="w-full h-full"><rect x="4" y="4" width="24" height="24" rx="4" stroke={c} strokeWidth="2.5" fill="none"/><rect x="8" y="8" width="16" height="16" rx="2" fill={c} opacity="0.15"/><circle cx="16" cy="16" r="5" fill={c}/><path d="M14 16L15.5 17.5L18 14.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
}
const IcoHeart     = () => <svg viewBox="0 0 32 32" fill="none" className="w-full h-full"><path d="M16 27S4 19.5 4 11.5C4 8 6.7 5 10.5 5C12.8 5 14.9 6.2 16 8C17.1 6.2 19.2 5 21.5 5C25.3 5 28 8 28 11.5C28 19.5 16 27 16 27Z" fill="#FF4B4B"/><path d="M16 23S8 17.5 8 12.5C8 10.5 9.6 9 11.5 9C13 9 14.3 9.8 15 11C15.7 9.8 17 9 18.5 9C20.4 9 22 10.5 22 12.5C22 17.5 16 23 16 23Z" fill="#FF6B6B"/></svg>

// ═══════════════════════════════════════════════════════════════════
// ─── CONFIG ─────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

const QUEST_ICONS = {
  lessons: IcoBook, quizzes: IcoQuiz, study_time: IcoTimer, perfect_quiz: IcoPerfect,
  slides: IcoSlides, streak: IcoFlame, chapter: IcoChapter, course: IcoCourse, shop_buy: IcoCart,
}

const SECTIONS = [
  {
    key: 'daily', title: 'Daily Quests', subtitle: 'Reset every day',
    gradient: 'from-[#58CC02] to-[#46A302]', progressGradient: 'from-[#58CC02] to-[#89E219]',
    bgAccent: 'bg-[#58CC02]/5', borderAccent: 'border-[#58CC02]/20', iconBg: 'bg-[#58CC02]/10', headerIcon: IcoTarget,
  },
  {
    key: 'weekly', title: 'Weekly Quests', subtitle: 'Bigger challenges',
    gradient: 'from-[#CE82FF] to-[#A855F7]', progressGradient: 'from-[#CE82FF] to-[#E8B5FF]',
    bgAccent: 'bg-[#CE82FF]/5', borderAccent: 'border-[#CE82FF]/20', iconBg: 'bg-[#CE82FF]/10', headerIcon: IcoLightning,
  },
  {
    key: 'milestone', title: 'Milestones', subtitle: 'One-time achievements',
    gradient: 'from-[#FF9600] to-[#FFC800]', progressGradient: 'from-[#FF9600] to-[#FFC800]',
    bgAccent: 'bg-[#FF9600]/5', borderAccent: 'border-[#FF9600]/20', iconBg: 'bg-[#FF9600]/10', headerIcon: IcoTrophy,
  },
]

const ITEM_ICONS = {
  heart:         IcoHeart,
  streak_freeze: IcoSnowflake, xp_boost: IcoBolt, hint_token: IcoBulb,
  avatar_frame: IcoFrame, course_unlock: IcoKey,
}
const ITEM_COLORS = {
  heart:         { bg: 'bg-[#FF4B4B]/10', border: 'border-[#FF4B4B]/25', text: 'text-[#FF4B4B]', tag: 'bg-[#FF4B4B]/15 text-[#FF4B4B]' },
  streak_freeze: { bg: 'bg-[#1CB0F6]/10', border: 'border-[#1CB0F6]/25', text: 'text-[#1CB0F6]', tag: 'bg-[#1CB0F6]/15 text-[#1CB0F6]' },
  xp_boost:      { bg: 'bg-[#FFC800]/10', border: 'border-[#FFC800]/25', text: 'text-[#FF9600]', tag: 'bg-[#FFC800]/15 text-[#FF9600]' },
  hint_token:    { bg: 'bg-[#58CC02]/10', border: 'border-[#58CC02]/25', text: 'text-[#58CC02]', tag: 'bg-[#58CC02]/15 text-[#58CC02]' },
  avatar_frame:  { bg: 'bg-[#CE82FF]/10', border: 'border-[#CE82FF]/25', text: 'text-[#CE82FF]', tag: 'bg-[#CE82FF]/15 text-[#CE82FF]' },
  course_unlock: { bg: 'bg-[#FF9600]/10', border: 'border-[#FF9600]/25', text: 'text-[#FF9600]', tag: 'bg-[#FF9600]/15 text-[#FF9600]' },
}
const TYPE_LABELS = {
  heart: 'Heart', streak_freeze: 'Streak', xp_boost: 'XP Boost',
  hint_token: 'Hint', avatar_frame: 'Cosmetic', course_unlock: 'Course',
}

// Two primary sections; any remaining item_types fall into "Other"
const SHOP_SECTIONS = [
  { label: 'Hearts',     types: ['heart'] },
  { label: 'Power-ups',  types: ['streak_freeze', 'xp_boost'] },
  { label: 'Cosmetics',  types: ['avatar_frame'] },
]

// ═══════════════════════════════════════════════════════════════════
// ─── SHARED SMALL COMPONENTS ────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

function StatPill({ icon, value, color, bg, border }) {
  return (
    <div className={`flex items-center gap-1.5 ${bg} border ${border} rounded-full px-2.5 py-1`}>
      {icon}
      <span className={`font-extrabold text-xs ${color} tabular-nums leading-none`}>{value}</span>
    </div>
  )
}

function PanelHeader({ icon, title, gradient, subtitle }) {
  return (
    <div className={`rounded-2xl p-4 mb-4 bg-gradient-to-r ${gradient}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 p-2">
          {icon}
        </div>
        <div>
          <h2 className="text-white font-extrabold text-lg leading-tight">{title}</h2>
          {subtitle && <p className="text-white/70 text-[11px] mt-0.5">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ icon, title, desc }) {
  return (
    <div className="text-center py-14">
      <div className="opacity-30 mb-3">{icon}</div>
      <p className="font-bold text-foreground mb-1">{title}</p>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ─── QUEST PANEL ────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

function QuestCard({ uq, section, claimingId, justClaimed, onClaim }) {
  const quest = uq.quest
  const pct = Math.min(100, Math.round((uq.progress / quest.requirement_value) * 100))
  const isClaimable = uq.is_complete && !uq.coins_claimed
  const isClaimed   = uq.coins_claimed
  const QIcon = QUEST_ICONS[quest.requirement_type] || IcoTarget

  return (
    <div className={`flex items-center gap-4 px-5 py-4 transition-colors duration-150
      ${isClaimable ? 'bg-[#58CC02]/5' : ''}
    `}>
      <div className={`w-12 h-12 rounded-xl ${section.iconBg} flex items-center justify-center flex-shrink-0 p-2.5`}>
        <QIcon />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`font-semibold text-base leading-tight ${isClaimed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
          {quest.title}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r
                ${isClaimed ? 'from-muted-foreground/30 to-muted-foreground/20' : section.progressGradient}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
            {uq.progress}/{quest.requirement_value}{quest.requirement_type === 'study_time' ? ' phút' : ''}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2.5 flex-shrink-0">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4"><IcoCoinSm /></div>
          <span className={`font-bold text-sm tabular-nums ${isClaimed ? 'text-muted-foreground/50' : 'text-[#FF9600]'}`}>
            {quest.coin_reward}
          </span>
        </div>
        {isClaimable ? (
          <button
            disabled={claimingId === uq.id}
            onClick={() => onClaim(uq)}
            className="px-4 py-2 rounded-lg font-extrabold text-sm text-white uppercase tracking-wide
              bg-[#58CC02] shadow-[0_2px_0_#46A302] hover:bg-[#46A302]
              active:shadow-none active:translate-y-[1px]
              transition-all duration-100 disabled:opacity-50"
          >
            {claimingId === uq.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Claim'}
          </button>
        ) : isClaimed ? (
          <svg viewBox="0 0 16 16" className="w-5 h-5 flex-shrink-0">
            <circle cx="8" cy="8" r="8" fill="#58CC02" opacity="0.35"/>
            <path d="M4.5 8L7 10.5L11.5 6" stroke="#58CC02" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        ) : (
          <div className="w-[60px]" />
        )}
      </div>
    </div>
  )
}

function QuestsPanel() {
  const navigate = useNavigate()
  const { user, fetchUser }                    = useAuthStore()
  const { quests, isLoading, fetchQuests, claimQuest } = useQuestStore()
  const { showToast }                          = useUIStore()
  const [claimingId, setClaimingId]            = useState(null)
  const [claimedIds, setClaimedIds]            = useState(new Set())
  const [claimingAll, setClaimingAll]          = useState(false)
  const [now, setNow]                          = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetchQuests()
  }, [user])

  const claimable = quests.filter(q => q.is_complete && !q.coins_claimed)

  const handleClaim = async (uq) => {
    if (claimingId) return
    setClaimingId(uq.id)
    try {
      const res = await claimQuest(uq.id)
      await fetchUser()
      setClaimedIds(prev => new Set([...prev, uq.id]))
      showToast(`+${res.coins_awarded} coins! 🎉`, 'success')
    } catch (e) { showToast(e.message || 'Claim failed', 'error') }
    finally { setClaimingId(null) }
  }

  const handleClaimAll = async () => {
    if (claimingAll || claimable.length === 0) return
    setClaimingAll(true)
    let total = 0
    for (const uq of claimable) {
      try {
        const res = await claimQuest(uq.id)
        total += res.coins_awarded || 0
        setClaimedIds(prev => new Set([...prev, uq.id]))
      } catch (_) { /* skip */ }
    }
    await fetchUser()
    setClaimingAll(false)
    showToast(`+${total} coins claimed! 🎉`, 'success')
  }

  const resetTimer = (type) => {
    if (type === 'daily') {
      const tom = new Date(now); tom.setDate(tom.getDate() + 1); tom.setHours(0,0,0,0)
      const diff = tom - now
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      return `${h}h ${m}m`
    }
    if (type === 'weekly') {
      const dow = now.getDay()
      const next = new Date(now); next.setDate(next.getDate() + (dow === 0 ? 1 : 8 - dow)); next.setHours(0,0,0,0)
      const d = Math.floor((next - now) / 86400000)
      const h = Math.floor(((next - now) % 86400000) / 3600000)
      return `${d}d ${h}h`
    }
    return null
  }

  if (!user) return null

  return (
    <div className="h-full flex flex-col gap-3 overflow-y-auto">
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : quests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2">
          <ScrollText className="w-7 h-7 text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground">Chưa có nhiệm vụ</p>
        </div>
      ) : (
        SECTIONS.map(section => {
          const sq = quests.filter(q => q.quest.quest_type === section.key)
          if (sq.length === 0) return null
          const claimableInSection = sq.filter(q => q.is_complete && !q.coins_claimed)
          return (
            <div key={section.key} className="rounded-2xl border border-border bg-card overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <h2 className="font-bold text-lg text-foreground">{section.title}</h2>
                  {resetTimer(section.key) && (
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <span className="inline-block w-3.5 h-3.5 flex-shrink-0"><IcoTimer /></span>
                      <span>Time remaining: {resetTimer(section.key)}</span>
                    </p>
                  )}
                </div>
                <button
                  disabled={claimableInSection.length === 0 || claimingAll}
                  onClick={handleClaimAll}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-extrabold text-sm transition-all duration-100
                    ${claimableInSection.length > 0
                      ? 'bg-[#58CC02] text-white shadow-[0_2px_0_#46A302] hover:brightness-105 active:shadow-none active:translate-y-[1px]'
                      : 'text-muted-foreground cursor-not-allowed'
                    }`}
                >
                  {claimingAll
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Star className="w-3.5 h-3.5" />
                  }
                  Collect All{claimableInSection.length > 0 ? ` (${claimableInSection.length})` : ''}
                </button>
              </div>
              {/* Quest rows — no dividers */}
              <div className="flex flex-col">
                {sq.map(uq => (
                  <QuestCard
                    key={uq.id} uq={uq} section={section}
                    claimingId={claimingId} justClaimed={claimedIds.has(uq.id)} onClaim={handleClaim}
                  />
                ))}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ─── SHOP PANEL ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

function ShopItemCard({ item, owned, canAfford, buying, onBuy, isLast }) {
  const colors   = ITEM_COLORS[item.item_type] || ITEM_COLORS.hint_token
  const ItemIcon = ITEM_ICONS[item.item_type]  || IcoBulb
  const variant  = item.name.toLowerCase().includes('gold') ? 'gold'
                 : item.name.toLowerCase().includes('diamond') ? 'diamond' : 'default'
  return (
    <div className={`flex items-center gap-4 px-6 py-5 transition-colors duration-150
      ${!isLast ? 'border-b border-border' : ''}
      ${canAfford ? 'hover:bg-muted/30' : 'opacity-50'}
    `}>
      <div className={`w-16 h-16 rounded-2xl ${colors.bg} flex items-center justify-center flex-shrink-0 p-3`}>
        <ItemIcon variant={variant} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-bold text-lg text-foreground leading-tight">{item.name}</p>
        </div>
        {item.description && (
          <p className="text-base text-muted-foreground leading-snug mt-1 line-clamp-2">{item.description}</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-2.5 flex-shrink-0">
        <div className="flex items-center gap-1">
          <SvgCoin size={17} />
          <span className={`font-extrabold text-base tabular-nums ${canAfford ? 'text-[#FF9600]' : 'text-muted-foreground'}`}>
            {item.price}
          </span>
        </div>
        <button
          disabled={!canAfford || buying}
          onClick={onBuy}
          className={`px-5 py-2 rounded-xl font-extrabold text-base transition-all duration-100
            ${canAfford
              ? 'bg-[#58CC02] text-white shadow-[0_2px_0_#46A302] hover:brightness-105 active:shadow-none active:translate-y-[1px]'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
            } disabled:opacity-60`}
        >
          {buying ? <Loader2 className="w-4 h-4 animate-spin" /> : canAfford ? 'Buy' : '🔒'}
        </button>
      </div>
    </div>
  )
}

function InventoryItemCard({ inv, isLast }) {
  const { user }                   = useAuthStore()
  const { equipItem, unequipItem } = useShopStore()
  const { showToast }              = useUIStore()
  const [loading, setLoading]      = useState(false)

  const colors    = ITEM_COLORS[inv.item?.item_type] || ITEM_COLORS.hint_token
  const ItemIcon  = ITEM_ICONS[inv.item?.item_type]  || IcoBulb
  const itemName  = inv.item?.name || ''
  const variant   = itemName.toLowerCase().includes('gold') ? 'gold'
                  : itemName.toLowerCase().includes('diamond') ? 'diamond' : 'default'
  const canEquip  = inv.item?.item_type === 'avatar_frame'
  const isEquipped= user?.equipped_items?.[inv.item?.item_type] === inv.item?.id

  const toggle = async () => {
    setLoading(true)
    try {
      if (isEquipped) { await unequipItem(inv.item.item_type); showToast('Unequipped ' + inv.item.name, 'success') }
      else            { await equipItem(inv.item.id);          showToast('Equipped '   + inv.item.name, 'success') }
    } catch { showToast('Action failed', 'error') }
    finally { setLoading(false) }
  }

  return (
    <div className={`flex items-center gap-4 px-6 py-5 transition-colors duration-150 hover:bg-muted/30
      ${!isLast ? 'border-b border-border' : ''}
    `}>
      <div className={`w-16 h-16 rounded-2xl ${colors.bg} flex items-center justify-center flex-shrink-0 p-3`}>
        <ItemIcon variant={variant} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-lg text-foreground leading-tight">{inv.item?.name}</p>
        {inv.item?.description && (
          <p className="text-base text-muted-foreground leading-snug mt-1 line-clamp-2">{inv.item.description}</p>
        )}
        {inv.expires_at && (
          <p className="text-xs text-[#FF9600] font-bold mt-1">⏳ {new Date(inv.expires_at).toLocaleString()}</p>
        )}
      </div>
      <div className="flex flex-col items-end gap-2.5 flex-shrink-0">
        <span className={`font-extrabold text-base tabular-nums ${colors.text}`}>×{inv.quantity}</span>
        {canEquip && (
          <button
            disabled={loading}
            onClick={toggle}
            className={`px-5 py-2 rounded-xl font-extrabold text-base transition-all duration-100
              ${isEquipped
                ? 'bg-red-500 text-white shadow-[0_2px_0_#C53030] active:shadow-none active:translate-y-[1px]'
                : 'bg-[#58CC02] text-white shadow-[0_2px_0_#46A302] hover:brightness-105 active:shadow-none active:translate-y-[1px]'
              } disabled:opacity-60`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : isEquipped ? 'Unequip' : 'Use'}
          </button>
        )}
      </div>
    </div>
  )
}

function ShopPanel() {
  const navigate = useNavigate()
  const { user, fetchUser }                             = useAuthStore()
  const { items, inventory, isLoading, fetchItems,
          fetchInventory, buyItem }                     = useShopStore()
  const { showToast }                                   = useUIStore()
  const [buyingId, setBuyingId]                         = useState(null)
  const [shopTab, setShopTab]                           = useState('shop')

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetchItems(); fetchInventory()
  }, [user])

  const handleBuy = async (item) => {
    if (buyingId) return
    if ((user?.coins || 0) < item.price) { showToast('Not enough coins! 💰', 'error'); return }
    setBuyingId(item.id)
    try {
      const res = await buyItem(item.id)
      await fetchUser(); await fetchInventory()
      showToast(`${item.icon || '✅'} ${res.message}`, 'success')
    } catch (e) { showToast(e.message || 'Purchase failed', 'error') }
    finally { setBuyingId(null) }
  }

  const getOwned    = (itemId) => inventory.find(i => i.item?.id === itemId)?.quantity || 0
  const totalItems  = inventory.reduce((s, i) => s + (i.quantity || 0), 0)

  if (!user) return null

  const knownTypes  = SHOP_SECTIONS.flatMap(s => s.types)
  const otherItems  = items.filter(i => !knownTypes.includes(i.item_type))

  return (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-bold text-2xl text-foreground">Shop</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#FFF8E1] border border-[#FFC800]/30 rounded-full px-3.5 py-2">
            <SvgCoin size={16} />
            <span className="font-extrabold text-[#FF9600] text-base tabular-nums">{user?.coins || 0}</span>
          </div>
          <button
            onClick={() => setShopTab(t => t === 'shop' ? 'inventory' : 'shop')}
            className={`relative flex items-center justify-center w-auto h-10 rounded-2xl transition-all duration-200
              ${shopTab === 'inventory'
                ? 'bg-[#58CC02] text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
          >
            <div className="flex items-center gap-1">
                <div className="w-6 h-6"><IcoBackpack /></div>
                <span className="font-extrabold text-base tabular-nums after:content-['\00a0']"> Inventory </span>    
            </div>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#FF4B4B] text-white text-[10px] font-extrabold w-5 h-5 flex items-center justify-center rounded-full leading-none">
                {totalItems > 9 ? '9+' : totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Shop tab */}
      {shopTab === 'shop' && (
        <div className="flex-1 overflow-y-auto space-y-8 pr-0.5">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-2">
              <div className="w-10 h-10 opacity-25"><IcoBag /></div>
              <p className="text-sm text-muted-foreground">Shop trống</p>
            </div>
          ) : (
            <>
              {SHOP_SECTIONS.map(section => {
                const sectionItems = items.filter(i => section.types.includes(i.item_type))
                if (sectionItems.length === 0) return null
                return (
                  <div key={section.label}>
                    <p className="text-base font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">
                      {section.label}
                    </p>
                    <div className="rounded-2xl border border-border bg-card overflow-hidden">
                      {sectionItems.map((item, idx) => (
                        <ShopItemCard
                          key={item.id} item={item} owned={getOwned(item.id)}
                          canAfford={(user?.coins || 0) >= item.price}
                          buying={buyingId === item.id} onBuy={() => handleBuy(item)}
                          isLast={idx === sectionItems.length - 1}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
              {otherItems.length > 0 && (
                <div>
                  <p className="text-base font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">Other</p>
                  <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    {otherItems.map((item, idx) => (
                      <ShopItemCard
                        key={item.id} item={item} owned={getOwned(item.id)}
                        canAfford={(user?.coins || 0) >= item.price}
                        buying={buyingId === item.id} onBuy={() => handleBuy(item)}
                        isLast={idx === otherItems.length - 1}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Inventory tab */}
      {shopTab === 'inventory' && (() => {
        const ownedInv = inventory.filter(inv => (inv.quantity || 0) > 0)
        if (ownedInv.length === 0) return (
          <div className="flex-1 overflow-y-auto">
            <EmptyState icon={<div className="w-12 h-12 mx-auto"><IcoBackpack /></div>} title="Inventory empty" desc="Buy items to see them here!" />
          </div>
        )
        const knownTypes = SHOP_SECTIONS.flatMap(s => s.types)
        return (
          <div className="flex-1 overflow-y-auto space-y-6 pr-0.5">
            {SHOP_SECTIONS.map(section => {
              const sectionInv = ownedInv.filter(inv => section.types.includes(inv.item?.item_type))
              if (sectionInv.length === 0) return null
              return (
                <div key={section.label}>
                  <p className="text-base font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">{section.label}</p>
                  <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    {sectionInv.map((inv, idx) => (
                      <InventoryItemCard key={inv.id} inv={inv} isLast={idx === sectionInv.length - 1} />
                    ))}
                  </div>
                </div>
              )
            })}
            {(() => {
              const otherInv = ownedInv.filter(inv => !knownTypes.includes(inv.item?.item_type))
              if (otherInv.length === 0) return null
              return (
                <div>
                  <p className="text-base font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">Other</p>
                  <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    {otherInv.map((inv, idx) => (
                      <InventoryItemCard key={inv.id} inv={inv} isLast={idx === otherInv.length - 1} />
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
        )
      })()}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// ─── PAGE ROOT ──────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

export default function QuestShop() {
  const { user }                        = useAuthStore()
  const navigate                        = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab]       = useState(
    searchParams.get('tab') === 'shop' ? 'shop' : 'quests'
  )

  useEffect(() => {
    if (!user) navigate('/login')
  }, [user])

  const switchTab = (tab) => {
    setActiveTab(tab)
    setSearchParams(tab === 'shop' ? { tab: 'shop' } : {}, { replace: true })
  }

  if (!user) return null

  return (
    /*
     * Escape the Layout container (container mx-auto px-4 py-6) to span
     * full viewport width. -mx-4 cancels horizontal padding, -mt-6 cancels
     * the top padding. We then supply our own padding inside each panel.
     */
    <div className="-mx-4 -mt-6">

      {/* ── Mobile / tablet: tab switcher ── */}
      <div className="lg:hidden flex gap-2 px-4 pt-4 pb-2">
        {[
          { key: 'quests', label: 'Quests', icon: <ScrollText  className="w-4 h-4" /> },
          { key: 'shop',   label: 'Shop',   icon: <ShoppingBag className="w-4 h-4" /> },
        ].map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => switchTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-extrabold text-sm
              transition-all duration-200 select-none
              ${activeTab === key
                ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-[0_4px_0_theme(colors.violet.700)]'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 shadow-[0_4px_0_theme(colors.border)]'
              }`}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      {/*
       * ── CONTENT AREA ──
       *
       * Mobile: single column, tab-controlled visibility.
       * Desktop (lg+): asymmetric flex row
       *   Quest  → fixed w-80  (~320px narrow sidebar, left)
       *   Shop   → flex-1      (takes all remaining width, right)
       * A 1-px border separates the two columns.
       */}
      <div className="lg:flex lg:items-start" style={{ minHeight: 'calc(100vh - 120px)' }}>

        {/* ── Quest column (sticky sidebar) ── */}
        <div className={`
          ${activeTab === 'quests' ? 'block' : 'hidden'} lg:block
          lg:w-[480px] lg:flex-none
          px-4 pt-4 pb-24 md:pb-8 lg:px-10 lg:pt-6
          lg:sticky lg:top-[56px] lg:h-[calc(100vh-56px)] lg:overflow-y-auto
          lg:bg-muted/10
        `}>
          <QuestsPanel />
        </div>

        {/* ── Shop column (wide main area) ── */}
        <div className={`
          ${activeTab === 'shop' ? 'block' : 'hidden'} lg:block
          lg:flex-1
          px-4 pt-4 pb-24 md:pb-8 lg:px-10 lg:pt-6
          lg:overflow-y-auto
        `}>
          <ShopPanel />
        </div>

      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useAuthStore, useShopStore, useUIStore } from '../lib/store'
import { Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// ─── Inline SVG Icons ────────────────────────────────────────────────────────

const IconCoin = ({ size = 20 }) => (
  <svg viewBox="0 0 20 20" fill="none" width={size} height={size}>
    <circle cx="10" cy="10" r="9" fill="#FFC800" stroke="#FF9600" strokeWidth="1.5" />
    <circle cx="10" cy="10" r="6" fill="#FFE34D" />
    <text x="10" y="14" textAnchor="middle" fill="#FF9600" fontSize="10" fontWeight="900">$</text>
  </svg>
)

const IconBag = () => (
  <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
    <path d="M8 12H24L22 28H10L8 12Z" fill="#58CC02" />
    <path d="M8 12H24L22 28H10L8 12Z" stroke="#46A302" strokeWidth="1.5" fill="none" />
    <path d="M12 12V8C12 5.8 13.8 4 16 4C18.2 4 20 5.8 20 8V12" stroke="#46A302" strokeWidth="2" fill="none" />
    <rect x="13" y="16" width="6" height="4" rx="1" fill="#fff" opacity="0.5" />
  </svg>
)

const IconBackpack = () => (
  <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
    <rect x="7" y="8" width="18" height="20" rx="4" fill="#CE82FF" />
    <rect x="10" y="14" width="12" height="8" rx="2" fill="#fff" opacity="0.4" />
    <path d="M12 8V6C12 4.3 13.8 3 16 3C18.2 3 20 4.3 20 6V8" stroke="#A855F7" strokeWidth="2" fill="none" />
    <rect x="14" y="18" width="4" height="3" rx="1" fill="#CE82FF" />
  </svg>
)

const IconSnowflake = () => (
  <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
    <circle cx="16" cy="16" r="13" fill="#1CB0F6" opacity="0.15" />
    <line x1="16" y1="4" x2="16" y2="28" stroke="#1CB0F6" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="4" y1="16" x2="28" y2="16" stroke="#1CB0F6" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="7" y1="7" x2="25" y2="25" stroke="#1CB0F6" strokeWidth="2" strokeLinecap="round" />
    <line x1="25" y1="7" x2="7" y2="25" stroke="#1CB0F6" strokeWidth="2" strokeLinecap="round" />
    <circle cx="16" cy="16" r="3" fill="#1CB0F6" />
  </svg>
)

const IconBolt = () => (
  <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
    <polygon points="18,2 8,18 15,18 14,30 24,14 17,14" fill="#FFC800" />
    <polygon points="17,5 10,17 14.5,17 13.8,26 21,15 17,15" fill="#FFE34D" />
  </svg>
)

const IconBulb = () => (
  <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
    <circle cx="16" cy="13" r="9" fill="#58CC02" />
    <rect x="12" y="22" width="8" height="3" rx="1" fill="#46A302" />
    <rect x="13" y="25" width="6" height="2" rx="1" fill="#46A302" />
    <path d="M12 13C12 10.8 13.8 9 16 9" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
  </svg>
)

const IconFrame = ({ variant }) => {
  let color = "#CE82FF"
  if (variant === "gold") color = "#FFC800"
  if (variant === "diamond") color = "#1CB0F6"
  return (
    <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
      <rect x="4" y="4" width="24" height="24" rx="4" stroke={color} strokeWidth="2.5" fill="none" />
      <rect x="8" y="8" width="16" height="16" rx="2" fill={color} opacity="0.15" />
      <circle cx="16" cy="16" r="5" fill={color} />
      <path d="M14 16L15.5 17.5L18 14.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const IconKey = () => (
  <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
    <circle cx="12" cy="14" r="6" fill="#FF9600" />
    <circle cx="12" cy="14" r="3" fill="#FFC800" />
    <rect x="16" y="12" width="12" height="4" rx="2" fill="#FF9600" />
    <rect x="24" y="10" width="3" height="4" rx="1" fill="#FF9600" />
    <rect x="20" y="10" width="3" height="4" rx="1" fill="#FF9600" />
  </svg>
)

const ITEM_ICONS = {
  streak_freeze: IconSnowflake,
  xp_boost: IconBolt,
  hint_token: IconBulb,
  avatar_frame: IconFrame,
  course_unlock: IconKey,
}

const ITEM_COLORS = {
  streak_freeze: { bg: 'bg-[#1CB0F6]/10', border: 'border-[#1CB0F6]/20', text: 'text-[#1CB0F6]', tag: 'bg-[#1CB0F6]/15 text-[#1CB0F6]', glow: 'shadow-[#1CB0F6]/20' },
  xp_boost: { bg: 'bg-[#FFC800]/10', border: 'border-[#FFC800]/20', text: 'text-[#FF9600]', tag: 'bg-[#FFC800]/15 text-[#FF9600]', glow: 'shadow-[#FFC800]/20' },
  hint_token: { bg: 'bg-[#58CC02]/10', border: 'border-[#58CC02]/20', text: 'text-[#58CC02]', tag: 'bg-[#58CC02]/15 text-[#58CC02]', glow: 'shadow-[#58CC02]/20' },
  avatar_frame: { bg: 'bg-[#CE82FF]/10', border: 'border-[#CE82FF]/20', text: 'text-[#CE82FF]', tag: 'bg-[#CE82FF]/15 text-[#CE82FF]', glow: 'shadow-[#CE82FF]/20' },
  course_unlock: { bg: 'bg-[#FF9600]/10', border: 'border-[#FF9600]/20', text: 'text-[#FF9600]', tag: 'bg-[#FF9600]/15 text-[#FF9600]', glow: 'shadow-[#FF9600]/20' },
}

const TYPE_LABELS = {
  streak_freeze: 'Streak',
  xp_boost: 'XP Boost',
  hint_token: 'Hint',
  avatar_frame: 'Cosmetic',
  course_unlock: 'Course',
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function Shop() {
  const navigate = useNavigate()
  const { user, fetchUser } = useAuthStore()
  const { items, inventory, isLoading, fetchItems, fetchInventory, buyItem } = useShopStore()
  const { showToast } = useUIStore()
  const [buyingId, setBuyingId] = useState(null)
  const [activeTab, setActiveTab] = useState('shop')

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetchItems()
    fetchInventory()
  }, [user])

  const handleBuy = async (item) => {
    if (buyingId) return
    if ((user?.coins || 0) < item.price) {
      showToast('Không đủ xu! 💰', 'error')
      return
    }
    setBuyingId(item.id)
    try {
      const res = await buyItem(item.id)
      await fetchUser()
      await fetchInventory()
      showToast(`${item.icon} ${res.message}`, 'success')
    } catch (e) {
      showToast(e.message || 'Mua thất bại', 'error')
    } finally {
      setBuyingId(null)
    }
  }

  const getOwnedQty = (itemId) => {
    const inv = inventory.find(i => i.item?.id === itemId)
    return inv?.quantity || 0
  }

  if (!user) return null

  return (
    <div className="max-w-xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 px-1">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Shop</h1>
          <p className="text-sm text-[#AFAFAF] mt-0.5">Spend coins on power-ups & items</p>
        </div>
        <div className="flex items-center gap-1.5 bg-[#FFF8E1] border border-[#FFC800]/30 rounded-full px-4 py-2">
          <IconCoin size={20} />
          <span className="font-extrabold text-[#FF9600] text-lg">{user?.coins || 0}</span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-5">
        <TabButton
          active={activeTab === 'shop'}
          onClick={() => setActiveTab('shop')}
          icon={<div className="w-5 h-5"><IconBag /></div>}
          label="Shop"
        />
        <TabButton
          active={activeTab === 'inventory'}
          onClick={() => setActiveTab('inventory')}
          icon={<div className="w-5 h-5"><IconBackpack /></div>}
          label="Inventory"
          badge={inventory.length > 0 ? inventory.reduce((s, i) => s + (i.quantity || 0), 0) : null}
        />
      </div>

      {/* Shop Tab */}
      {activeTab === 'shop' && (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[40vh]">
              <Loader2 className="w-8 h-8 animate-spin text-[#AFAFAF]" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={<div className="w-16 h-16 mx-auto"><IconBag /></div>}
              title="Shop is empty"
              desc="Check back later for new items!"
            />
          ) : (
            items.map(item => (
              <ShopCard
                key={item.id}
                item={item}
                owned={getOwnedQty(item.id)}
                canAfford={(user?.coins || 0) >= item.price}
                buying={buyingId === item.id}
                onBuy={() => handleBuy(item)}
              />
            ))
          )}
        </div>
      )}

      {/* Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="space-y-3">
          {inventory.length === 0 ? (
            <EmptyState
              icon={<div className="w-16 h-16 mx-auto"><IconBackpack /></div>}
              title="Kho đồ trống"
              desc="Mua vật phẩm từ Shop để thấy chúng ở đây!"
            />
          ) : (
            inventory.map(inv => (
              <InventoryCard key={inv.id} inv={inv} />
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ─── Tab Button ──────────────────────────────────────────────────────────────

function TabButton({ active, onClick, icon, label, badge }) {
  return (
    <button
      onClick={onClick}
      className={`
                flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-extrabold text-sm
                transition-all duration-200
                ${active
          ? 'bg-[#58CC02] text-white shadow-[0_4px_0_#46A302]'
          : 'bg-[#E5E5E5] text-[#777] hover:bg-[#DCDCDC] shadow-[0_4px_0_#CDCDCD]'
        }
            `}
    >
      {icon}
      {label}
      {badge != null && (
        <span className={`
                    px-2 py-0.5 rounded-full text-xs font-bold
                    ${active ? 'bg-white/25 text-white' : 'bg-white text-[#777]'}
                `}>
          {badge}
        </span>
      )}
    </button>
  )
}

// ─── Shop Card ──────────────────────────────────────────────────────────────

function ShopCard({ item, owned, canAfford, buying, onBuy }) {
  const colors = ITEM_COLORS[item.item_type] || ITEM_COLORS.hint_token
  const ItemIcon = ITEM_ICONS[item.item_type] || IconBulb
  const variant = item.name.toLowerCase().includes('gold') ? 'gold' : item.name.toLowerCase().includes('diamond') ? 'diamond' : 'default'

  return (
    <div className={`
            relative flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300
            ${canAfford
        ? `bg-white ${colors.border} hover:shadow-lg hover:${colors.glow} hover:-translate-y-0.5`
        : 'bg-[#F7F7F7] border-[#E5E5E5] opacity-70'
      }
        `}>
      {/* Icon */}
      <div className={`w-14 h-14 rounded-2xl ${colors.bg} flex items-center justify-center flex-shrink-0 p-2.5`}>
        <ItemIcon variant={variant} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-bold text-[#4B4B4B] text-sm">{item.name}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.tag}`}>
            {TYPE_LABELS[item.item_type] || item.item_type}
          </span>
        </div>
        <p className="text-xs text-[#AFAFAF] leading-relaxed line-clamp-2">{item.description}</p>
        {owned > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#58CC02] mt-1">
            <svg viewBox="0 0 12 12" className="w-3 h-3">
              <circle cx="6" cy="6" r="6" fill="#58CC02" />
              <path d="M3 6L5 8L9 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
            Owned: {owned}
          </span>
        )}
      </div>

      {/* Price + Buy */}
      <div className="flex flex-col items-center gap-2 flex-shrink-0">
        <div className="flex items-center gap-1">
          <IconCoin size={16} />
          <span className={`font-extrabold text-sm ${canAfford ? 'text-[#FF9600]' : 'text-[#AFAFAF]'}`}>
            {item.price}
          </span>
        </div>
        <button
          disabled={!canAfford || buying}
          onClick={onBuy}
          className={`
                        px-5 py-2 rounded-xl font-extrabold text-xs uppercase tracking-wide transition-all duration-100
                        ${canAfford
              ? 'bg-[#58CC02] text-white shadow-[0_4px_0_#46A302] hover:bg-[#4CAF00] active:shadow-[0_1px_0_#46A302] active:translate-y-[2px]'
              : 'bg-[#E5E5E5] text-[#AFAFAF] cursor-not-allowed shadow-[0_4px_0_#CDCDCD]'
            }
                        disabled:opacity-60
                    `}
        >
          {buying ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : canAfford ? 'Buy' : '💰'}
        </button>
      </div>
    </div>
  )
}

// ─── Inventory Card ─────────────────────────────────────────────────────────

function InventoryCard({ inv }) {
  const { user } = useAuthStore()
  const { equipItem, unequipItem } = useShopStore()
  const { showToast } = useUIStore()
  const [actionLoading, setActionLoading] = useState(false)

  const colors = ITEM_COLORS[inv.item?.item_type] || ITEM_COLORS.hint_token
  const ItemIcon = ITEM_ICONS[inv.item?.item_type] || IconBulb
  const itemName = inv.item?.name || ""
  const variant = itemName.toLowerCase().includes('gold') ? 'gold' : itemName.toLowerCase().includes('diamond') ? 'diamond' : 'default'

  const isEquipable = inv.item?.item_type === 'avatar_frame' // extend if needed
  const isEquipped = user?.equipped_items?.[inv.item?.item_type] === inv.item?.id

  const handleToggleEquip = async () => {
    setActionLoading(true)
    try {
      if (isEquipped) {
        await unequipItem(inv.item.item_type)
        showToast('Unequipped ' + inv.item.name, 'success')
      } else {
        await equipItem(inv.item.id)
        showToast('Equipped ' + inv.item.name, 'success')
      }
    } catch (e) {
      showToast('Action failed', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl border-2 ${colors.border} ${colors.bg} transition-all`}>
      {/* Icon */}
      <div className={`w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center flex-shrink-0 p-2`}>
        <ItemIcon variant={variant} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#4B4B4B] text-sm">{inv.item?.name}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.tag}`}>
            {TYPE_LABELS[inv.item?.item_type] || inv.item?.item_type}
          </span>
        </div>
        <p className="text-xs text-[#777] mt-0.5">{inv.item?.description}</p>
        {inv.expires_at && (
          <p className="text-[10px] text-[#FF9600] font-bold mt-1">
            ⏳ Expires: {new Date(inv.expires_at).toLocaleString()}
          </p>
        )}
      </div>

      {/* Actions / Quantity */}
      <div className="flex flex-col items-end gap-2">
        <div className={`flex items-center justify-center h-8 px-3 rounded-xl bg-white font-extrabold text-sm ${colors.text}`}>
          ×{inv.quantity}
        </div>
        {isEquipable && (
          <button
            disabled={actionLoading}
            onClick={handleToggleEquip}
            className={`
              px-4 py-1.5 rounded-xl font-extrabold text-[10px] uppercase tracking-wide transition-all duration-100
              ${isEquipped
                ? 'bg-red-500 text-white shadow-[0_3px_0_#C53030] hover:bg-red-400 active:shadow-[0_1px_0_#C53030] active:translate-y-[2px]'
                : 'bg-[#58CC02] text-white shadow-[0_3px_0_#46A302] hover:bg-[#4CAF00] active:shadow-[0_1px_0_#46A302] active:translate-y-[2px]'
              }
              disabled:opacity-60
            `}
          >
            {actionLoading ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : (isEquipped ? 'Unequip' : 'Use')}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Empty State ────────────────────────────────────────────────────────────

function EmptyState({ icon, title, desc }) {
  return (
    <div className="text-center py-16">
      <div className="opacity-40 mb-4">{icon}</div>
      <p className="font-bold text-[#4B4B4B] mb-1">{title}</p>
      <p className="text-sm text-[#AFAFAF]">{desc}</p>
    </div>
  )
}

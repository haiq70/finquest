import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ITEM_TYPE_ICONS,
  ITEM_TYPE_LABELS,
  SHOP_ITEMS,
  SHOP_ITEM_MAP,
  SHOP_RARITY_COLORS,
  type AvatarSlot,
  type ShopItem,
  type ShopItemType,
} from '../../src/shop/shopCatalogue';
import { useStore } from '../../src/store/useStore';
import { ScreenBackground } from '../../src/components/Glass';
import { Colors, FontWeight, Radius, Spacing } from '../../src/theme';

// ── Palette ───────────────────────────────────────────────────────────
const P = {
  bg:      '#faf5ff',
  card:    '#ffffff',
  border:  '#ede9fe',
  accent:  '#a855f7',
  text:    '#3b0764',
  textSub: '#7e22ce',
  textMut: '#a78bfa',
  coinBg:  '#fffbeb',
  coinText:'#b45309',
};

const SLOT_LABELS: Record<AvatarSlot, string> = {
  head: 'Head', background: 'Background', badge: 'Badge', outfit: 'Outfit',
};

type FilterTab = 'all' | ShopItemType;
const FILTER_TABS: Array<{ key: FilterTab; label: string }> = [
  { key: 'all',              label: 'All' },
  { key: 'streak_freeze',    label: '🧊 Freezes' },
  { key: 'xp_booster',       label: '⚡ XP' },
  { key: 'coin_magnet',      label: '🧲 Coins' },
  { key: 'avatar_accessory', label: '🎨 Avatar' },
];

type SubScreen = 'shop' | 'inventory' | 'avatar';

// ── Item detail modal — extracted to avoid IIFE in JSX ────────────────
interface PreviewModalProps {
  item: ShopItem | null;
  coins: number;
  ownedItems: Record<string, number>;
  onClose: () => void;
  onBuy: (item: ShopItem) => void;
}
function PreviewModal({ item, coins, ownedItems, onClose, onBuy }: PreviewModalProps) {
  if (!item) return null;
  const rc = SHOP_RARITY_COLORS[item.rarity];
  const owned = ownedItems[item.id] ?? 0;
  const canAfford = coins >= item.price;
  const atMax = item.maxOwned !== undefined && owned >= item.maxOwned;
  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={s.modalBg} activeOpacity={1} onPress={onClose} />
      <View style={[s.modalSheet, { backgroundColor: rc.bg, borderColor: rc.border }]}>
        <View style={[s.modalGlowBar, { backgroundColor: rc.glow }]} />
        <View style={s.modalHandle} />
        <Text style={s.modalIcon}>{item.icon}</Text>
        <Text style={[s.modalName, { color: rc.text }]}>{item.name}</Text>
        <View style={s.modalMeta}>
          <View style={[s.modalPill, { backgroundColor: rc.glow + '55' }]}>
            <Text style={[s.modalPillText, { color: rc.text }]}>{item.rarity.toUpperCase()}</Text>
          </View>
          <View style={[s.modalPill, { backgroundColor: rc.glow + '55' }]}>
            <Text style={[s.modalPillText, { color: rc.text }]}>
              {ITEM_TYPE_ICONS[item.type]} {ITEM_TYPE_LABELS[item.type]}
            </Text>
          </View>
        </View>
        <Text style={s.modalDesc}>{item.description}</Text>
        {/* Stats row */}
        {(item.xpMultiplier || item.durationHours || item.coinBonus || item.type === 'streak_freeze') ? (
          <View style={s.modalStats}>
            {item.xpMultiplier ? (
              <View style={s.modalStat}>
                <Text style={[s.modalStatVal, { color: rc.text }]}>{item.xpMultiplier}×</Text>
                <Text style={s.modalStatLabel}>XP Mult.</Text>
              </View>
            ) : null}
            {item.durationHours ? (
              <View style={s.modalStat}>
                <Text style={[s.modalStatVal, { color: rc.text }]}>{item.durationHours}h</Text>
                <Text style={s.modalStatLabel}>Duration</Text>
              </View>
            ) : null}
            {item.coinBonus ? (
              <View style={s.modalStat}>
                <Text style={[s.modalStatVal, { color: rc.text }]}>+{Math.round(item.coinBonus * 100)}%</Text>
                <Text style={s.modalStatLabel}>Coins</Text>
              </View>
            ) : null}
            {item.type === 'streak_freeze' ? (
              <View style={s.modalStat}>
                <Text style={[s.modalStatVal, { color: rc.text }]}>{item.uses}</Text>
                <Text style={s.modalStatLabel}>Freezes</Text>
              </View>
            ) : null}
          </View>
        ) : null}
        {owned > 0 && <Text style={s.ownedNote}>You own: ×{owned}</Text>}
        {atMax && <Text style={s.maxNote}>You already hold the maximum.</Text>}
        <View style={s.modalFooter}>
          <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Image source={require('../../assets/images/ui/coin.png')} style={s.coinIconImg} />
            <Text style={s.modalPrice}>{item.price.toLocaleString()} FC</Text>
          </View>
            {!canAfford && (
              <Text style={s.modalShortfall}>
                Need {(item.price - coins).toLocaleString()} more
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={[s.buyBtn, (!canAfford || atMax) && s.buyBtnOff]}
            onPress={() => onBuy(item)}
            disabled={!canAfford || atMax}
          >
            <Text style={s.buyBtnText}>
              {atMax ? 'Max Owned' : canAfford ? 'Buy Now' : 'Not enough FC'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Main screen ────────────────────────────────────────────────────────
export default function ShopScreen() {
  const coins          = useStore(st => st.coins);
  const ownedItems     = useStore(st => st.ownedItems);
  const equippedItems  = useStore(st => st.equippedItems);
  const activeXpBoost  = useStore(st => st.activeXpBoost);
  const activeCoinBoost= useStore(st => st.activeCoinBoost);
  const streakFreezes  = useStore(st => st.streakFreezes);
  const purchaseItem   = useStore(st => st.purchaseItem);
  const equipItem      = useStore(st => st.equipItem);
  const unequipSlot    = useStore(st => st.unequipSlot);
  const activateItem   = useStore(st => st.activateItem);

  const [sub, setSub]         = useState<SubScreen>('shop');
  const [filter, setFilter]   = useState<FilterTab>('all');
  const [preview, setPreview] = useState<ShopItem | null>(null);

  // ── Derived ───────────────────────────────────────────────────────
  const filteredItems = useMemo(
    () => SHOP_ITEMS.filter(i => filter === 'all' || i.type === filter),
    [filter],
  );

  // Split into pairs for the 2-column grid (no FlatList ambiguity)
  const gridRows = useMemo(() => {
    const rows: ShopItem[][] = [];
    for (let i = 0; i < filteredItems.length; i += 2) {
      rows.push(filteredItems.slice(i, i + 2));
    }
    return rows;
  }, [filteredItems]);

  const inventoryItems = useMemo(() =>
    Object.entries(ownedItems)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => ({ item: SHOP_ITEM_MAP[id], qty }))
      .filter((e): e is { item: ShopItem; qty: number } => !!e.item),
    [ownedItems],
  );

  const avatarAccessories = useMemo(() =>
    Object.entries(ownedItems)
      .filter(([id, qty]) => qty > 0 && SHOP_ITEM_MAP[id]?.type === 'avatar_accessory')
      .map(([id]) => SHOP_ITEM_MAP[id])
      .filter((i): i is ShopItem => !!i),
    [ownedItems],
  );

  const boostLabel = useMemo(() => {
    const now = Date.now();
    if (activeXpBoost && now < activeXpBoost.expiresAt) {
      const mins = Math.ceil((activeXpBoost.expiresAt - now) / 60000);
      return `⚡ ${activeXpBoost.multiplier}× XP (${mins}m left)`;
    }
    if (activeCoinBoost && now < activeCoinBoost.expiresAt) {
      const mins = Math.ceil((activeCoinBoost.expiresAt - now) / 60000);
      return `🧲 +${Math.round(activeCoinBoost.multiplier * 100)}% coins (${mins}m left)`;
    }
    return null;
  }, [activeXpBoost, activeCoinBoost]);

  // ── Handlers ──────────────────────────────────────────────────────
  function handleBuy(item: ShopItem) {
    if (coins < item.price) {
      Alert.alert('Not enough coins', `You need ${item.price - coins} more FC.`);
      return;
    }
    Alert.alert(
      `Buy ${item.name}?`,
      `Cost: ${item.price} FC\nBalance after: ${coins - item.price} FC`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy',
          onPress: () => {
            const result = purchaseItem(item.id);
            if (!result.success) Alert.alert('Cannot purchase', result.error ?? 'Unknown error.');
            else setPreview(null);
          },
        },
      ],
    );
  }

  function handleActivate(item: ShopItem) {
    const detail =
      item.type === 'xp_booster'   ? `${item.xpMultiplier}× XP for ${item.durationHours}h.` :
      item.type === 'coin_magnet'   ? `+${Math.round((item.coinBonus ?? 0) * 100)}% coins for ${item.durationHours}h.` :
      'Use this item?';
    Alert.alert(`Use ${item.name}?`, detail, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Activate', onPress: () => activateItem(item.id) },
    ]);
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <ScreenBackground>
    <SafeAreaView style={s.safe}>

      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.headerTitle}>Shop</Text>
          {boostLabel && (
            <View style={s.boostChip}>
              <Text style={s.boostText}>{boostLabel}</Text>
            </View>
          )}
        </View>
        <View style={s.coinBadge}>
          <Image source={require('../../assets/images/ui/coin.png')} style={s.coinIconImg} />
          <Text style={s.coinAmt}>{coins.toLocaleString()} FC</Text>
        </View>
      </View>

      {/* Streak freeze chips */}
      {streakFreezes > 0 && (
        <View style={s.freezeRow}>
          {Array.from({ length: streakFreezes }).map((_, i) => (
            <View key={i} style={s.freezeChip}>
              <Text style={s.freezeText}>🧊 Freeze active</Text>
            </View>
          ))}
        </View>
      )}

      {/* Sub-screen tab switcher */}
      <View style={s.subTabs}>
        {(['shop', 'inventory', 'avatar'] as SubScreen[]).map(sc => (
          <TouchableOpacity
            key={sc}
            style={[s.subTab, sub === sc && s.subTabOn]}
            onPress={() => setSub(sc)}
          >
            <Text style={[s.subTabTxt, sub === sc && s.subTabTxtOn]}>
              {sc === 'shop' ? '🛒 Shop' : sc === 'inventory' ? '🎒 Bag' : '🎨 Avatar'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── SHOP ──────────────────────────────────────────────── */}
      {sub === 'shop' && (
        // flex:1 here gives this View all remaining height so ScrollView works
        <View style={s.subScreen}>
          {/* Category filter pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.filterScroll}
            contentContainerStyle={s.filterRow}
          >
            {FILTER_TABS.map(t => (
              <TouchableOpacity
                key={t.key}
                style={[s.pill, filter === t.key && s.pillOn]}
                onPress={() => setFilter(t.key)}
              >
                <Text style={[s.pillTxt, filter === t.key && s.pillTxtOn]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Grid — plain ScrollView + manual rows, no FlatList height issues */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.grid}
          >
            {gridRows.map((row, ri) => (
              <View key={ri} style={s.gridRow}>
                {row.map(item => {
                  const rc = SHOP_RARITY_COLORS[item.rarity];
                  const owned = ownedItems[item.id] ?? 0;
                  const canAfford = coins >= item.price;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[s.card, { backgroundColor: rc.bg, borderColor: rc.border }]}
                      onPress={() => setPreview(item)}
                      activeOpacity={0.82}
                    >
                      {/* Rarity colour bar */}
                      <View style={[s.cardBar, { backgroundColor: rc.glow }]} />
                      <Text style={s.cardIcon}>{item.icon}</Text>
                      <Text style={s.cardName} numberOfLines={2}>{item.name}</Text>
                      <Text style={[s.cardRarity, { color: rc.text }]}>
                        {item.rarity.toUpperCase()}
                      </Text>
                      <View style={s.cardFooter}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Image source={require('../../assets/images/ui/coin.png')} style={s.coinIconSm} />
                          <Text style={[s.cardPrice, !canAfford && s.cardPriceRed]}>
                            {item.price.toLocaleString()}
                          </Text>
                        </View>
                        {owned > 0 && (
                          <View style={[s.ownedBadge, { backgroundColor: rc.text }]}>
                            <Text style={s.ownedBadgeTxt}>×{owned}</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {/* If odd number of items, fill the last row */}
                {row.length === 1 && <View style={s.cardPlaceholder} />}
              </View>
            ))}
            {filteredItems.length === 0 && (
              <View style={s.emptyBox}>
                <Text style={s.emptyIcon}>🛍️</Text>
                <Text style={s.emptyTitle}>Nothing here</Text>
                <Text style={s.emptySub}>Try a different category</Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* ── INVENTORY ─────────────────────────────────────────── */}
      {sub === 'inventory' && (
        <View style={s.subScreen}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.invList}>
            {inventoryItems.length === 0 ? (
              <View style={s.emptyBox}>
                <Text style={s.emptyIcon}>🎒</Text>
                <Text style={s.emptyTitle}>Bag is empty</Text>
                <Text style={s.emptySub}>Buy items from the shop to fill it up.</Text>
              </View>
            ) : (
              inventoryItems.map(({ item, qty }) => {
                const rc = SHOP_RARITY_COLORS[item.rarity];
                const isConsumable = item.type !== 'avatar_accessory';
                const isEquipped = !!(item.slot && equippedItems[item.slot] === item.id);
                return (
                  <View key={item.id} style={[s.invCard, { borderColor: rc.border }]}>
                    <View style={[s.invGlow, { backgroundColor: rc.glow }]} />
                    <View style={s.invRow}>
                      <Text style={s.invIcon}>{item.icon}</Text>
                      <View style={s.invInfo}>
                        <Text style={s.invName}>{item.name}</Text>
                        <Text style={[s.invType, { color: rc.text }]}>
                          {ITEM_TYPE_LABELS[item.type]}
                        </Text>
                        <Text style={s.invDesc} numberOfLines={2}>{item.description}</Text>
                      </View>
                      <View style={[s.invQtyBadge, { backgroundColor: rc.text }]}>
                        <Text style={s.invQtyTxt}>×{qty}</Text>
                      </View>
                    </View>
                    <View style={s.invActions}>
                      {isConsumable && (
                        <TouchableOpacity style={s.invBtn} onPress={() => handleActivate(item)}>
                          <Text style={s.invBtnTxt}>Use</Text>
                        </TouchableOpacity>
                      )}
                      {item.type === 'avatar_accessory' && (
                        <TouchableOpacity
                          style={[s.invBtn, isEquipped && s.invBtnOn]}
                          onPress={() => isEquipped ? unequipSlot(item.slot!) : equipItem(item.id)}
                        >
                          <Text style={[s.invBtnTxt, isEquipped && { color: '#fff' }]}>
                            {isEquipped ? '✓ Equipped' : 'Equip'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      )}

      {/* ── AVATAR ────────────────────────────────────────────── */}
      {sub === 'avatar' && (
        <View style={s.subScreen}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.avatarPage}>
            {/* Live preview */}
            <View style={s.avatarPreview}>
              {equippedItems.background && (
                <View style={s.avatarBgLayer}>
                  <Text style={s.avatarBgEmoji}>{SHOP_ITEM_MAP[equippedItems.background]?.icon}</Text>
                </View>
              )}
              <View style={s.avatarBody}>
                {equippedItems.head && (
                  <Text style={s.avatarHeadEmoji}>{SHOP_ITEM_MAP[equippedItems.head]?.icon}</Text>
                )}
                <Text style={s.avatarFace}>👧</Text>
                {equippedItems.outfit && (
                  <Text style={s.avatarOutfitEmoji}>{SHOP_ITEM_MAP[equippedItems.outfit]?.icon}</Text>
                )}
              </View>
              {equippedItems.badge && (
                <View style={s.avatarBadgePin}>
                  <Text style={s.avatarBadgeEmoji}>{SHOP_ITEM_MAP[equippedItems.badge]?.icon}</Text>
                </View>
              )}
              <Text style={s.avatarName}>Kasumi</Text>
            </View>

            {/* Slot pickers */}
            {(['head', 'background', 'badge', 'outfit'] as AvatarSlot[]).map(slot => {
              const equipped = equippedItems[slot] ? SHOP_ITEM_MAP[equippedItems[slot]!] : null;
              const options = avatarAccessories.filter(a => a.slot === slot);
              return (
                <View key={slot} style={s.slotSection}>
                  <Text style={s.slotTitle}>{SLOT_LABELS[slot]}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}
                    contentContainerStyle={s.slotRow}>
                    {/* None chip */}
                    <TouchableOpacity
                      style={[s.slotChip, !equipped && s.slotChipOn]}
                      onPress={() => unequipSlot(slot)}
                    >
                      <Text style={s.slotChipIcon}>✕</Text>
                      <Text style={s.slotChipLabel}>None</Text>
                    </TouchableOpacity>
                    {options.map(item => {
                      const on = equippedItems[slot] === item.id;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[s.slotChip, on && s.slotChipOn]}
                          onPress={() => on ? unequipSlot(slot) : equipItem(item.id)}
                        >
                          <Text style={s.slotChipIcon}>{item.icon}</Text>
                          <Text style={s.slotChipLabel} numberOfLines={1}>{item.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                    {options.length === 0 && (
                      <Text style={s.slotEmpty}>
                        No {SLOT_LABELS[slot].toLowerCase()} items yet
                      </Text>
                    )}
                  </ScrollView>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Detail / purchase modal */}
      <PreviewModal
        item={preview}
        coins={coins}
        ownedItems={ownedItems}
        onClose={() => setPreview(null)}
        onBuy={handleBuy}
      />
    </SafeAreaView>
    </ScreenBackground>
  );
}

// ── Styles ────────────────────────────────────────────────────────────
const CARD_GAP = 10;

const s = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: 'transparent' },

  // Header
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
                paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  headerLeft: { flex: 1, marginRight: Spacing.md },
  headerTitle:{ fontSize: 24, fontWeight: FontWeight.bold, color: P.text, letterSpacing: -0.5 },
  boostChip:  { marginTop: 4, backgroundColor: '#fef3c7', borderRadius: Radius.full,
                paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  boostText:  { fontSize: 11, color: '#b45309', fontWeight: FontWeight.semibold },
  coinBadge:  { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: P.coinBg,
                borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 8,
                borderWidth: 1, borderColor: '#fde68a' },
  coinIcon:   { fontSize: 16 },
  coinIconImg:{ width: 16, height: 16 },
  coinIconSm: { width: 13, height: 13 },
  coinAmt:    { fontSize: 15, fontWeight: FontWeight.bold, color: P.coinText },

  // Freeze row
  freezeRow:  { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg,
                marginBottom: Spacing.sm },
  freezeChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff',
                borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 5,
                borderWidth: 0.5, borderColor: '#bfdbfe' },
  freezeText: { fontSize: 12, color: '#1d4ed8', fontWeight: FontWeight.semibold },

  // Sub-screen switcher
  subTabs:    { flexDirection: 'row', marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
                backgroundColor: '#f3e8ff', borderRadius: Radius.lg, padding: 4 },
  subTab:     { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: Radius.md },
  subTabOn:   { backgroundColor: P.accent },
  subTabTxt:  { fontSize: 12, fontWeight: FontWeight.semibold, color: P.textSub },
  subTabTxtOn:{ color: '#fff' },

  // Shared sub-screen wrapper — MUST be flex:1 so it fills remaining height
  subScreen:  { flex: 1 },

  // Filter pills — a horizontal ScrollView inside a flex:1 parent stretches
  // to fill all remaining height unless we pin it with flexGrow:0, which made
  // the category row balloon down over the grid.
  filterScroll:{ flexGrow: 0 },
  filterRow:  { paddingHorizontal: Spacing.lg, gap: Spacing.sm,
                paddingBottom: Spacing.md, paddingTop: 2 },
  pill:       { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full,
                backgroundColor: '#fff', borderWidth: 0.5, borderColor: P.border },
  pillOn:     { backgroundColor: P.accent, borderColor: P.accent },
  pillTxt:    { fontSize: 12, color: P.textSub, fontWeight: FontWeight.medium },
  pillTxtOn:  { color: '#fff' },

  // 2-column grid via plain ScrollView
  grid:       { paddingHorizontal: Spacing.lg, paddingBottom: 32, paddingTop: 4 },
  gridRow:    { flexDirection: 'row', gap: CARD_GAP, marginBottom: CARD_GAP },

  // Shop card — width is (50% - half the gap - half the horizontal padding gap)
  // Using flex:1 on each card so both always fill the row equally
  card:         { flex: 1, borderRadius: Radius.lg, borderWidth: 1,
                  overflow: 'hidden', paddingBottom: Spacing.md },
  cardPlaceholder:{ flex: 1 }, // fills the empty slot in an odd-count row
  cardBar:      { height: 4, width: '100%', marginBottom: Spacing.sm },
  cardIcon:     { fontSize: 36, textAlign: 'center', marginBottom: 6, marginTop: 4,
                  lineHeight: 44 },
  cardName:     { fontSize: 13, fontWeight: FontWeight.semibold, color: P.text,
                  textAlign: 'center', paddingHorizontal: 8, marginBottom: 3,
                  minHeight: 34 },
  cardRarity:   { fontSize: 9, fontWeight: FontWeight.bold, textAlign: 'center',
                  letterSpacing: 0.6, marginBottom: Spacing.sm },
  cardFooter:   { flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
                  gap: 6, paddingHorizontal: 8 },
  cardPrice:    { fontSize: 13, fontWeight: FontWeight.bold, color: P.coinText },
  cardPriceRed: { color: Colors.expense },
  ownedBadge:   { borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 2 },
  ownedBadgeTxt:{ fontSize: 10, color: '#fff', fontWeight: FontWeight.bold },

  // Empty states
  emptyBox:   { alignItems: 'center', paddingTop: 60 },
  emptyIcon:  { fontSize: 44, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: FontWeight.bold, color: P.text, marginBottom: 4 },
  emptySub:   { fontSize: 13, color: P.textSub, textAlign: 'center', paddingHorizontal: 40 },

  // Inventory
  invList:    { paddingHorizontal: Spacing.lg, paddingBottom: 40, paddingTop: 4 },
  invCard:    { backgroundColor: P.card, borderRadius: Radius.lg, borderWidth: 1,
                marginBottom: Spacing.sm, overflow: 'hidden' },
  invGlow:    { height: 3, width: '100%' },
  invRow:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
  invIcon:    { fontSize: 28, lineHeight: 34, flexShrink: 0 },
  invInfo:    { flex: 1 },
  invName:    { fontSize: 14, fontWeight: FontWeight.semibold, color: P.text },
  invType:    { fontSize: 11, fontWeight: FontWeight.medium, marginBottom: 2 },
  invDesc:    { fontSize: 12, color: P.textSub, lineHeight: 16 },
  invQtyBadge:{ borderRadius: Radius.full, width: 32, height: 32,
                alignItems: 'center', justifyContent: 'center' },
  invQtyTxt:  { color: '#fff', fontSize: 12, fontWeight: FontWeight.bold },
  invActions: { flexDirection: 'row', paddingHorizontal: Spacing.md,
                paddingBottom: Spacing.md, gap: Spacing.sm },
  invBtn:     { flex: 1, paddingVertical: 9, borderRadius: Radius.md,
                borderWidth: 1, borderColor: P.accent, alignItems: 'center' },
  invBtnOn:   { backgroundColor: P.accent },
  invBtnTxt:  { fontSize: 13, color: P.accent, fontWeight: FontWeight.semibold },

  // Avatar
  avatarPage:     { paddingHorizontal: Spacing.lg, paddingBottom: 40, paddingTop: 4 },
  avatarPreview:  { alignItems: 'center', backgroundColor: P.card, borderRadius: Radius.xl,
                    borderWidth: 1, borderColor: P.border, paddingVertical: Spacing.xl,
                    marginBottom: Spacing.lg, overflow: 'hidden', minHeight: 170 },
  avatarBgLayer:  { ...StyleSheet.absoluteFillObject, alignItems: 'center',
                    justifyContent: 'center', opacity: 0.15 },
  avatarBgEmoji:  { fontSize: 90 },
  avatarBody:     { alignItems: 'center', marginBottom: 8 },
  avatarHeadEmoji:{ fontSize: 28, marginBottom: -4 },
  avatarFace:     { fontSize: 60 },
  avatarOutfitEmoji:{ fontSize: 24, marginTop: -6 },
  avatarBadgePin: { position: 'absolute', top: 10, right: 18 },
  avatarBadgeEmoji:{ fontSize: 24 },
  avatarName:     { fontSize: 15, fontWeight: FontWeight.bold, color: P.text },

  slotSection:  { marginBottom: Spacing.lg },
  slotTitle:    { fontSize: 12, fontWeight: FontWeight.bold, color: P.textSub,
                  textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: Spacing.sm },
  slotRow:      { gap: Spacing.sm },
  slotChip:     { alignItems: 'center', width: 78, backgroundColor: P.card,
                  borderRadius: Radius.md, borderWidth: 1, borderColor: P.border, padding: 9 },
  slotChipOn:   { backgroundColor: '#f3e8ff', borderColor: P.accent },
  slotChipIcon: { fontSize: 22, marginBottom: 4, lineHeight: 28 },
  slotChipLabel:{ fontSize: 10, color: P.textSub, fontWeight: FontWeight.medium, textAlign: 'center' },
  slotEmpty:    { fontSize: 12, color: P.textMut, paddingVertical: 16, alignSelf: 'center' },

  // Modal
  modalBg:      { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet:   { position: 'absolute', bottom: 0, left: 0, right: 0,
                  borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
                  borderWidth: 1, paddingBottom: 40, overflow: 'hidden' },
  modalGlowBar: { height: 5, width: '100%' },
  modalHandle:  { width: 36, height: 4, backgroundColor: '#ddd8', borderRadius: Radius.full,
                  alignSelf: 'center', marginVertical: Spacing.md },
  modalIcon:    { fontSize: 56, textAlign: 'center', marginBottom: 8, lineHeight: 68 },
  modalName:    { fontSize: 22, fontWeight: FontWeight.bold, textAlign: 'center',
                  paddingHorizontal: 24, marginBottom: Spacing.sm },
  modalMeta:    { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm,
                  marginBottom: Spacing.md },
  modalPill:    { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  modalPillText:{ fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.4 },
  modalDesc:    { fontSize: 14, color: P.text, textAlign: 'center', lineHeight: 20,
                  paddingHorizontal: 28, marginBottom: Spacing.lg },
  modalStats:   { flexDirection: 'row', justifyContent: 'center', gap: Spacing.xl,
                  marginBottom: Spacing.md },
  modalStat:    { alignItems: 'center' },
  modalStatVal: { fontSize: 20, fontWeight: FontWeight.bold },
  modalStatLabel:{ fontSize: 11, color: P.textSub },
  ownedNote:    { fontSize: 13, color: P.accent, fontWeight: FontWeight.semibold,
                  textAlign: 'center', marginBottom: 4 },
  maxNote:      { fontSize: 12, color: Colors.expense, textAlign: 'center',
                  marginBottom: Spacing.sm, paddingHorizontal: 24 },
  modalFooter:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingHorizontal: Spacing.xl, marginTop: Spacing.sm },
  modalPrice:   { flex: 1 },
  modalPriceText:{ fontSize: 18, fontWeight: FontWeight.bold, color: P.coinText },
  modalShortfall:{ fontSize: 11, color: Colors.expense, marginTop: 2 },
  buyBtn:       { backgroundColor: P.accent, borderRadius: Radius.lg,
                  paddingHorizontal: 24, paddingVertical: 14 },
  buyBtnOff:    { backgroundColor: '#d1d5db' },
  buyBtnText:   { color: '#fff', fontSize: 15, fontWeight: FontWeight.bold },
});

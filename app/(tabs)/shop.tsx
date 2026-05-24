import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
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
import { Colors, FontWeight, Radius, Spacing } from '../../src/theme';
import { fmtCurrency } from '../../src/utils/format';

// ── Palette (matches home screen) ────────────────────────────────────
const P = {
  bg:       '#faf5ff',
  card:     '#ffffff',
  border:   '#ede9fe',
  accent:   '#a855f7',
  accentDp: '#7c3aed',
  pink:     '#ec4899',
  text:     '#3b0764',
  textSub:  '#7e22ce',
  textMut:  '#a78bfa',
  gold:     '#f59e0b',
  coinBg:   '#fffbeb',
  coinText: '#b45309',
};

const SLOT_LABELS: Record<AvatarSlot, string> = {
  head:       'Head',
  background: 'Background',
  badge:      'Badge',
  outfit:     'Outfit',
};

type FilterTab = 'all' | ShopItemType;
const FILTER_TABS: Array<{ key: FilterTab; label: string }> = [
  { key: 'all',               label: 'All' },
  { key: 'streak_freeze',     label: '🧊 Freezes' },
  { key: 'xp_booster',        label: '⚡ XP' },
  { key: 'coin_magnet',       label: '🧲 Coins' },
  { key: 'avatar_accessory',  label: '🎨 Avatar' },
];

// ── Sub-screens ───────────────────────────────────────────────────────
type SubScreen = 'shop' | 'inventory' | 'avatar';

export default function ShopScreen() {
  const coins          = useStore(s => s.coins);
  const ownedItems     = useStore(s => s.ownedItems);
  const equippedItems  = useStore(s => s.equippedItems);
  const activeXpBoost  = useStore(s => s.activeXpBoost);
  const activeCoinBoost= useStore(s => s.activeCoinBoost);
  const streakFreezes  = useStore(s => s.streakFreezes);
  const purchaseItem   = useStore(s => s.purchaseItem);
  const equipItem      = useStore(s => s.equipItem);
  const unequipSlot    = useStore(s => s.unequipSlot);
  const activateItem   = useStore(s => s.activateItem);

  const [sub, setSub]         = useState<SubScreen>('shop');
  const [filter, setFilter]   = useState<FilterTab>('all');
  const [preview, setPreview] = useState<ShopItem | null>(null);

  const filteredItems = useMemo(() =>
    SHOP_ITEMS.filter(i => filter === 'all' || i.type === filter),
    [filter],
  );

  const inventoryItems = useMemo(() =>
    Object.entries(ownedItems)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => ({ item: SHOP_ITEM_MAP[id], qty }))
      .filter(e => !!e.item),
    [ownedItems],
  );

  const avatarAccessories = useMemo(() =>
    Object.entries(ownedItems)
      .filter(([id, qty]) => qty > 0 && SHOP_ITEM_MAP[id]?.type === 'avatar_accessory')
      .map(([id]) => SHOP_ITEM_MAP[id]),
    [ownedItems],
  );

  // ── Active boost badge ─────────────────────────────────────────
  const boostLabel = useMemo(() => {
    const now = Date.now();
    if (activeXpBoost && now < activeXpBoost.expiresAt) {
      const mins = Math.ceil((activeXpBoost.expiresAt - now) / 60000);
      return `⚡ ${activeXpBoost.multiplier}× XP (${mins}m)`;
    }
    if (activeCoinBoost && now < activeCoinBoost.expiresAt) {
      const mins = Math.ceil((activeCoinBoost.expiresAt - now) / 60000);
      return `🧲 +${Math.round(activeCoinBoost.multiplier * 100)}% coins (${mins}m)`;
    }
    return null;
  }, [activeXpBoost, activeCoinBoost]);

  function handleBuy(item: ShopItem) {
    if (coins < item.price) {
      Alert.alert('Not enough coins', `You need ${item.price - coins} more FC to buy this.`);
      return;
    }
    Alert.alert(
      `Buy ${item.name}?`,
      `Cost: ${item.price} FC\nYour balance: ${coins} FC\nAfter: ${coins - item.price} FC`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy',
          onPress: () => {
            const result = purchaseItem(item.id);
            if (!result.success) {
              Alert.alert('Cannot purchase', result.error ?? 'Unknown error.');
            } else {
              setPreview(null);
            }
          },
        },
      ],
    );
  }

  function handleActivate(item: ShopItem) {
    Alert.alert(
      `Use ${item.name}?`,
      item.type === 'xp_booster'
        ? `Activates ${item.xpMultiplier}× XP for ${item.durationHours}h.`
        : item.type === 'coin_magnet'
        ? `Activates +${Math.round((item.coinBonus ?? 0) * 100)}% coin bonus for ${item.durationHours}h.`
        : 'Activate this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Activate', onPress: () => activateItem(item.id) },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── Header ─────────────────────────────────────────── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Shop</Text>
          {boostLabel && (
            <View style={styles.boostBadge}>
              <Text style={styles.boostText}>{boostLabel}</Text>
            </View>
          )}
        </View>
        <View style={styles.coinBadge}>
          <Text style={styles.coinIcon}>🪙</Text>
          <Text style={styles.coinBalance}>{coins.toLocaleString()} FC</Text>
        </View>
      </View>

      {/* Streak freeze indicator */}
      {streakFreezes > 0 && (
        <View style={styles.freezeRow}>
          {Array.from({ length: streakFreezes }).map((_, i) => (
            <View key={i} style={styles.freezeChip}>
              <Text style={styles.freezeText}>🧊 Freeze active</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── Sub-screen tabs ─────────────────────────────────── */}
      <View style={styles.subTabs}>
        {(['shop', 'inventory', 'avatar'] as SubScreen[]).map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.subTab, sub === s && styles.subTabActive]}
            onPress={() => setSub(s)}
          >
            <Text style={[styles.subTabText, sub === s && styles.subTabTextActive]}>
              {s === 'shop' ? '🛒 Shop' : s === 'inventory' ? '🎒 Bag' : '🎨 Avatar'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── SHOP ──────────────────────────────────────────────── */}
      {sub === 'shop' && (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {FILTER_TABS.map(t => (
              <TouchableOpacity
                key={t.key}
                style={[styles.pill, filter === t.key && styles.pillActive]}
                onPress={() => setFilter(t.key)}
              >
                <Text style={[styles.pillText, filter === t.key && styles.pillTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <FlatList
            data={filteredItems}
            keyExtractor={i => i.id}
            numColumns={2}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={styles.gridRow}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const rc = SHOP_RARITY_COLORS[item.rarity];
              const owned = ownedItems[item.id] ?? 0;
              const canAfford = coins >= item.price;
              return (
                <TouchableOpacity
                  style={[styles.shopCard, { borderColor: rc.border, backgroundColor: rc.bg }]}
                  onPress={() => setPreview(item)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.shopGlow, { backgroundColor: rc.glow }]} />
                  <Text style={styles.shopIcon}>{item.icon}</Text>
                  <Text style={styles.shopName} numberOfLines={1}>{item.name}</Text>
                  <Text style={[styles.shopRarity, { color: rc.text }]}>{item.rarity.toUpperCase()}</Text>
                  <View style={styles.shopFooter}>
                    <Text style={[styles.shopPrice, !canAfford && styles.shopPriceRed]}>
                      🪙 {item.price.toLocaleString()}
                    </Text>
                    {owned > 0 && (
                      <View style={styles.ownedBadge}>
                        <Text style={styles.ownedText}>×{owned}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </>
      )}

      {/* ── INVENTORY ──────────────────────────────────────────── */}
      {sub === 'inventory' && (
        <ScrollView contentContainerStyle={styles.invList} showsVerticalScrollIndicator={false}>
          {inventoryItems.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>🎒</Text>
              <Text style={styles.emptyTitle}>Bag is empty</Text>
              <Text style={styles.emptySub}>Buy items from the shop to fill it up.</Text>
            </View>
          ) : (
            inventoryItems.map(({ item, qty }) => {
              const rc = SHOP_RARITY_COLORS[item.rarity];
              const isConsumable = item.type !== 'avatar_accessory';
              const isEquipped = item.slot && equippedItems[item.slot] === item.id;
              return (
                <View key={item.id} style={[styles.invCard, { borderColor: rc.border }]}>
                  <View style={[styles.invGlow, { backgroundColor: rc.glow }]} />
                  <View style={styles.invRow}>
                    <Text style={styles.invIcon}>{item.icon}</Text>
                    <View style={styles.invInfo}>
                      <Text style={styles.invName}>{item.name}</Text>
                      <Text style={styles.invType}>{ITEM_TYPE_LABELS[item.type]}</Text>
                      <Text style={styles.invDesc} numberOfLines={2}>{item.description}</Text>
                    </View>
                    <View style={styles.invQty}>
                      <Text style={styles.invQtyText}>×{qty}</Text>
                    </View>
                  </View>
                  <View style={styles.invActions}>
                    {isConsumable && (
                      <TouchableOpacity
                        style={styles.invBtn}
                        onPress={() => handleActivate(item)}
                      >
                        <Text style={styles.invBtnText}>Use</Text>
                      </TouchableOpacity>
                    )}
                    {item.type === 'avatar_accessory' && (
                      <TouchableOpacity
                        style={[styles.invBtn, isEquipped && styles.invBtnEquipped]}
                        onPress={() => isEquipped
                          ? unequipSlot(item.slot!)
                          : equipItem(item.id)
                        }
                      >
                        <Text style={[styles.invBtnText, isEquipped && { color: '#fff' }]}>
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
      )}

      {/* ── AVATAR CUSTOMISATION ───────────────────────────────── */}
      {sub === 'avatar' && (
        <ScrollView contentContainerStyle={styles.avatarPage} showsVerticalScrollIndicator={false}>
          {/* Avatar preview card */}
          <View style={styles.avatarPreview}>
            {/* Background overlay from equipped background */}
            {equippedItems.background && (
              <View style={styles.avatarBgOverlay}>
                <Text style={styles.avatarBgEmoji}>
                  {SHOP_ITEM_MAP[equippedItems.background]?.icon}
                </Text>
              </View>
            )}
            <View style={styles.avatarFaceWrap}>
              {/* Head accessory */}
              {equippedItems.head && (
                <Text style={styles.avatarHead}>
                  {SHOP_ITEM_MAP[equippedItems.head]?.icon}
                </Text>
              )}
              <Text style={styles.avatarFace}>👧</Text>
              {/* Outfit */}
              {equippedItems.outfit && (
                <Text style={styles.avatarOutfit}>
                  {SHOP_ITEM_MAP[equippedItems.outfit]?.icon}
                </Text>
              )}
            </View>
            {/* Badge */}
            {equippedItems.badge && (
              <View style={styles.avatarBadgeWrap}>
                <Text style={styles.avatarBadgeEmoji}>
                  {SHOP_ITEM_MAP[equippedItems.badge]?.icon}
                </Text>
              </View>
            )}
            <Text style={styles.avatarName}>Kasumi</Text>
          </View>

          {/* Slot grid */}
          {(['head', 'background', 'badge', 'outfit'] as AvatarSlot[]).map(slot => {
            const equipped = equippedItems[slot] ? SHOP_ITEM_MAP[equippedItems[slot]!] : null;
            const available = avatarAccessories.filter(a => a.slot === slot);
            return (
              <View key={slot} style={styles.slotSection}>
                <Text style={styles.slotTitle}>{SLOT_LABELS[slot]}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.slotRow}>
                  {/* None button */}
                  <TouchableOpacity
                    style={[styles.slotChip, !equipped && styles.slotChipActive]}
                    onPress={() => unequipSlot(slot)}
                  >
                    <Text style={styles.slotChipIcon}>✕</Text>
                    <Text style={styles.slotChipLabel}>None</Text>
                  </TouchableOpacity>
                  {available.map(item => {
                    const isOn = equippedItems[slot] === item.id;
                    const rc = SHOP_RARITY_COLORS[item.rarity];
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.slotChip, isOn && styles.slotChipActive,
                          { borderColor: isOn ? P.accent : rc.border }]}
                        onPress={() => isOn ? unequipSlot(slot) : equipItem(item.id)}
                      >
                        <Text style={styles.slotChipIcon}>{item.icon}</Text>
                        <Text style={styles.slotChipLabel} numberOfLines={1}>{item.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                  {available.length === 0 && (
                    <Text style={styles.slotEmpty}>
                      No {SLOT_LABELS[slot].toLowerCase()} items owned yet
                    </Text>
                  )}
                </ScrollView>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ── Item detail modal ─────────────────────────────────── */}
      <Modal visible={!!preview} animationType="slide" transparent onRequestClose={() => setPreview(null)}>
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setPreview(null)} />
        {preview && (() => {
          const rc = SHOP_RARITY_COLORS[preview.rarity];
          const owned = ownedItems[preview.id] ?? 0;
          const canAfford = coins >= preview.price;
          const atMax = preview.maxOwned !== undefined && owned >= preview.maxOwned;
          return (
            <View style={[styles.modalSheet, { backgroundColor: rc.bg, borderColor: rc.border }]}>
              <View style={[styles.modalGlow, { backgroundColor: rc.glow }]} />
              <View style={styles.modalHandle} />
              <Text style={styles.modalIcon}>{preview.icon}</Text>
              <Text style={[styles.modalName, { color: rc.text }]}>{preview.name}</Text>
              <View style={styles.modalMeta}>
                <View style={[styles.modalPill, { backgroundColor: rc.glow + '55' }]}>
                  <Text style={[styles.modalPillText, { color: rc.text }]}>
                    {preview.rarity.toUpperCase()}
                  </Text>
                </View>
                <View style={[styles.modalPill, { backgroundColor: rc.glow + '55' }]}>
                  <Text style={[styles.modalPillText, { color: rc.text }]}>
                    {ITEM_TYPE_ICONS[preview.type]} {ITEM_TYPE_LABELS[preview.type]}
                  </Text>
                </View>
              </View>
              <Text style={styles.modalDesc}>{preview.description}</Text>

              {/* Stats */}
              <View style={styles.modalStats}>
                {preview.xpMultiplier && (
                  <View style={styles.modalStat}>
                    <Text style={styles.modalStatVal}>{preview.xpMultiplier}×</Text>
                    <Text style={styles.modalStatLabel}>XP Mult.</Text>
                  </View>
                )}
                {preview.durationHours && (
                  <View style={styles.modalStat}>
                    <Text style={styles.modalStatVal}>{preview.durationHours}h</Text>
                    <Text style={styles.modalStatLabel}>Duration</Text>
                  </View>
                )}
                {preview.coinBonus && (
                  <View style={styles.modalStat}>
                    <Text style={styles.modalStatVal}>+{Math.round(preview.coinBonus * 100)}%</Text>
                    <Text style={styles.modalStatLabel}>Coin Bonus</Text>
                  </View>
                )}
                {preview.type === 'streak_freeze' && (
                  <View style={styles.modalStat}>
                    <Text style={styles.modalStatVal}>{preview.uses}</Text>
                    <Text style={styles.modalStatLabel}>Freezes</Text>
                  </View>
                )}
              </View>

              {owned > 0 && (
                <Text style={styles.ownedNote}>You own: ×{owned}</Text>
              )}
              {atMax && (
                <Text style={styles.maxNote}>You have the maximum amount of this item.</Text>
              )}

              <View style={styles.modalFooter}>
                <View style={styles.modalPrice}>
                  <Text style={styles.modalPriceText}>🪙 {preview.price.toLocaleString()} FC</Text>
                  {!canAfford && (
                    <Text style={styles.modalShortfall}>
                      Need {(preview.price - coins).toLocaleString()} more
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={[styles.buyBtn,
                    (!canAfford || atMax) && styles.buyBtnDisabled]}
                  onPress={() => handleBuy(preview)}
                  disabled={!canAfford || atMax}
                >
                  <Text style={styles.buyBtnText}>
                    {atMax ? 'Max Owned' : canAfford ? 'Buy Now' : 'Not enough FC'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })()}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: P.bg },

  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
                  paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm },
  headerTitle:  { fontSize: 22, fontWeight: FontWeight.bold, color: P.text, letterSpacing: -0.5 },
  boostBadge:   { marginTop: 4, backgroundColor: '#fef3c7', borderRadius: Radius.full,
                  paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  boostText:    { fontSize: 11, color: '#b45309', fontWeight: FontWeight.semibold },
  coinBadge:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: P.coinBg,
                  borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 8,
                  borderWidth: 1, borderColor: '#fde68a' },
  coinIcon:     { fontSize: 16 },
  coinBalance:  { fontSize: 15, fontWeight: FontWeight.bold, color: P.coinText },

  freezeRow:    { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  freezeChip:   { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff',
                  borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 5,
                  borderWidth: 0.5, borderColor: '#bfdbfe' },
  freezeText:   { fontSize: 12, color: '#1d4ed8', fontWeight: FontWeight.semibold },

  subTabs:      { flexDirection: 'row', marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
                  backgroundColor: '#f3e8ff', borderRadius: Radius.lg, padding: 4 },
  subTab:       { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: Radius.md },
  subTabActive: { backgroundColor: P.accent },
  subTabText:   { fontSize: 12, fontWeight: FontWeight.semibold, color: P.textSub },
  subTabTextActive:{ color: '#fff' },

  filterRow:    { paddingHorizontal: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.md },
  pill:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full,
                  backgroundColor: '#fff', borderWidth: 0.5, borderColor: P.border },
  pillActive:   { backgroundColor: P.accent, borderColor: P.accent },
  pillText:     { fontSize: 12, color: P.textSub, fontWeight: FontWeight.medium },
  pillTextActive:{ color: '#fff' },

  grid:         { paddingHorizontal: Spacing.lg, paddingBottom: 32 },
  gridRow:      { justifyContent: 'space-between', marginBottom: Spacing.sm },
  shopCard:     { width: '48.5%', borderRadius: Radius.lg, borderWidth: 1, overflow: 'hidden',
                  paddingBottom: Spacing.md },
  shopGlow:     { height: 4, width: '100%', marginBottom: Spacing.sm },
  shopIcon:     { fontSize: 32, textAlign: 'center', marginBottom: 6 },
  shopName:     { fontSize: 13, fontWeight: FontWeight.semibold, color: P.text,
                  textAlign: 'center', paddingHorizontal: 8, marginBottom: 2 },
  shopRarity:   { fontSize: 9, fontWeight: FontWeight.bold, textAlign: 'center',
                  letterSpacing: 0.5, marginBottom: Spacing.sm },
  shopFooter:   { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
                  paddingHorizontal: 8 },
  shopPrice:    { fontSize: 13, fontWeight: FontWeight.bold, color: P.coinText },
  shopPriceRed: { color: Colors.expense },
  ownedBadge:   { backgroundColor: P.accent, borderRadius: Radius.full,
                  paddingHorizontal: 6, paddingVertical: 2 },
  ownedText:    { fontSize: 10, color: '#fff', fontWeight: FontWeight.bold },

  // Inventory
  invList:      { paddingHorizontal: Spacing.lg, paddingBottom: 40 },
  invCard:      { backgroundColor: P.card, borderRadius: Radius.lg, borderWidth: 1,
                  marginBottom: Spacing.sm, overflow: 'hidden' },
  invGlow:      { height: 3, width: '100%' },
  invRow:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
  invIcon:      { fontSize: 28, flexShrink: 0 },
  invInfo:      { flex: 1 },
  invName:      { fontSize: 14, fontWeight: FontWeight.semibold, color: P.text },
  invType:      { fontSize: 11, color: P.accent, fontWeight: FontWeight.medium, marginBottom: 2 },
  invDesc:      { fontSize: 12, color: P.textSub, lineHeight: 16 },
  invQty:       { backgroundColor: P.accent, borderRadius: Radius.full, width: 32, height: 32,
                  alignItems: 'center', justifyContent: 'center' },
  invQtyText:   { color: '#fff', fontSize: 12, fontWeight: FontWeight.bold },
  invActions:   { flexDirection: 'row', paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, gap: Spacing.sm },
  invBtn:       { flex: 1, paddingVertical: 8, borderRadius: Radius.md, borderWidth: 1,
                  borderColor: P.accent, alignItems: 'center' },
  invBtnEquipped:{ backgroundColor: P.accent, borderColor: P.accent },
  invBtnText:   { fontSize: 13, color: P.accent, fontWeight: FontWeight.semibold },

  emptyWrap:    { alignItems: 'center', paddingTop: 60 },
  emptyIcon:    { fontSize: 48, marginBottom: 12 },
  emptyTitle:   { fontSize: 17, fontWeight: FontWeight.bold, color: P.text, marginBottom: 4 },
  emptySub:     { fontSize: 13, color: P.textSub, textAlign: 'center', paddingHorizontal: 40 },

  // Avatar
  avatarPage:   { paddingHorizontal: Spacing.lg, paddingBottom: 40 },
  avatarPreview:{ alignItems: 'center', backgroundColor: P.card, borderRadius: Radius.xl,
                  borderWidth: 1, borderColor: P.border, padding: Spacing.xl, marginBottom: Spacing.lg,
                  overflow: 'hidden', minHeight: 160 },
  avatarBgOverlay:{ ...StyleSheet.absoluteFillObject as any, alignItems: 'center', justifyContent: 'center',
                    opacity: 0.15 },
  avatarBgEmoji:  { fontSize: 80 },
  avatarFaceWrap: { alignItems: 'center', marginBottom: 8 },
  avatarHead:     { fontSize: 28, marginBottom: -4 },
  avatarFace:     { fontSize: 56 },
  avatarOutfit:   { fontSize: 24, marginTop: -4 },
  avatarBadgeWrap:{ position: 'absolute', top: 8, right: 16 },
  avatarBadgeEmoji:{ fontSize: 24 },
  avatarName:     { fontSize: 15, fontWeight: FontWeight.bold, color: P.text },

  slotSection:  { marginBottom: Spacing.lg },
  slotTitle:    { fontSize: 12, fontWeight: FontWeight.bold, color: P.textSub,
                  textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: Spacing.sm },
  slotRow:      { gap: Spacing.sm },
  slotChip:     { alignItems: 'center', width: 76, backgroundColor: P.card,
                  borderRadius: Radius.md, borderWidth: 1, borderColor: P.border, padding: 8 },
  slotChipActive:{ backgroundColor: '#f3e8ff', borderColor: P.accent },
  slotChipIcon: { fontSize: 22, marginBottom: 4 },
  slotChipLabel:{ fontSize: 10, color: P.textSub, fontWeight: FontWeight.medium, textAlign: 'center' },
  slotEmpty:    { fontSize: 12, color: P.textMut, paddingVertical: 16 },

  // Modal
  modalBg:      { ...StyleSheet.absoluteFillObject as any, backgroundColor: 'rgba(0,0,0,0.45)' },
  modalSheet:   { position: 'absolute', bottom: 0, left: 0, right: 0,
                  borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
                  borderWidth: 1, paddingBottom: 40, overflow: 'hidden' },
  modalGlow:    { height: 5, width: '100%' },
  modalHandle:  { width: 36, height: 4, backgroundColor: '#ddd', borderRadius: Radius.full,
                  alignSelf: 'center', marginVertical: Spacing.md },
  modalIcon:    { fontSize: 52, textAlign: 'center', marginBottom: 8 },
  modalName:    { fontSize: 22, fontWeight: FontWeight.bold, textAlign: 'center',
                  paddingHorizontal: 24, marginBottom: Spacing.sm },
  modalMeta:    { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  modalPill:    { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  modalPillText:{ fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.4 },
  modalDesc:    { fontSize: 14, color: P.text, textAlign: 'center', lineHeight: 20,
                  paddingHorizontal: 28, marginBottom: Spacing.lg },
  modalStats:   { flexDirection: 'row', justifyContent: 'center', gap: Spacing.xl,
                  marginBottom: Spacing.md },
  modalStat:    { alignItems: 'center' },
  modalStatVal: { fontSize: 20, fontWeight: FontWeight.bold, color: P.text },
  modalStatLabel:{ fontSize: 11, color: P.textSub },
  ownedNote:    { fontSize: 13, color: P.accent, fontWeight: FontWeight.semibold,
                  textAlign: 'center', marginBottom: 4 },
  maxNote:      { fontSize: 12, color: Colors.expense, textAlign: 'center',
                  marginBottom: Spacing.sm, paddingHorizontal: 24 },
  modalFooter:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xl,
                  gap: Spacing.md, marginTop: Spacing.sm },
  modalPrice:   { flex: 1 },
  modalPriceText:{ fontSize: 18, fontWeight: FontWeight.bold, color: P.coinText },
  modalShortfall:{ fontSize: 11, color: Colors.expense, marginTop: 2 },
  buyBtn:       { backgroundColor: P.accent, borderRadius: Radius.lg,
                  paddingHorizontal: 24, paddingVertical: 14 },
  buyBtnDisabled:{ backgroundColor: '#d1d5db' },
  buyBtnText:   { color: '#fff', fontSize: 15, fontWeight: FontWeight.bold },
});

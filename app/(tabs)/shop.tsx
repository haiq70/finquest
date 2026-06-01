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
import { ScreenBackground } from '../../src/components/Glass';
import {
  ITEM_TYPE_ICONS,
  ITEM_TYPE_LABELS,
  SHOP_ITEMS,
  SHOP_RARITY_COLORS,
  effectSummary,
  type ShopItem,
  type ShopItemType,
} from '../../src/shop/shopCatalogue';
import { useStore } from '../../src/store/useStore';
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

type FilterTab = 'all' | ShopItemType;
const FILTER_TABS: Array<{ key: FilterTab; label: string }> = [
  { key: 'all',           label: 'All' },
  { key: 'streak_freeze', label: '🌂 Streaks' },
  { key: 'xp_booster',    label: '💞 Dates' },
  { key: 'coin_magnet',   label: '🪙 Fortune' },
];

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
  const activeXpBoost  = useStore(st => st.activeXpBoost);
  const activeCoinBoost= useStore(st => st.activeCoinBoost);
  const streakFreezes  = useStore(st => st.streakFreezes);
  const purchaseItem   = useStore(st => st.purchaseItem);

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

      {/* ── SHOP ──────────────────────────────────────────────── */}
      {/* flex:1 here gives this View all remaining height so ScrollView works */}
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
                      <Text style={s.cardEffect} numberOfLines={2}>
                        {effectSummary(item)}
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

  // Shop body wrapper — MUST be flex:1 so the grid ScrollView fills height
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
                  letterSpacing: 0.6, marginBottom: 5 },
  // At-a-glance effect line so the user knows what the item does without
  // opening the detail sheet. Fixed minHeight keeps both cards in a row aligned.
  cardEffect:   { fontSize: 11, fontWeight: FontWeight.medium, color: P.textSub,
                  textAlign: 'center', paddingHorizontal: 8, marginBottom: Spacing.sm,
                  lineHeight: 14, minHeight: 28 },
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

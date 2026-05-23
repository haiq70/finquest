import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Colors, FontWeight } from '../../src/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface TabIconProps {
  name: IoniconsName;
  focused: boolean;
  size: number;
}

function TabIcon({ name, focused, size }: TabIconProps) {
  return (
    <Ionicons
      name={focused ? name : (`${name}-outline` as IoniconsName)}
      size={size}
      color={focused ? Colors.primary : Colors.textMuted}
    />
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle:             { backgroundColor: Colors.background },
        headerShadowVisible:     false,
        headerTitleStyle:        { fontWeight: FontWeight.semibold, fontSize: 17, color: Colors.textPrimary },
        tabBarActiveTintColor:   Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor:  Colors.border,
          borderTopWidth:  0.5,
          height: Platform.OS === 'ios' ? 84 : 62,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: FontWeight.medium },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'FinQuest',
          tabBarIcon: ({ focused, size }) => (
            <TabIcon name="home" focused={focused} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ focused, size }) => (
            <TabIcon name="list" focused={focused} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Goals',
          tabBarIcon: ({ focused, size }) => (
            <TabIcon name="flag" focused={focused} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ focused, size }) => (
            <TabIcon name="bar-chart" focused={focused} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="rank"
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ focused, size }) => (
            <TabIcon name="trophy" focused={focused} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          title: 'Achievements',
          tabBarIcon: ({ focused, size }) => (
            <TabIcon name="ribbon" focused={focused} size={size} />
          ),
        }}
      />
      {/* Hide the default Expo boilerplate tab */}
      <Tabs.Screen
        name="explore"
        options={{ href: null }}
      />
    </Tabs>
  );
}

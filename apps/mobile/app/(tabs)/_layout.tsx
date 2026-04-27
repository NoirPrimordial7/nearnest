import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import { colors, type as typography } from '../../theme/tokens';

const tabIcons = {
  home: 'H',
  search: 'S',
  stores: 'M',
  profile: 'P',
} as const;

function TabIcon({ name, focused }: { name: keyof typeof tabIcons; focused: boolean }) {
  return (
    <Text
      style={{
        color: focused ? colors.primary700 : colors.textSoft,
        fontSize: typography.h3,
        fontWeight: '800',
      }}
    >
      {tabIcons[name]}
    </Text>
  );
}

export default function MainTabsLayout() {
  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary700,
        tabBarInactiveTintColor: colors.textSoft,
        tabBarLabelStyle: {
          fontSize: typography.caption,
          fontWeight: '700',
        },
        tabBarStyle: {
          minHeight: 68,
          borderTopColor: colors.borderSoft,
          backgroundColor: colors.surface,
          paddingBottom: 10,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="home" />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="search" />,
        }}
      />
      <Tabs.Screen
        name="stores/index"
        options={{
          title: 'Stores',
          tabBarLabel: 'Stores',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="stores" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} name="profile" />,
        }}
      />
    </Tabs>
  );
}

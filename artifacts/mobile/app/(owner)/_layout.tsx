import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { SymbolView } from 'expo-symbols';
import React from 'react';
import { Platform, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

function TabEmoji({ emoji, color, size = 22 }: { emoji: string; color: string; size?: number }) {
  return <Text style={{ fontSize: size }}>{emoji}</Text>;
}

function NativeOwnerTabs() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }} />
        <Label>Dashboard</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="services">
        <Icon sf={{ default: 'list.bullet', selected: 'list.bullet' }} />
        <Label>Services</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="stylists">
        <Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} />
        <Label>Stylists</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="slots">
        <Icon sf={{ default: 'clock', selected: 'clock.fill' }} />
        <Label>Slots</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="appointments">
        <Icon sf={{ default: 'calendar', selected: 'calendar.fill' }} />
        <Label>Bookings</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicOwnerTabs() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  const tabBarHeight = isWeb ? 84 : 56;
  const bottomPad = isIOS ? Math.max(insets.bottom, 16) : Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: isIOS ? 'absolute' : undefined,
          backgroundColor: isIOS ? 'transparent' : colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          height: tabBarHeight + bottomPad,
          paddingBottom: bottomPad,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: 'Inter_600SemiBold',
          marginTop: 2,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
          ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="chart.bar.fill" tintColor={color} size={20} /> : <TabEmoji emoji="📊" color={color} />,
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="list.bullet" tintColor={color} size={20} /> : <TabEmoji emoji="✂" color={color} />,
        }}
      />
      <Tabs.Screen
        name="stylists"
        options={{
          title: 'Stylists',
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="person.2" tintColor={color} size={20} /> : <TabEmoji emoji="💇" color={color} />,
        }}
      />
      <Tabs.Screen
        name="slots"
        options={{
          title: 'Slots',
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="clock" tintColor={color} size={20} /> : <TabEmoji emoji="🕐" color={color} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color }) =>
            isIOS ? <SymbolView name="calendar" tintColor={color} size={20} /> : <TabEmoji emoji="📋" color={color} />,
        }}
      />
    </Tabs>
  );
}

export default function OwnerTabLayout() {
  if (isLiquidGlassAvailable()) return <NativeOwnerTabs />;
  return <ClassicOwnerTabs />;
}

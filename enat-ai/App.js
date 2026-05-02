import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import HomeScreen     from './src/screens/HomeScreen';
import ChatScreen     from './src/screens/ChatScreen';
import ModelsScreen   from './src/screens/ModelsScreen';
import SetupScreen    from './src/screens/SetupScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AppHeader      from './src/components/AppHeader';
import { C }          from './src/theme';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator({ modelStatus }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(2,8,16,0.97)',
          borderTopColor: C.borderDim,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 6,
        },
        tabBarActiveTintColor:   C.neonBlue,
        tabBarInactiveTintColor: C.textDim,
        tabBarLabelStyle: {
          fontFamily: 'monospace',
          fontSize: 8,
          letterSpacing: 1,
        },
      }}
    >
      <Tab.Screen name="Home"     component={HomeScreen}     options={{ tabBarLabel: 'HOME',    tabBarIcon: ({ color }) => <TabIcon icon="🏠" color={color} /> }} />
      <Tab.Screen name="Chat"     component={ChatScreen}     options={{ tabBarLabel: 'CHAT',    tabBarIcon: ({ color }) => <TabIcon icon="💬" color={color} /> }} />
      <Tab.Screen name="Models"   component={ModelsScreen}   options={{ tabBarLabel: 'MODÈLES', tabBarIcon: ({ color }) => <TabIcon icon="📦" color={color} /> }} />
      <Tab.Screen name="Setup"    component={SetupScreen}    options={{ tabBarLabel: 'SETUP',   tabBarIcon: ({ color }) => <TabIcon icon="🛠️" color={color} /> }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: 'CONFIG',  tabBarIcon: ({ color }) => <TabIcon icon="⚙️" color={color} /> }} />
    </Tab.Navigator>
  );
}

function TabIcon({ icon }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 20 }}>{icon}</Text>;
}

export default function App() {
  const [modelStatus, setModelStatus] = useState('NO MODEL LOADED');

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor={C.bgDeep} />
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.root}>
          <AppHeader modelStatus={modelStatus} />
          <NavigationContainer>
            <TabNavigator modelStatus={modelStatus} />
          </NavigationContainer>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bgDeep },
  root: { flex: 1, backgroundColor: C.bgDeep },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { C } from '../theme';

export default function AppHeader({ modelStatus }) {
  const [clock, setClock] = useState('--:--:--');

  useEffect(() => {
    const iv = setInterval(() => {
      setClock(new Date().toTimeString().slice(0, 8));
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <View style={s.root}>
      <View style={s.statusBar}>
        <Text style={s.statusLeft}><Text style={s.dot}>●</Text> ENAT AI ONLINE</Text>
        <Text style={s.statusMid}>{clock}</Text>
        <Text style={s.statusRight}>⚡ KERNEL v3.0</Text>
      </View>
      <View style={s.header}>
        <View style={s.logoRow}>
          <View style={s.logoIcon}><Text style={s.logoEmoji}>🤖</Text></View>
          <View>
            <Text style={s.logoTitle}>ENAT AI</Text>
            <Text style={s.logoSub}>OFFLINE LLM MANAGER // ANDROID</Text>
          </View>
        </View>
        <View style={s.kernelBar}>
          <Text style={s.kernelText} numberOfLines={1}>
            ◈ KERNEL READY  |  {modelStatus || 'NO MODEL LOADED'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:       { backgroundColor: C.bgDeep, borderBottomWidth: 1, borderBottomColor: C.borderDim },
  statusBar:  { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.borderDim },
  statusLeft: { fontFamily: 'monospace', fontSize: 9, color: C.textDim },
  statusMid:  { fontFamily: 'monospace', fontSize: 9, color: C.textDim },
  statusRight:{ fontFamily: 'monospace', fontSize: 9, color: C.textDim },
  dot:        { color: C.neonGreen },
  header:     { padding: 14, paddingTop: 10 },
  logoRow:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  logoIcon:   { width: 40, height: 40, borderWidth: 2, borderColor: C.neonBlue, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  logoEmoji:  { fontSize: 20 },
  logoTitle:  { fontFamily: 'monospace', fontSize: 20, fontWeight: '900', color: C.neonBlue, letterSpacing: 3 },
  logoSub:    { fontFamily: 'monospace', fontSize: 8, color: C.textDim, letterSpacing: 2, marginTop: 2 },
  kernelBar:  { backgroundColor: 'rgba(0,255,136,0.05)', borderWidth: 1, borderColor: 'rgba(0,255,136,0.2)', borderRadius: 4, padding: 6 },
  kernelText: { fontFamily: 'monospace', fontSize: 10, color: C.neonGreen },
});

import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { C } from '../theme';

const PRESETS = [
  { name: 'Qwen3.5 9B Uncensored', params: '9B', quant: 'Q6_K', ctx: '4K', ram: '7.5 GB', color: C.neonGreen },
  { name: 'Qwen2.5 7B',            params: '7B', quant: 'Q4_K_M', ctx: '32K', ram: '4.1 GB', color: C.neonBlue },
  { name: 'Mistral 7B v0.3',       params: '7B', quant: 'Q5_K_M', ctx: '8K',  ram: '5.2 GB', color: C.neonPurple },
  { name: 'Phi-3 Mini 128K',       params: '3.8B', quant: 'Q4_K_M', ctx: '128K', ram: '2.4 GB', color: C.neonCyan },
];

export default function ModelsScreen({ navigation }) {
  const pick = async () => {
    const r = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: false });
    if (!r.canceled) {
      const name = r.assets[0].name.replace(/\.(gguf|bin)$/i,'').replace(/[_-]/g,' ').slice(0,32);
      navigation.navigate('Home', { modelLoaded: true, modelName: name });
    }
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: 20 }}>
      <View style={s.section}>
        <View style={s.sectionLabel}>
          <Text style={s.sectionLabelText}>📦 BIBLIOTHÈQUE</Text>
          <View style={s.line} />
        </View>

        {PRESETS.map((m) => (
          <TouchableOpacity
            key={m.name}
            style={[s.card, { borderColor: m.color + '44' }]}
            onPress={() => navigation.navigate('Home', { modelLoaded: true, modelName: m.name })}
            activeOpacity={0.7}
          >
            <View style={s.cardHeader}>
              <Text style={s.cardName}>{m.name}</Text>
              <View style={[s.badge, { borderColor: m.color + '55', backgroundColor: m.color + '18' }]}>
                <Text style={[s.badgeText, { color: m.color }]}>{m.quant}</Text>
              </View>
            </View>
            <View style={s.stats}>
              {[['PARAMS', m.params],['CTX', m.ctx],['RAM', m.ram]].map(([k,v]) => (
                <View key={k} style={s.statItem}>
                  <Text style={[s.statVal, { color: m.color }]}>{v}</Text>
                  <Text style={s.statKey}>{k}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={s.pickBtn} onPress={pick} activeOpacity={0.7}>
          <Text style={s.pickIcon}>📂</Text>
          <View>
            <Text style={s.pickLabel}>CHARGER FICHIER LOCAL</Text>
            <Text style={s.pickSub}>Ton .GGUF ou .BIN depuis le stockage</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bgDeep },
  section: { padding: 14 },
  sectionLabel:     { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionLabelText: { fontFamily: 'monospace', fontSize: 10, color: C.textDim, letterSpacing: 3 },
  line:    { flex: 1, height: 1, backgroundColor: C.borderDim, marginLeft: 8 },
  card:    { backgroundColor: C.bgCard, borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardName:   { fontSize: 14, fontWeight: '700', color: C.textPrimary, flex: 1, marginRight: 8 },
  badge:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontFamily: 'monospace', fontSize: 9, letterSpacing: 1 },
  stats:   { flexDirection: 'row', gap: 8 },
  statItem: { flex: 1, backgroundColor: 'rgba(0,212,255,0.03)', borderWidth: 1, borderColor: C.borderDim, borderRadius: 8, padding: 8, alignItems: 'center' },
  statVal: { fontFamily: 'monospace', fontSize: 12, fontWeight: '700', marginBottom: 2 },
  statKey: { fontFamily: 'monospace', fontSize: 8, color: C.textDim },
  pickBtn: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.bgCard, borderWidth: 1, borderColor: 'rgba(0,255,136,0.3)', borderRadius: 12, padding: 14, marginTop: 4 },
  pickIcon: { fontSize: 28 },
  pickLabel: { fontFamily: 'monospace', fontSize: 11, fontWeight: '700', color: C.neonGreen, letterSpacing: 1 },
  pickSub:  { fontFamily: 'monospace', fontSize: 9, color: C.textDim, marginTop: 2 },
});

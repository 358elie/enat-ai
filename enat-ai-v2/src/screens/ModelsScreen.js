import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { C } from '../theme';

const MODELS = [
  { name: 'Qwen3.5 9B Uncensored', quant: 'Q6_K', ctx: '4K',   ram: '7.5 GB', color: C.neonGreen,  file: 'Qwen3.5-9B-Uncensored-Q6_K.gguf',   hf: 'https://huggingface.co/models?search=qwen3.5+q6' },
  { name: 'Qwen2.5 7B Instruct',   quant: 'Q4_K_M', ctx: '32K', ram: '4.1 GB', color: C.neonBlue,   file: 'Qwen2.5-7B-Instruct-Q4_K_M.gguf',   hf: 'https://huggingface.co/Qwen/Qwen2.5-7B-Instruct-GGUF' },
  { name: 'Mistral 7B v0.3',       quant: 'Q5_K_M', ctx: '8K',  ram: '5.2 GB', color: C.neonPurple, file: 'Mistral-7B-v0.3-Q5_K_M.gguf',        hf: 'https://huggingface.co/models?search=mistral+q5' },
  { name: 'Phi-3 Mini 128K',       quant: 'Q4_K_M', ctx: '128K',ram: '2.4 GB', color: C.neonCyan,   file: 'Phi-3-mini-128k-instruct-Q4_K.gguf', hf: 'https://huggingface.co/microsoft/Phi-3-mini-128k-instruct-gguf' },
  { name: 'LLaMA 3.1 8B',          quant: 'Q4_K_M', ctx: '128K',ram: '4.7 GB', color: C.neonOrange, file: 'Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf', hf: 'https://huggingface.co/models?search=llama+3.1+q4' },
];

const QUANT_GUIDE = [
  { q: 'Q2_K',   ram: '~2 GB', quality: '★☆☆☆', note: 'CPU lent uniquement' },
  { q: 'Q4_K_M', ram: '~4 GB', quality: '★★★☆', note: 'Recommandé 6 GB RAM' },
  { q: 'Q5_K_M', ram: '~5 GB', quality: '★★★★', note: 'Bon équilibre' },
  { q: 'Q6_K',   ram: '~7 GB', quality: '★★★★', note: 'Meilleure qualité CPU' },
  { q: 'Q8_0',   ram: '~9 GB', quality: '★★★★', note: 'Quasi-FP16' },
];

export default function ModelsScreen({ navigation }) {
  return (
    <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: 30 }}>

      {/* GUIDE QUANTISATION */}
      <View style={s.section}>
        <SLabel text="📊 GUIDE QUANTISATION GGUF" />
        <View style={s.quantTable}>
          {QUANT_GUIDE.map(row => (
            <View key={row.q} style={s.quantRow}>
              <Text style={s.quantName}>{row.q}</Text>
              <Text style={s.quantRam}>{row.ram}</Text>
              <Text style={s.quantQuality}>{row.quality}</Text>
              <Text style={s.quantNote}>{row.note}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* MODÈLES SUGGÉRÉS */}
      <View style={s.section}>
        <SLabel text="📦 MODÈLES SUGGÉRÉS" />
        {MODELS.map(m => (
          <TouchableOpacity
            key={m.name}
            style={[s.card, { borderColor: m.color + '44' }]}
            onPress={() => Linking.openURL(m.hf)}
            activeOpacity={0.7}
          >
            <View style={s.cardHeader}>
              <Text style={s.cardName}>{m.name}</Text>
              <View style={[s.badge, { borderColor: m.color + '55', backgroundColor: m.color + '18' }]}>
                <Text style={[s.badgeText, { color: m.color }]}>{m.quant}</Text>
              </View>
            </View>
            <View style={s.stats}>
              {[['CTX', m.ctx], ['RAM', m.ram]].map(([k, v]) => (
                <View key={k} style={s.statItem}>
                  <Text style={[s.statVal, { color: m.color }]}>{v}</Text>
                  <Text style={s.statKey}>{k}</Text>
                </View>
              ))}
            </View>
            <Text style={s.fileName} numberOfLines={1}>📄 {m.file}</Text>
            <Text style={[s.hfLink, { color: m.color }]}>↗ Ouvrir sur Hugging Face</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* TIPS TÉLÉCHARGEMENT */}
      <View style={s.section}>
        <SLabel text="💡 TÉLÉCHARGEMENT" />
        <View style={s.tipsCard}>
          <Text style={s.tipsText}>
            {'1. Va sur Hugging Face depuis ton navigateur\n'}
            {'2. Cherche le modèle + "GGUF"\n'}
            {'3. Télécharge dans Downloads/\n'}
            {'4. Utilise le nom du fichier dans la commande llama-server\n\n'}
            {'💾 Place toujours tes .gguf dans :\n'}
            {'/storage/emulated/0/Download/'}
          </Text>
        </View>
      </View>

    </ScrollView>
  );
}

const SLabel = ({ text }) => (
  <View style={s.sLabel}>
    <Text style={s.sLabelText}>{text}</Text>
    <View style={s.sLine} />
  </View>
);

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: C.bgDeep },
  section:    { paddingHorizontal: 14, paddingTop: 14 },
  sLabel:     { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sLabelText: { fontFamily: 'monospace', fontSize: 10, color: C.textDim, letterSpacing: 3 },
  sLine:      { flex: 1, height: 1, backgroundColor: C.borderDim, marginLeft: 8 },
  quantTable: { backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.borderDim, borderRadius: 12, overflow: 'hidden', marginBottom: 4 },
  quantRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.borderDim },
  quantName:  { fontFamily: 'monospace', fontSize: 10, color: C.neonBlue, width: 60 },
  quantRam:   { fontFamily: 'monospace', fontSize: 10, color: C.neonGreen, width: 50 },
  quantQuality:{ fontFamily: 'monospace', fontSize: 10, color: C.neonOrange, width: 60 },
  quantNote:  { fontFamily: 'monospace', fontSize: 9, color: C.textDim, flex: 1 },
  card:       { backgroundColor: C.bgCard, borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardName:   { fontSize: 14, fontWeight: '700', color: C.textPrimary, flex: 1, marginRight: 8, fontFamily: 'monospace' },
  badge:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  badgeText:  { fontFamily: 'monospace', fontSize: 9, letterSpacing: 1 },
  stats:      { flexDirection: 'row', gap: 8, marginBottom: 8 },
  statItem:   { flex: 1, backgroundColor: 'rgba(0,212,255,0.03)', borderWidth: 1, borderColor: C.borderDim, borderRadius: 8, padding: 8, alignItems: 'center' },
  statVal:    { fontFamily: 'monospace', fontSize: 12, fontWeight: '700', marginBottom: 2 },
  statKey:    { fontFamily: 'monospace', fontSize: 8, color: C.textDim },
  fileName:   { fontFamily: 'monospace', fontSize: 9, color: C.textDim, marginBottom: 4 },
  hfLink:     { fontFamily: 'monospace', fontSize: 9, letterSpacing: 1 },
  tipsCard:   { backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.borderDim, borderRadius: 12, padding: 14 },
  tipsText:   { fontFamily: 'monospace', fontSize: 10, color: C.textPrimary, lineHeight: 18 },
});

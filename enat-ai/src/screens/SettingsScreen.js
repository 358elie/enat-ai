import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { C } from '../theme';

export default function SettingsScreen() {
  const [threads, setThreads] = useState('4');
  const [ctx, setCtx] = useState('4K');
  const [gpu, setGpu] = useState('0');
  const [temp, setTemp] = useState('0.7');

  const save = () => Alert.alert('✓ Sauvegardé', `Threads: ${threads} | CTX: ${ctx} | GPU: ${gpu} | Temp: ${temp}`);

  return (
    <ScrollView style={s.root} contentContainerStyle={{ padding: 14, paddingBottom: 30 }}>
      <Label text="⚙️ CONFIGURATION" />

      <Card>
        <ParamLabel text="THREADS CPU" />
        <Row>
          {['2','4','6','8'].map(v => (
            <ParamBtn key={v} label={v} active={threads===v} onPress={() => setThreads(v)} />
          ))}
        </Row>
      </Card>

      <Card>
        <ParamLabel text="CONTEXT LENGTH" />
        <Row>
          {['2K','4K','8K','32K'].map(v => (
            <ParamBtn key={v} label={v} active={ctx===v} onPress={() => setCtx(v)} />
          ))}
        </Row>
      </Card>

      <Card>
        <ParamLabel text="GPU LAYERS (0 = CPU ONLY)" />
        <Row>
          {['0','8','16','32'].map(v => (
            <ParamBtn key={v} label={v} active={gpu===v} onPress={() => setGpu(v)} />
          ))}
        </Row>
      </Card>

      <Card>
        <ParamLabel text="TEMPERATURE" />
        <Row>
          {['0.1','0.5','0.7','1.0'].map(v => (
            <ParamBtn key={v} label={v} active={temp===v} onPress={() => setTemp(v)} />
          ))}
        </Row>
      </Card>

      <TouchableOpacity style={s.saveBtn} onPress={save}>
        <Text style={s.saveBtnText}>💾 SAUVEGARDER CONFIG</Text>
      </TouchableOpacity>

      <Card style={{ marginTop: 10 }}>
        <Text style={s.infoTitle}>◈ TON MODÈLE</Text>
        <Text style={s.infoText}>Qwen3.5-9B-Uncensored-HauhauCS-Aggressive-Q6_K.gguf</Text>
        <Text style={[s.infoText, { color: C.textDim, marginTop: 4 }]}>/storage/emulated/0/Download/</Text>
        <Text style={[s.infoText, { color: C.neonOrange, marginTop: 4 }]}>RAM requise: ~7.5 GB</Text>
      </Card>
    </ScrollView>
  );
}

const Label = ({ text }) => (
  <View style={s.sectionLabel}>
    <Text style={s.sectionLabelText}>{text}</Text>
    <View style={s.line} />
  </View>
);
const Card = ({ children, style }) => <View style={[s.card, style]}>{children}</View>;
const ParamLabel = ({ text }) => <Text style={s.paramLabel}>{text}</Text>;
const Row = ({ children }) => <View style={s.row}>{children}</View>;
const ParamBtn = ({ label, active, onPress }) => (
  <TouchableOpacity style={[s.paramBtn, active && s.paramBtnActive]} onPress={onPress}>
    <Text style={[s.paramBtnText, active && { color: C.neonBlue }]}>{label}</Text>
  </TouchableOpacity>
);

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bgDeep },
  sectionLabel:     { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionLabelText: { fontFamily: 'monospace', fontSize: 10, color: C.textDim, letterSpacing: 3 },
  line:    { flex: 1, height: 1, backgroundColor: C.borderDim, marginLeft: 8 },
  card:    { backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.borderDim, borderRadius: 12, padding: 14, marginBottom: 10 },
  paramLabel: { fontFamily: 'monospace', fontSize: 10, color: C.textDim, marginBottom: 8, letterSpacing: 1 },
  row:     { flexDirection: 'row', gap: 8 },
  paramBtn:       { flex: 1, padding: 8, borderWidth: 1, borderColor: C.borderDim, borderRadius: 8, alignItems: 'center', backgroundColor: 'rgba(0,212,255,0.03)' },
  paramBtnActive: { backgroundColor: 'rgba(0,212,255,0.15)', borderColor: 'rgba(0,212,255,0.4)' },
  paramBtnText:   { fontFamily: 'monospace', fontSize: 10, color: C.textDim },
  saveBtn:  { backgroundColor: 'rgba(0,255,136,0.1)', borderWidth: 1, borderColor: 'rgba(0,255,136,0.4)', borderRadius: 10, padding: 13, alignItems: 'center' },
  saveBtnText: { fontFamily: 'monospace', fontSize: 12, color: C.neonGreen, letterSpacing: 2, fontWeight: '700' },
  infoTitle: { fontFamily: 'monospace', fontSize: 9, color: C.neonBlue, letterSpacing: 2, marginBottom: 6 },
  infoText:  { fontFamily: 'monospace', fontSize: 10, color: C.neonGreen, lineHeight: 16 },
});

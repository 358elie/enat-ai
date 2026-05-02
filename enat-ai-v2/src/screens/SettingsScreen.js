import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { C, DEFAULT_THREADS, DEFAULT_CTX, DEFAULT_BATCH, DEFAULT_TEMP, MAX_TOKENS, DEFAULT_PORT } from '../theme';

export default function SettingsScreen() {
  const [threads, setThreads] = useState(DEFAULT_THREADS);
  const [ctx,     setCtx]     = useState(DEFAULT_CTX);
  const [batch,   setBatch]   = useState(DEFAULT_BATCH);
  const [temp,    setTemp]    = useState(DEFAULT_TEMP);
  const [maxTok,  setMaxTok]  = useState(MAX_TOKENS);
  const [gpu,     setGpu]     = useState(0);

  const save = () => Alert.alert('✓ Configuration', `Threads: ${threads} | CTX: ${ctx} | Batch: ${batch} | GPU: ${gpu} | Temp: ${temp} | MaxTok: ${maxTok}\n\nApplique ces valeurs dans la commande llama-server (onglet Setup).`);

  return (
    <ScrollView style={s.root} contentContainerStyle={{ padding: 14, paddingBottom: 30 }}>
      <SLabel text="⚙️ CONFIGURATION" />

      <Card>
        <PLabel text="THREADS CPU" sub="= nombre de cœurs à utiliser" />
        <Row>{[2,4,6,8].map(v => <PBtn key={v} label={String(v)} active={threads===v} onPress={() => setThreads(v)} />)}</Row>
      </Card>

      <Card>
        <PLabel text="CONTEXT LENGTH" sub="Réduis si crash (RAM insuffisante)" />
        <Row>{[2048,4096,8192,16384].map(v => <PBtn key={v} label={`${v/1024}K`} active={ctx===v} onPress={() => setCtx(v)} />)}</Row>
      </Card>

      <Card>
        <PLabel text="BATCH SIZE" sub="Réduis si lent ou OOM" />
        <Row>{[128,256,512,1024].map(v => <PBtn key={v} label={String(v)} active={batch===v} onPress={() => setBatch(v)} />)}</Row>
      </Card>

      <Card>
        <PLabel text="GPU LAYERS (0 = CPU ONLY)" sub="Si Vulkan supporté sur ton device" />
        <Row>{[0,8,16,32].map(v => <PBtn key={v} label={v===0?'CPU':String(v)} active={gpu===v} onPress={() => setGpu(v)} />)}</Row>
      </Card>

      <Card>
        <PLabel text="TEMPERATURE" sub="0.1 = précis | 1.0 = créatif" />
        <Row>{[0.1,0.5,0.7,1.0].map(v => <PBtn key={v} label={String(v)} active={temp===v} onPress={() => setTemp(v)} />)}</Row>
      </Card>

      <Card>
        <PLabel text="MAX TOKENS RÉPONSE" sub="Réduis pour les gros modèles lents" />
        <Row>{[512,1024,2048,4096].map(v => <PBtn key={v} label={String(v)} active={maxTok===v} onPress={() => setMaxTok(v)} />)}</Row>
      </Card>

      <TouchableOpacity style={s.saveBtn} onPress={save}>
        <Text style={s.saveBtnText}>💾 VOIR CONFIGURATION</Text>
      </TouchableOpacity>

      <Card style={{ marginTop: 10 }}>
        <Text style={s.infoTitle}>◈ CONSEILS GROS MODÈLES</Text>
        <Text style={s.infoText}>
          {'• Q6_K (9B) → 8 threads, ctx 4096, batch 256\n'}
          {'• Q4_K (7B) → 4 threads, ctx 8192, batch 512\n'}
          {'• Si lent → réduis ctx et batch\n'}
          {'• Si crash → réduis ctx à 2048\n'}
          {'• --mlock → évite le swap Android\n'}
          {'• --flash-attn → +30% vitesse'}
        </Text>
      </Card>
    </ScrollView>
  );
}

const SLabel = ({ text }) => (
  <View style={s.sLabel}>
    <Text style={s.sLabelText}>{text}</Text>
    <View style={s.sLine} />
  </View>
);
const Card = ({ children, style }) => <View style={[s.card, style]}>{children}</View>;
const PLabel = ({ text, sub }) => (
  <View style={{ marginBottom: 8 }}>
    <Text style={s.pLabel}>{text}</Text>
    {sub && <Text style={s.pSub}>{sub}</Text>}
  </View>
);
const Row = ({ children }) => <View style={s.row}>{children}</View>;
const PBtn = ({ label, active, onPress }) => (
  <TouchableOpacity style={[s.pBtn, active && s.pBtnActive]} onPress={onPress}>
    <Text style={[s.pBtnText, active && { color: C.neonBlue }]}>{label}</Text>
  </TouchableOpacity>
);

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: C.bgDeep },
  sLabel:     { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sLabelText: { fontFamily: 'monospace', fontSize: 10, color: C.textDim, letterSpacing: 3 },
  sLine:      { flex: 1, height: 1, backgroundColor: C.borderDim, marginLeft: 8 },
  card:       { backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.borderDim, borderRadius: 12, padding: 14, marginBottom: 10 },
  pLabel:     { fontFamily: 'monospace', fontSize: 10, color: C.textDim, letterSpacing: 1 },
  pSub:       { fontFamily: 'monospace', fontSize: 8, color: C.textDim + '99', marginTop: 2 },
  row:        { flexDirection: 'row', gap: 8 },
  pBtn:       { flex: 1, padding: 8, borderWidth: 1, borderColor: C.borderDim, borderRadius: 8, alignItems: 'center', backgroundColor: 'rgba(0,212,255,0.03)' },
  pBtnActive: { backgroundColor: 'rgba(0,212,255,0.15)', borderColor: 'rgba(0,212,255,0.4)' },
  pBtnText:   { fontFamily: 'monospace', fontSize: 10, color: C.textDim },
  saveBtn:    { backgroundColor: 'rgba(0,255,136,0.1)', borderWidth: 1, borderColor: 'rgba(0,255,136,0.4)', borderRadius: 10, padding: 13, alignItems: 'center' },
  saveBtnText:{ fontFamily: 'monospace', fontSize: 12, color: C.neonGreen, letterSpacing: 2, fontWeight: '700' },
  infoTitle:  { fontFamily: 'monospace', fontSize: 9, color: C.neonBlue, letterSpacing: 2, marginBottom: 8 },
  infoText:   { fontFamily: 'monospace', fontSize: 10, color: C.textPrimary, lineHeight: 18 },
});

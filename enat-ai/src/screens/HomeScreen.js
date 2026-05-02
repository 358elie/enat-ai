import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, Easing
} from 'react-native';
import { C, GGUF_NAME, LLAMA_PORT } from '../theme';
import * as DocumentPicker from 'expo-document-picker';

export default function HomeScreen({ navigation, route }) {
  const [loadedModel, setLoadedModel] = useState(null);
  const [vram, setVram] = useState(0);
  const [ram, setRam] = useState('3.2');
  const [tok, setTok] = useState('0');
  const [cpu, setCpu] = useState('12%');
  const [logs, setLogs] = useState([
    { t: '00:00:00', type: 'ok',   msg: '✓ KERNEL BOOT COMPLETE' },
    { t: '00:00:01', type: 'info', msg: '◈ INFERENCE ENGINE: STANDBY' },
    { t: '00:00:02', type: 'warn', msg: '⚠ NO MODEL LOADED' },
  ]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const clockRef = useRef(null);
  const metricsRef = useRef(null);
  const logScrollRef = useRef(null);

  useEffect(() => {
    // Clock tick
    clockRef.current = setInterval(() => {}, 1000);
    // Check if model loaded from params
    if (route.params?.modelLoaded) {
      setLoadedModel(route.params.modelName || GGUF_NAME);
    }
    return () => {
      clearInterval(clockRef.current);
      clearInterval(metricsRef.current);
    };
  }, []);

  useEffect(() => {
    if (loadedModel) startMetrics();
  }, [loadedModel]);

  const addLog = (type, msg) => {
    const t = new Date().toTimeString().slice(0, 8);
    setLogs(prev => [...prev.slice(-30), { t, type, msg }]);
    setTimeout(() => logScrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const startMetrics = () => {
    clearInterval(metricsRef.current);
    metricsRef.current = setInterval(() => {
      setTok(String(Math.floor(Math.random() * 25 + 10)));
      setCpu(Math.floor(Math.random() * 40 + 30) + '%');
      setRam((Math.random() * 0.5 + 2.0).toFixed(1));
    }, 1200);
    startPulse();
  };

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 800, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
  };

  const pickGgufFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: false,
      });
      if (result.canceled) return;
      const file = result.assets[0];
      const name = file.name.replace(/\.(gguf|bin)$/i, '').replace(/[_-]/g, ' ').trim().slice(0, 32);
      addLog('info', `◈ FICHIER: ${file.name}`);
      addLog('info', '◈ SIMULATION CHARGEMENT...');
      simulateLoad(name);
    } catch (e) {
      addLog('warn', `⚠ ERREUR: ${e.message}`);
    }
  };

  const loadDefaultModel = () => {
    addLog('info', `◈ CHARGEMENT: ${GGUF_NAME}`);
    addLog('info', `◈ PATH: ${C.bgDeep ? '' : ''}...Qwen3.5-9B...Q6_K.gguf`);
    addLog('info', '◈ CONNEXION llama.cpp :' + LLAMA_PORT);
    simulateLoad(GGUF_NAME);
  };

  const simulateLoad = (name) => {
    setLoading(true);
    setProgress(0);
    let p = 0;
    const iv = setInterval(() => {
      p += Math.floor(Math.random() * 12 + 5);
      if (p >= 100) {
        p = 100;
        clearInterval(iv);
        setLoading(false);
        setLoadedModel(name);
        setVram(72);
        addLog('ok', `✓ "${name.toUpperCase()}" CHARGÉ`);
        addLog('ok', '✓ INFERENCE ENGINE ARMED');
      }
      setProgress(p);
    }, 280);
  };

  const logColor = (type) => {
    if (type === 'ok') return C.neonGreen;
    if (type === 'warn') return C.neonOrange;
    return C.neonBlue;
  };

  const glowStyle = {
    opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
    transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] }) }],
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: 20 }}>
      {/* METRICS */}
      <View style={s.section}>
        <SectionLabel text="⚡ SYSTEM METRICS" />
        <View style={s.metricsRow}>
          <MetricCard label="RAM GB FREE" value={ram} color={C.neonGreen} />
          <MetricCard label="TOK/SEC"     value={tok}  color={C.neonBlue} />
          <MetricCard label="CPU LOAD"    value={cpu}  color={C.neonPurple} />
        </View>
      </View>

      {/* MODEL CARD */}
      <View style={s.section}>
        <SectionLabel text="🔗 MODÈLE ACTIF" />
        <Animated.View style={[s.modelCard, loadedModel && s.modelCardLoaded, loadedModel && glowStyle]}>
          <View style={s.modelHeader}>
            <Text style={s.modelName} numberOfLines={1}>
              {loadedModel ? loadedModel.toUpperCase() : '── AUCUN MODÈLE ──'}
            </Text>
            <View style={[s.badge, loadedModel ? s.badgeGreen : s.badgeOrange]}>
              <Text style={[s.badgeText, { color: loadedModel ? C.neonGreen : C.neonOrange }]}>
                {loadedModel ? 'LOADED' : 'OFFLINE'}
              </Text>
            </View>
          </View>

          {loadedModel && (
            <View style={s.statsRow}>
              <StatItem label="PARAMS" value="9B" />
              <StatItem label="QUANT"  value="Q6K" />
              <StatItem label="CTX"    value="4K" />
            </View>
          )}

          <View style={s.progressWrap}>
            <View style={s.progressInfo}>
              <Text style={s.progressLabel}>VRAM USAGE</Text>
              <Text style={s.progressLabel}>{vram}%</Text>
            </View>
            <View style={s.progressBar}>
              <View style={[s.progressFill, { width: `${vram}%` }]} />
            </View>
          </View>

          {loading && (
            <View style={s.progressWrap}>
              <Text style={[s.progressLabel, { color: C.neonCyan }]}>CHARGEMENT... {progress}%</Text>
              <View style={s.progressBar}>
                <View style={[s.progressFill, { width: `${progress}%`, backgroundColor: C.neonCyan }]} />
              </View>
            </View>
          )}
        </Animated.View>
      </View>

      {/* ACTIONS */}
      <View style={s.section}>
        <SectionLabel text="⚙️ ACTIONS RAPIDES" />
        <View style={s.actionGrid}>
          <ActionBtn icon="📦" label="CHARGER\nMODÈLE" sub="GGUF LOCAL" onPress={pickGgufFile} primary />
          <ActionBtn icon="⚡" label="QWEN3.5\nDÉFAUT" sub="Chemin pré-config" onPress={loadDefaultModel} />
          <ActionBtn icon="💬" label="CHAT\nINFÉRENCE" sub="Session active" onPress={() => navigation.navigate('Chat', { modelName: loadedModel })} />
          <ActionBtn icon="🛠️" label="GUIDE\nSETUP" sub="Termux + llama.cpp" onPress={() => navigation.navigate('Setup')} />
        </View>
      </View>

      {/* TERMINAL LOG */}
      <View style={s.section}>
        <SectionLabel text="🟦 SYSTEM LOG" />
        <ScrollView ref={logScrollRef} style={s.terminal} nestedScrollEnabled>
          {logs.map((l, i) => (
            <View key={i} style={s.logLine}>
              <Text style={s.logTime}>{l.t}</Text>
              <Text style={[s.logMsg, { color: logColor(l.type) }]}>{l.msg}</Text>
            </View>
          ))}
          <Text style={[s.logMsg, { color: C.neonGreen }]}>▶ <Text style={s.cursor}>█</Text></Text>
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const SectionLabel = ({ text }) => (
  <View style={s.sectionLabel}>
    <Text style={s.sectionLabelText}>{text}</Text>
    <View style={s.sectionLine} />
  </View>
);

const MetricCard = ({ label, value, color }) => (
  <View style={s.metricCard}>
    <Text style={[s.metricVal, { color }]}>{value}</Text>
    <Text style={s.metricLabel}>{label}</Text>
  </View>
);

const StatItem = ({ label, value }) => (
  <View style={s.statItem}>
    <Text style={s.statVal}>{value}</Text>
    <Text style={s.statKey}>{label}</Text>
  </View>
);

const ActionBtn = ({ icon, label, sub, onPress, primary }) => (
  <TouchableOpacity
    style={[s.actionBtn, primary && s.actionBtnPrimary]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={s.actionIcon}>{icon}</Text>
    <Text style={[s.actionLabel, primary && { color: C.neonGreen }]}>{label}</Text>
    <Text style={s.actionSub}>{sub}</Text>
  </TouchableOpacity>
);

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.bgDeep },
  section:       { paddingHorizontal: 14, paddingTop: 14 },
  sectionLabel:  { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionLabelText: { fontFamily: 'monospace', fontSize: 10, color: C.textDim, letterSpacing: 3 },
  sectionLine:   { flex: 1, height: 1, backgroundColor: C.borderDim, marginLeft: 8 },
  metricsRow:    { flexDirection: 'row', gap: 10 },
  metricCard:    { flex: 1, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.borderDim, borderRadius: 10, padding: 12, alignItems: 'center' },
  metricVal:     { fontSize: 16, fontWeight: '900', fontFamily: 'monospace', marginBottom: 4 },
  metricLabel:   { fontFamily: 'monospace', fontSize: 8, color: C.textDim, letterSpacing: 1 },
  modelCard:     { backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.borderDim, borderRadius: 12, padding: 14 },
  modelCardLoaded: { borderColor: 'rgba(0,255,136,0.4)', backgroundColor: 'rgba(0,255,136,0.03)' },
  modelHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modelName:     { fontSize: 13, fontWeight: '700', color: C.textPrimary, flex: 1, marginRight: 8 },
  badge:         { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  badgeGreen:    { backgroundColor: 'rgba(0,255,136,0.1)', borderColor: 'rgba(0,255,136,0.3)' },
  badgeOrange:   { backgroundColor: 'rgba(255,107,0,0.1)', borderColor: 'rgba(255,107,0,0.3)' },
  badgeText:     { fontFamily: 'monospace', fontSize: 9, letterSpacing: 1 },
  statsRow:      { flexDirection: 'row', gap: 8, marginBottom: 10 },
  statItem:      { flex: 1, backgroundColor: 'rgba(0,212,255,0.03)', borderWidth: 1, borderColor: C.borderDim, borderRadius: 8, padding: 8, alignItems: 'center' },
  statVal:       { fontSize: 13, fontWeight: '700', color: C.neonBlue, fontFamily: 'monospace' },
  statKey:       { fontFamily: 'monospace', fontSize: 8, color: C.textDim, marginTop: 2 },
  progressWrap:  { marginTop: 8 },
  progressInfo:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel: { fontFamily: 'monospace', fontSize: 9, color: C.textDim },
  progressBar:   { height: 4, backgroundColor: 'rgba(0,212,255,0.1)', borderRadius: 2, overflow: 'hidden' },
  progressFill:  { height: '100%', backgroundColor: C.neonBlue, borderRadius: 2 },
  actionGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn:     { width: '47%', backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.borderDim, borderRadius: 12, padding: 14, alignItems: 'center', gap: 6 },
  actionBtnPrimary: { borderColor: 'rgba(0,255,136,0.3)', backgroundColor: 'rgba(0,255,136,0.04)' },
  actionIcon:    { fontSize: 24 },
  actionLabel:   { fontFamily: 'monospace', fontSize: 10, fontWeight: '700', color: C.neonBlue, letterSpacing: 1, textAlign: 'center' },
  actionSub:     { fontFamily: 'monospace', fontSize: 8, color: C.textDim, textAlign: 'center' },
  terminal:      { backgroundColor: '#010a06', borderWidth: 1, borderColor: 'rgba(0,255,136,0.2)', borderRadius: 12, padding: 12, maxHeight: 160 },
  logLine:       { flexDirection: 'row', gap: 10, marginBottom: 2 },
  logTime:       { fontFamily: 'monospace', fontSize: 10, color: C.textDim, flexShrink: 0 },
  logMsg:        { fontFamily: 'monospace', fontSize: 10, flex: 1 },
  cursor:        { color: C.neonGreen },
});

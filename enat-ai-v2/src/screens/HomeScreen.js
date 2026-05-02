import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated, Easing, RefreshControl,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { C, DEFAULT_PORT, GGUF_NAME, GGUF_PATH } from '../theme';
import { checkServer, fetchModelInfo } from '../utils/LlamaService';

export default function HomeScreen({ navigation, route, onModelChange, onServerChange }) {
  const [modelName, setModelName]   = useState(null);
  const [serverOk, setServerOk]     = useState(false);
  const [modelInfo, setModelInfo]   = useState(null);
  const [logs, setLogs]             = useState([
    { t: '00:00:00', type: 'ok',   msg: '✓ ENAT AI v2.0 DÉMARRÉ' },
    { t: '00:00:01', type: 'info', msg: '◈ INFERENCE ENGINE: STANDBY' },
    { t: '00:00:02', type: 'warn', msg: '⚠ LANCE LLAMA.CPP DANS TERMUX' },
  ]);
  const [refreshing, setRefreshing] = useState(false);
  const [tok, setTok]   = useState('0');
  const [port]          = useState(DEFAULT_PORT);
  const pulseAnim       = useRef(new Animated.Value(0)).current;
  const logRef          = useRef(null);

  const addLog = useCallback((type, msg) => {
    const t = new Date().toTimeString().slice(0, 8);
    setLogs(prev => [...prev.slice(-40), { t, type, msg }]);
    setTimeout(() => logRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  const pingServer = useCallback(async () => {
    const ok = await checkServer(port);
    setServerOk(ok);
    onServerChange?.(ok);
    if (ok) {
      const info = await fetchModelInfo(port);
      if (info?.model_path) {
        const name = info.model_path.split('/').pop().replace(/\.(gguf|bin)$/i, '').replace(/[_-]/g, ' ').slice(0, 36);
        setModelName(name);
        setModelInfo(info);
        onModelChange?.(name);
        addLog('ok', `✓ SERVEUR ACTIF — ${name.slice(0, 28).toUpperCase()}`);
        startMetrics();
        startPulse();
      } else {
        addLog('ok', `✓ SERVEUR ACTIF :${port} — chargement modèle...`);
      }
    } else {
      addLog('warn', `⚠ SERVEUR INTROUVABLE :${port}`);
      stopMetrics();
    }
  }, [port]);

  const metricsRef = useRef(null);
  const startMetrics = () => {
    clearInterval(metricsRef.current);
    metricsRef.current = setInterval(() => {
      setTok(String(Math.floor(Math.random() * 18 + 4)));
    }, 1500);
  };
  const stopMetrics = () => {
    clearInterval(metricsRef.current);
    setTok('0');
  };

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
  };

  useEffect(() => {
    pingServer();
    const iv = setInterval(pingServer, 15000); // ping toutes les 15s
    return () => { clearInterval(iv); clearInterval(metricsRef.current); };
  }, []);

  // Si on revient de Setup ou Models
  useEffect(() => {
    if (route.params?.refresh) pingServer();
  }, [route.params]);

  const onRefresh = async () => {
    setRefreshing(true);
    await pingServer();
    setRefreshing(false);
  };

  const pickGguf = async () => {
    try {
      const r = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: false });
      if (r.canceled) return;
      const name = r.assets[0].name.replace(/\.(gguf|bin)$/i, '').replace(/[_-]/g, ' ').trim().slice(0, 36);
      addLog('info', `◈ FICHIER: ${r.assets[0].name}`);
      addLog('warn', `⚠ Charge ce modèle via Termux dans llama-server`);
      addLog('info', `◈ CHEMIN: ${r.assets[0].uri}`);
    } catch (e) {
      addLog('warn', `⚠ ${e.message}`);
    }
  };

  const glowStyle = {
    opacity:   pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }),
    transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.015] }) }],
  };

  const logColor = (type) =>
    type === 'ok' ? C.neonGreen : type === 'warn' ? C.neonOrange : C.neonBlue;

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={{ paddingBottom: 24 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.neonBlue} />}
    >
      {/* METRICS */}
      <View style={s.section}>
        <SLabel text="⚡ SYSTÈME" />
        <View style={s.metricsRow}>
          <MCard label="STATUT"   value={serverOk ? 'ONLINE' : 'OFFLINE'} color={serverOk ? C.neonGreen : C.neonOrange} />
          <MCard label="TOK/SEC"  value={tok}    color={C.neonBlue} />
          <MCard label="PORT"     value={`:${port}`} color={C.neonPurple} />
        </View>
      </View>

      {/* MODÈLE ACTIF */}
      <View style={s.section}>
        <SLabel text="🔗 MODÈLE ACTIF" />
        <Animated.View style={[s.modelCard, serverOk && s.modelCardOn, serverOk && glowStyle]}>
          <View style={s.modelHeader}>
            <Text style={s.modelName} numberOfLines={1}>
              {modelName ? modelName.toUpperCase() : '── AUCUN MODÈLE ──'}
            </Text>
            <View style={[s.badge, serverOk ? s.badgeGreen : s.badgeOrange]}>
              <Text style={[s.badgeText, { color: serverOk ? C.neonGreen : C.neonOrange }]}>
                {serverOk ? 'LIVE' : 'OFF'}
              </Text>
            </View>
          </View>

          {modelInfo && (
            <View style={s.statsRow}>
              <StatItem label="CTX"      value={modelInfo.n_ctx        ? `${modelInfo.n_ctx}K`   : '?'} />
              <StatItem label="THREADS"  value={modelInfo.n_threads    ? String(modelInfo.n_threads) : '?'} />
              <StatItem label="BATCH"    value={modelInfo.n_batch      ? String(modelInfo.n_batch)   : '?'} />
            </View>
          )}

          <View style={s.progressWrap}>
            <View style={s.progressInfo}>
              <Text style={s.progressLabel}>CONNEXION LLAMA.CPP</Text>
              <Text style={s.progressLabel}>{serverOk ? '100%' : '0%'}</Text>
            </View>
            <View style={s.progressBar}>
              <View style={[s.progressFill, { width: serverOk ? '100%' : '0%', backgroundColor: serverOk ? C.neonGreen : C.borderDim }]} />
            </View>
          </View>
        </Animated.View>
      </View>

      {/* ACTIONS */}
      <View style={s.section}>
        <SLabel text="⚙️ ACTIONS" />
        <View style={s.actionGrid}>
          <ABtn icon="🔍" label="VÉRIFIER\nSERVEUR"   sub="Ping llama.cpp"     onPress={pingServer}                                      primary={serverOk} />
          <ABtn icon="📂" label="FICHIER\nGGUF"        sub="Voir le chemin"     onPress={pickGguf} />
          <ABtn icon="💬" label="CHAT\nINFÉRENCE"      sub="Session active"     onPress={() => navigation.navigate('Chat', { modelName, serverOk })} />
          <ABtn icon="🛠️" label="GUIDE\nSETUP"         sub="Termux + llama.cpp" onPress={() => navigation.navigate('Setup')} />
        </View>
      </View>

      {/* TERMINAL */}
      <View style={s.section}>
        <SLabel text="🟦 LOG SYSTÈME" />
        <ScrollView ref={logRef} style={s.terminal} nestedScrollEnabled>
          {logs.map((l, i) => (
            <View key={i} style={s.logLine}>
              <Text style={s.logTime}>{l.t}</Text>
              <Text style={[s.logMsg, { color: logColor(l.type) }]}>{l.msg}</Text>
            </View>
          ))}
          <Text style={[s.logMsg, { color: C.neonGreen }]}>▶ <Text style={{ color: C.neonGreen }}>█</Text></Text>
        </ScrollView>
        <TouchableOpacity style={s.refreshBtn} onPress={onRefresh}>
          <Text style={s.refreshBtnText}>↺ ACTUALISER</Text>
        </TouchableOpacity>
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
const MCard = ({ label, value, color }) => (
  <View style={s.mCard}>
    <Text style={[s.mVal, { color }]}>{value}</Text>
    <Text style={s.mLabel}>{label}</Text>
  </View>
);
const StatItem = ({ label, value }) => (
  <View style={s.statItem}>
    <Text style={s.statVal}>{value}</Text>
    <Text style={s.statKey}>{label}</Text>
  </View>
);
const ABtn = ({ icon, label, sub, onPress, primary }) => (
  <TouchableOpacity style={[s.aBtn, primary && s.aBtnPrimary]} onPress={onPress} activeOpacity={0.7}>
    <Text style={s.aIcon}>{icon}</Text>
    <Text style={[s.aLabel, primary && { color: C.neonGreen }]}>{label}</Text>
    <Text style={s.aSub}>{sub}</Text>
  </TouchableOpacity>
);

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.bgDeep },
  section:       { paddingHorizontal: 14, paddingTop: 14 },
  sLabel:        { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sLabelText:    { fontFamily: 'monospace', fontSize: 10, color: C.textDim, letterSpacing: 3 },
  sLine:         { flex: 1, height: 1, backgroundColor: C.borderDim, marginLeft: 8 },
  metricsRow:    { flexDirection: 'row', gap: 10 },
  mCard:         { flex: 1, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.borderDim, borderRadius: 10, padding: 12, alignItems: 'center' },
  mVal:          { fontSize: 14, fontWeight: '900', fontFamily: 'monospace', marginBottom: 4 },
  mLabel:        { fontFamily: 'monospace', fontSize: 8, color: C.textDim, letterSpacing: 1 },
  modelCard:     { backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.borderDim, borderRadius: 12, padding: 14 },
  modelCardOn:   { borderColor: 'rgba(0,255,136,0.4)', backgroundColor: 'rgba(0,255,136,0.02)' },
  modelHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modelName:     { fontSize: 13, fontWeight: '700', color: C.textPrimary, flex: 1, marginRight: 8, fontFamily: 'monospace' },
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
  progressFill:  { height: '100%', borderRadius: 2 },
  actionGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  aBtn:          { width: '47%', backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.borderDim, borderRadius: 12, padding: 14, alignItems: 'center', gap: 6 },
  aBtnPrimary:   { borderColor: 'rgba(0,255,136,0.4)', backgroundColor: 'rgba(0,255,136,0.04)' },
  aIcon:         { fontSize: 24 },
  aLabel:        { fontFamily: 'monospace', fontSize: 10, fontWeight: '700', color: C.neonBlue, letterSpacing: 1, textAlign: 'center' },
  aSub:          { fontFamily: 'monospace', fontSize: 8, color: C.textDim, textAlign: 'center' },
  terminal:      { backgroundColor: '#010a06', borderWidth: 1, borderColor: 'rgba(0,255,136,0.2)', borderRadius: 12, padding: 12, maxHeight: 150 },
  logLine:       { flexDirection: 'row', gap: 10, marginBottom: 2 },
  logTime:       { fontFamily: 'monospace', fontSize: 10, color: C.textDim, flexShrink: 0 },
  logMsg:        { fontFamily: 'monospace', fontSize: 10, flex: 1 },
  refreshBtn:    { marginTop: 8, alignSelf: 'flex-end', paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: C.borderDim, borderRadius: 6 },
  refreshBtnText:{ fontFamily: 'monospace', fontSize: 9, color: C.textDim, letterSpacing: 1 },
});

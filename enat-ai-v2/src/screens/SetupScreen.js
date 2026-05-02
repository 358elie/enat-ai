import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { C, DEFAULT_PORT, DEFAULT_THREADS, DEFAULT_CTX, DEFAULT_BATCH } from '../theme';
import { checkServer, buildLlamaCommand } from '../utils/LlamaService';

export default function SetupScreen({ navigation }) {
  const [serverOk,  setServerOk]  = useState(null);
  const [checking,  setChecking]  = useState(false);
  const [modelPath, setModelPath] = useState('/storage/emulated/0/Download/ton-modele.gguf');
  const [threads,   setThreads]   = useState(DEFAULT_THREADS);
  const [ctx,       setCtx]       = useState(DEFAULT_CTX);
  const [batch,     setBatch]     = useState(DEFAULT_BATCH);
  const [gpu,       setGpu]       = useState(0);

  const launchCmd = buildLlamaCommand({
    modelPath, port: DEFAULT_PORT,
    threads, ctx, batch, gpuLayers: gpu,
  });

  const copy = async (text, label = 'Copié !') => {
    await Clipboard.setStringAsync(text);
    Alert.alert('✓ ' + label, 'Collé dans le presse-papier');
  };

  const ping = async () => {
    setChecking(true);
    setServerOk(null);
    const ok = await checkServer(DEFAULT_PORT);
    setServerOk(ok);
    setChecking(false);
  };

  const steps = [
    {
      num: '1', color: C.neonGreen, title: 'INSTALLER TERMUX (F-DROID)',
      body: '⚠️ PAS le Play Store — version trop vieille.\n\nhttps://f-droid.org → cherche "Termux"',
      cmds: [],
    },
    {
      num: '2', color: C.neonBlue, title: 'SETUP TERMUX',
      body: 'Dans Termux, dans l\'ordre :',
      cmds: [
        { label: 'Mise à jour',           cmd: 'pkg update -y && pkg upgrade -y' },
        { label: 'Outils compilation',    cmd: 'pkg install clang cmake git -y' },
        { label: 'Accès stockage',        cmd: 'termux-setup-storage' },
      ],
    },
    {
      num: '3', color: C.neonPurple, title: 'COMPILER LLAMA.CPP',
      body: '⏱ Prend 10–25 min selon ton CPU.\n✅ Branche ton téléphone !',
      cmds: [
        { label: 'Cloner',      cmd: 'git clone https://github.com/ggml-org/llama.cpp' },
        { label: 'Configurer', cmd: 'cd llama.cpp && cmake -B build -DLLAMA_CURL=OFF' },
        { label: 'Compiler',   cmd: 'cmake --build build --config Release -j$(nproc)' },
      ],
    },
    {
      num: '4', color: C.neonGreen, title: 'LANCER LE SERVEUR ⚡',
      body: '▸ Commande optimisée pour les gros modèles :\n(appuie pour copier)',
      cmds: [{ label: '▸ COMMANDE COMPLÈTE', cmd: launchCmd, highlight: true }],
      note: '✓ Attends "llama server listening"\n✓ Garde Termux en arrière-plan\n✓ Reviens dans ENAT AI → Chat ⚡ STREAM',
    },
    {
      num: '5', color: C.neonOrange, title: 'OPTIMISATIONS GROS GGUF',
      body:
        '--flash-attn      → +30% vitesse\n' +
        '--mlock           → garde en RAM (évite swap)\n' +
        '--cont-batching   → multi-requêtes\n' +
        '--ctx-size 2048   → si RAM insuffisante\n' +
        '--batch-size 256  → réduit si crash\n\n' +
        'Q6_K → ~7.5 GB RAM\n' +
        'Q4_K → ~4.5 GB RAM ← recommandé 6 GB\n' +
        'Q3_K → ~3.5 GB RAM ← si < 6 GB',
      cmds: [],
    },
  ];

  return (
    <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: 30 }}>
      {/* STATUS SERVEUR */}
      <View style={s.statusCard}>
        <Text style={s.statusTitle}>⚡ ÉTAT DU SERVEUR :{DEFAULT_PORT}</Text>
        <Text style={[s.statusText, {
          color: serverOk === null ? C.textDim : serverOk ? C.neonGreen : C.neonOrange
        }]}>
          {serverOk === null ? '◈ Non vérifié'
            : serverOk ? `✅ ACTIF — Prêt pour l'inférence !`
            : `🔴 INTROUVABLE — Lance llama-server d'abord`}
        </Text>
        <TouchableOpacity style={s.checkBtn} onPress={ping} disabled={checking}>
          <Text style={s.checkBtnText}>{checking ? '◈ Vérification...' : '🔍 VÉRIFIER'}</Text>
        </TouchableOpacity>
      </View>

      {/* CONFIG RAPIDE */}
      <View style={s.configCard}>
        <Text style={s.configTitle}>⚙️ CONFIG COMMANDE</Text>
        <Text style={s.configSub}>Threads CPU</Text>
        <View style={s.btnRow}>
          {[2,4,6,8].map(v => (
            <TouchableOpacity key={v} style={[s.cfgBtn, threads===v && s.cfgBtnActive]} onPress={() => setThreads(v)}>
              <Text style={[s.cfgBtnText, threads===v && { color: C.neonBlue }]}>{v}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={s.configSub}>Context Size</Text>
        <View style={s.btnRow}>
          {[2048,4096,8192,16384].map(v => (
            <TouchableOpacity key={v} style={[s.cfgBtn, ctx===v && s.cfgBtnActive]} onPress={() => setCtx(v)}>
              <Text style={[s.cfgBtnText, ctx===v && { color: C.neonBlue }]}>{v/1024}K</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={s.configSub}>Batch Size</Text>
        <View style={s.btnRow}>
          {[128,256,512,1024].map(v => (
            <TouchableOpacity key={v} style={[s.cfgBtn, batch===v && s.cfgBtnActive]} onPress={() => setBatch(v)}>
              <Text style={[s.cfgBtnText, batch===v && { color: C.neonBlue }]}>{v}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={s.configSub}>GPU Layers</Text>
        <View style={s.btnRow}>
          {[0,8,16,32].map(v => (
            <TouchableOpacity key={v} style={[s.cfgBtn, gpu===v && s.cfgBtnActive]} onPress={() => setGpu(v)}>
              <Text style={[s.cfgBtnText, gpu===v && { color: C.neonBlue }]}>{v===0?'CPU':v}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* STEPS */}
      {steps.map(step => (
        <View key={step.num} style={[s.stepCard, { borderColor: step.color + '33' }]}>
          <View style={s.stepHeader}>
            <View style={[s.stepNum, { borderColor: step.color, backgroundColor: step.color + '22' }]}>
              <Text style={[s.stepNumText, { color: step.color }]}>{step.num}</Text>
            </View>
            <Text style={[s.stepTitle, { color: step.color }]}>{step.title}</Text>
          </View>
          <Text style={s.stepBody}>{step.body}</Text>
          {step.cmds.map((c, i) => (
            <TouchableOpacity
              key={i}
              style={[s.cmdBlock, c.highlight && s.cmdBlockHL]}
              onPress={() => copy(c.cmd, c.label)}
              activeOpacity={0.7}
            >
              <Text style={s.cmdLabel}>{c.label}</Text>
              <Text style={[s.cmdText, c.highlight && { color: C.neonGreen, fontSize: 9 }]}>{c.cmd}</Text>
              <Text style={s.cmdCopy}>TAP = COPIER</Text>
            </TouchableOpacity>
          ))}
          {step.note && (
            <View style={s.noteBox}>
              <Text style={s.noteText}>{step.note}</Text>
            </View>
          )}
        </View>
      ))}

      <View style={{ paddingHorizontal: 14 }}>
        <TouchableOpacity style={s.goBtn} onPress={() => { ping(); navigation.navigate('Chat', {}); }}>
          <Text style={s.goBtnText}>⚡ VÉRIFIER & ALLER AU CHAT</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bgDeep },
  statusCard:  { margin: 14, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.borderDim, borderRadius: 12, padding: 14 },
  statusTitle: { fontFamily: 'monospace', fontSize: 11, color: C.neonBlue, letterSpacing: 1, marginBottom: 8 },
  statusText:  { fontFamily: 'monospace', fontSize: 11, marginBottom: 10, lineHeight: 16 },
  checkBtn:    { backgroundColor: 'rgba(0,212,255,0.08)', borderWidth: 1, borderColor: 'rgba(0,212,255,0.4)', borderRadius: 8, padding: 10, alignItems: 'center' },
  checkBtnText:{ fontFamily: 'monospace', fontSize: 11, color: C.neonBlue, letterSpacing: 1 },
  configCard:  { marginHorizontal: 14, marginBottom: 10, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.borderDim, borderRadius: 12, padding: 14 },
  configTitle: { fontFamily: 'monospace', fontSize: 11, color: C.neonCyan, letterSpacing: 1, marginBottom: 10 },
  configSub:   { fontFamily: 'monospace', fontSize: 9, color: C.textDim, letterSpacing: 1, marginBottom: 6, marginTop: 10 },
  btnRow:      { flexDirection: 'row', gap: 8 },
  cfgBtn:      { flex: 1, padding: 8, borderWidth: 1, borderColor: C.borderDim, borderRadius: 8, alignItems: 'center', backgroundColor: 'rgba(0,212,255,0.03)' },
  cfgBtnActive:{ backgroundColor: 'rgba(0,212,255,0.15)', borderColor: 'rgba(0,212,255,0.4)' },
  cfgBtnText:  { fontFamily: 'monospace', fontSize: 10, color: C.textDim },
  stepCard:    { marginHorizontal: 14, marginBottom: 10, backgroundColor: C.bgCard, borderWidth: 1, borderRadius: 12, padding: 14 },
  stepHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  stepNum:     { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontFamily: 'monospace', fontSize: 12, fontWeight: '900' },
  stepTitle:   { fontFamily: 'monospace', fontSize: 11, fontWeight: '700', letterSpacing: 1, flex: 1 },
  stepBody:    { fontFamily: 'monospace', fontSize: 10, color: C.textPrimary, lineHeight: 17, marginBottom: 10 },
  cmdBlock:    { backgroundColor: '#010a06', borderWidth: 1, borderColor: 'rgba(0,255,136,0.25)', borderRadius: 8, padding: 10, marginBottom: 8 },
  cmdBlockHL:  { borderColor: 'rgba(0,255,136,0.6)', borderWidth: 2 },
  cmdLabel:    { fontFamily: 'monospace', fontSize: 9, color: C.textDim, marginBottom: 4 },
  cmdText:     { fontFamily: 'monospace', fontSize: 10, color: C.neonGreen, lineHeight: 16 },
  cmdCopy:     { fontFamily: 'monospace', fontSize: 8, color: C.textDim, marginTop: 4, textAlign: 'right' },
  noteBox:     { backgroundColor: 'rgba(0,255,136,0.05)', borderWidth: 1, borderColor: 'rgba(0,255,136,0.2)', borderRadius: 8, padding: 10, marginTop: 4 },
  noteText:    { fontFamily: 'monospace', fontSize: 10, color: C.neonCyan, lineHeight: 17 },
  goBtn:       { backgroundColor: 'rgba(0,255,136,0.1)', borderWidth: 1, borderColor: 'rgba(0,255,136,0.4)', borderRadius: 10, padding: 13, alignItems: 'center', marginTop: 4 },
  goBtnText:   { fontFamily: 'monospace', fontSize: 12, color: C.neonGreen, letterSpacing: 2, fontWeight: '700' },
});

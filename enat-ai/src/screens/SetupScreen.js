import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { C, LLAMA_PORT } from '../theme';

const GGUF = '/storage/emulated/0/Download/Qwen3.5-9B-Uncensored-HauhauCS-Aggressive-Q6_K.gguf';
const CMD_LAUNCH = `cd llama.cpp && ./build/bin/llama-server -m ${GGUF} --host 127.0.0.1 --port ${LLAMA_PORT} --ctx-size 4096 --n-predict 1024 --threads 4`;

const steps = [
  {
    num: '1', color: C.neonGreen,
    title: 'INSTALLER TERMUX',
    body: 'Depuis F-Droid (pas le Play Store — version trop ancienne).\n\n▸ https://f-droid.org → "Termux"',
    cmd: null,
  },
  {
    num: '2', color: C.neonBlue,
    title: 'SETUP TERMUX',
    body: 'Dans Termux, dans l\'ordre :',
    cmds: [
      { label: 'Mise à jour packages', cmd: 'pkg update -y && pkg upgrade -y' },
      { label: 'Outils compilation', cmd: 'pkg install clang cmake git -y' },
      { label: 'Accès stockage (IMPORTANT)', cmd: 'termux-setup-storage' },
    ],
  },
  {
    num: '3', color: C.neonPurple,
    title: 'COMPILER LLAMA.CPP',
    body: '⚠ Prend 10-20 min. Branche ton téléphone.',
    cmds: [
      { label: 'Cloner le repo', cmd: 'git clone https://github.com/ggml-org/llama.cpp' },
      { label: 'Configurer', cmd: 'cd llama.cpp && cmake -B build -DLLAMA_CURL=OFF' },
      { label: 'Compiler (lent)', cmd: 'cmake --build build --config Release -j$(nproc)' },
    ],
  },
  {
    num: '4', color: C.neonGreen,
    title: 'LANCER TON MODÈLE ⚡',
    body: 'Commande exacte pour ton GGUF — tape dans Termux depuis le dossier llama.cpp :',
    cmds: [
      {
        label: '▸ COMMANDE COMPLÈTE (tap pour copier)',
        cmd: CMD_LAUNCH,
        highlight: true,
      },
    ],
    note: '✓ Attends "llama server listening on 127.0.0.1:8080"\n✓ Garde Termux ouvert en arrière-plan\n✓ Reviens dans ENAT AI → Chat → ⚡ LOCAL → envoie !',
  },
  {
    num: '5', color: C.neonOrange,
    title: 'TIPS PERFORMANCE',
    body: '--threads 4     → 4 cœurs CPU\n--ctx-size 2048 → si RAM insuffisante\n--n-gpu-layers 0 → CPU only (stable)\n\nTon Q6_K nécessite ~7.5 GB RAM\nSi ça crash : utilise Q4_K ou Q5_K',
    cmd: null,
  },
];

export default function SetupScreen({ navigation }) {
  const [serverOk, setServerOk] = useState(null);
  const [checking, setChecking] = useState(false);

  const copy = async (cmd, label) => {
    await Clipboard.setStringAsync(cmd);
    Alert.alert('✓ Copié !', label || 'Commande copiée dans le presse-papier');
  };

  const checkServer = async () => {
    setChecking(true);
    setServerOk(null);
    try {
      const res = await fetch(`http://127.0.0.1:${LLAMA_PORT}/health`, {
        signal: AbortSignal.timeout(3000),
      });
      setServerOk(res.ok);
    } catch {
      setServerOk(false);
    } finally {
      setChecking(false);
    }
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: 30 }}>
      {/* SERVER STATUS */}
      <View style={s.statusCard}>
        <Text style={s.statusTitle}>⚡ ÉTAT DU SERVEUR LOCAL</Text>
        <Text style={[s.statusText, {
          color: serverOk === null ? C.textDim : serverOk ? C.neonGreen : C.neonOrange
        }]}>
          {serverOk === null ? '◈ Non vérifié'
            : serverOk ? `✅ SERVEUR ACTIF :${LLAMA_PORT} — Prêt !`
            : `🔴 Introuvable sur :${LLAMA_PORT} — Lance llama-server d'abord`}
        </Text>
        <TouchableOpacity style={s.checkBtn} onPress={checkServer} disabled={checking}>
          <Text style={s.checkBtnText}>{checking ? '◈ Vérification...' : '🔍 VÉRIFIER CONNEXION'}</Text>
        </TouchableOpacity>
      </View>

      {/* STEPS */}
      {steps.map((step) => (
        <View key={step.num} style={[s.stepCard, { borderColor: step.color + '33' }]}>
          <View style={s.stepHeader}>
            <View style={[s.stepNum, { borderColor: step.color, backgroundColor: step.color + '22' }]}>
              <Text style={[s.stepNumText, { color: step.color }]}>{step.num}</Text>
            </View>
            <Text style={[s.stepTitle, { color: step.color }]}>{step.title}</Text>
          </View>

          <Text style={s.stepBody}>{step.body}</Text>

          {step.cmds?.map((c, i) => (
            <TouchableOpacity
              key={i}
              style={[s.cmdBlock, c.highlight && s.cmdBlockHighlight]}
              onPress={() => copy(c.cmd, c.label)}
              activeOpacity={0.7}
            >
              <Text style={s.cmdLabel}>{c.label}</Text>
              <Text style={[s.cmdText, c.highlight && { color: C.neonGreen }]}>{c.cmd}</Text>
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

      {/* GO TO CHAT */}
      <View style={{ paddingHorizontal: 14 }}>
        <TouchableOpacity
          style={s.goBtn}
          onPress={() => { checkServer(); navigation.navigate('Chat', {}); }}
        >
          <Text style={s.goBtnText}>⚡ VÉRIFIER & ALLER AU CHAT</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: C.bgDeep },
  statusCard: { margin: 14, backgroundColor: C.bgCard, borderWidth: 1, borderColor: C.borderDim, borderRadius: 12, padding: 14 },
  statusTitle: { fontFamily: 'monospace', fontSize: 11, color: C.neonBlue, letterSpacing: 1, marginBottom: 8 },
  statusText:  { fontFamily: 'monospace', fontSize: 11, marginBottom: 10, lineHeight: 16 },
  checkBtn:    { backgroundColor: 'rgba(0,212,255,0.08)', borderWidth: 1, borderColor: 'rgba(0,212,255,0.4)', borderRadius: 8, padding: 10, alignItems: 'center' },
  checkBtnText: { fontFamily: 'monospace', fontSize: 11, color: C.neonBlue, letterSpacing: 1 },
  stepCard:  { marginHorizontal: 14, marginBottom: 10, backgroundColor: C.bgCard, borderWidth: 1, borderRadius: 12, padding: 14 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  stepNum:   { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontFamily: 'monospace', fontSize: 12, fontWeight: '900' },
  stepTitle: { fontFamily: 'monospace', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  stepBody:  { fontFamily: 'monospace', fontSize: 10, color: C.textPrimary, lineHeight: 17, marginBottom: 10 },
  cmdBlock:  { backgroundColor: '#010a06', borderWidth: 1, borderColor: 'rgba(0,255,136,0.25)', borderRadius: 8, padding: 10, marginBottom: 8 },
  cmdBlockHighlight: { borderColor: 'rgba(0,255,136,0.6)', borderWidth: 2 },
  cmdLabel:  { fontFamily: 'monospace', fontSize: 9, color: C.textDim, marginBottom: 4 },
  cmdText:   { fontFamily: 'monospace', fontSize: 10, color: C.neonGreen, lineHeight: 16 },
  cmdCopy:   { fontFamily: 'monospace', fontSize: 8, color: C.textDim, marginTop: 4, textAlign: 'right' },
  noteBox:   { backgroundColor: 'rgba(0,255,136,0.05)', borderWidth: 1, borderColor: 'rgba(0,255,136,0.2)', borderRadius: 8, padding: 10, marginTop: 4 },
  noteText:  { fontFamily: 'monospace', fontSize: 10, color: C.neonCyan, lineHeight: 17 },
  goBtn:     { backgroundColor: 'rgba(0,255,136,0.1)', borderWidth: 1, borderColor: 'rgba(0,255,136,0.4)', borderRadius: 10, padding: 13, alignItems: 'center', marginTop: 4 },
  goBtnText: { fontFamily: 'monospace', fontSize: 12, color: C.neonGreen, letterSpacing: 2, fontWeight: '700' },
});

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { C, DEFAULT_PORT, GGUF_NAME, MAX_TOKENS, DEFAULT_TEMP } from '../theme';
import { streamChat } from '../utils/LlamaService';

const SYSTEM_PROMPT = (model) =>
  `Tu es ${model || 'ENAT AI'}, un assistant IA local puissant tournant sur llama.cpp. Réponds de façon précise et complète. Si l'utilisateur écrit en français, réponds en français.`;

let abortCurrentRequest = null;

export default function ChatScreen({ route }) {
  const modelName  = route?.params?.modelName || GGUF_NAME;
  const serverOk   = route?.params?.serverOk  || false;
  const [port]     = useState(DEFAULT_PORT);
  const [messages, setMessages] = useState([
    { id: '0', role: 'system', text: `🤖 ENAT AI — ${modelName}\n${serverOk ? '✅ Serveur connecté. Prêt !' : '⚠️ Serveur hors ligne — lance llama.cpp dans Termux.'}`, time: now() },
  ]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [mode,     setMode]     = useState('stream'); // 'stream' | 'api'
  const [maxTok,   setMaxTok]   = useState(MAX_TOKENS);
  const history = useRef([]);
  const listRef = useRef(null);
  const streamingId = useRef(null);

  useEffect(() => {
    return () => { abortCurrentRequest?.(); };
  }, []);

  const scrollToEnd = () => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
  };

  useEffect(() => { scrollToEnd(); }, [messages]);

  const updateStreamMsg = useCallback((id, text) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, text } : m));
  }, []);

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');

    const userMsg = { id: Date.now().toString(), role: 'user', text: msg, time: now() };
    setMessages(prev => [...prev, userMsg]);
    history.current.push({ role: 'user', content: msg });
    setLoading(true);

    // Ajouter un message IA vide qu'on va remplir en streaming
    const aiId = Date.now().toString() + '_ai';
    streamingId.current = aiId;
    setMessages(prev => [...prev, { id: aiId, role: 'ai', text: '', time: now(), streaming: true }]);

    const settings = { temp: DEFAULT_TEMP, maxTokens: maxTok };
    const msgHistory = [
      { role: 'system', content: SYSTEM_PROMPT(modelName) },
      ...history.current.slice(-20),
    ];

    if (mode === 'stream') {
      streamChat({
        port, modelName,
        history: msgHistory,
        settings,
        onToken: (token, full) => {
          updateStreamMsg(aiId, full);
          scrollToEnd();
        },
        onDone: (full) => {
          history.current.push({ role: 'assistant', content: full });
          setMessages(prev => prev.map(m => m.id === aiId ? { ...m, text: full, streaming: false } : m));
          setLoading(false);
          streamingId.current = null;
        },
        onError: (errMsg) => {
          setMessages(prev => prev.map(m =>
            m.id === aiId ? { ...m, text: `🔴 ${errMsg}`, role: 'error', streaming: false } : m
          ));
          setLoading(false);
          streamingId.current = null;
        },
      });
    } else {
      // Mode API Claude
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: SYSTEM_PROMPT(modelName),
            messages: history.current.slice(-20),
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const reply = data.content?.[0]?.text || '(vide)';
        history.current.push({ role: 'assistant', content: reply });
        setMessages(prev => prev.map(m => m.id === aiId ? { ...m, text: reply, streaming: false } : m));
      } catch (e) {
        setMessages(prev => prev.map(m =>
          m.id === aiId ? { ...m, text: `🔴 API: ${e.message}`, role: 'error', streaming: false } : m
        ));
      } finally {
        setLoading(false);
      }
    }
  };

  const abort = () => {
    abortCurrentRequest?.();
    setLoading(false);
    if (streamingId.current) {
      setMessages(prev => prev.map(m =>
        m.id === streamingId.current ? { ...m, text: m.text + '\n\n⚡ [Arrêté]', streaming: false } : m
      ));
      streamingId.current = null;
    }
  };

  const clearChat = () => {
    history.current = [];
    setMessages([{ id: Date.now().toString(), role: 'system', text: `⚡ Nouvelle session — ${modelName}`, time: now() }]);
  };

  const changeMaxTok = () => {
    Alert.alert('Max tokens', 'Nombre de tokens max (512–4096)\n\nRéduis pour les gros modèles lents', [
      { text: '512',  onPress: () => setMaxTok(512) },
      { text: '1024', onPress: () => setMaxTok(1024) },
      { text: '2048', onPress: () => setMaxTok(2048) },
      { text: '4096', onPress: () => setMaxTok(4096) },
      { text: 'Annuler', style: 'cancel' },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* BARRE MODE */}
      <View style={s.modeBar}>
        <ModeBtn label="⚡ STREAM" active={mode === 'stream'} color={C.neonGreen}  onPress={() => setMode('stream')} />
        <ModeBtn label="🌐 API"    active={mode === 'api'}    color={C.neonBlue}   onPress={() => setMode('api')} />
        <TouchableOpacity style={s.modeBtn} onPress={changeMaxTok}>
          <Text style={s.modeBtnText}>🎚 {maxTok}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.modeBtn} onPress={clearChat}>
          <Text style={[s.modeBtnText, { color: C.neonOrange }]}>✕ NEW</Text>
        </TouchableOpacity>
      </View>

      {/* MESSAGES */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.id}
        style={s.list}
        contentContainerStyle={{ padding: 12, gap: 10 }}
        onContentSizeChange={scrollToEnd}
        renderItem={({ item }) => <Bubble msg={item} modelName={modelName} />}
      />

      {/* INPUT */}
      <View style={s.inputWrap}>
        {loading && (
          <TouchableOpacity style={s.abortBtn} onPress={abort}>
            <Text style={s.abortText}>■ STOP</Text>
          </TouchableOpacity>
        )}
        <View style={s.inputRow}>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="Entrez votre prompt..."
            placeholderTextColor={C.textDim}
            multiline
            maxLength={3000}
            editable={!loading}
          />
          <TouchableOpacity style={s.sendBtn} onPress={send} disabled={loading}>
            {loading
              ? <ActivityIndicator color={C.neonBlue} size="small" />
              : <Text style={s.sendIcon}>➤</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function ModeBtn({ label, active, color, onPress }) {
  return (
    <TouchableOpacity
      style={[s.modeBtn, active && { borderColor: color + '66', backgroundColor: color + '18' }]}
      onPress={onPress}
    >
      <Text style={[s.modeBtnText, active && { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Bubble({ msg, modelName }) {
  const isUser   = msg.role === 'user';
  const isError  = msg.role === 'error';
  const isSystem = msg.role === 'system';
  const isAi     = msg.role === 'ai';

  const copyText = async () => {
    if (isAi || isUser) {
      await Clipboard.setStringAsync(msg.text);
    }
  };

  return (
    <View style={isUser ? s.rowUser : s.rowAi}>
      <TouchableOpacity
        style={[
          s.bubble,
          isUser  ? s.bubbleUser  :
          isError ? s.bubbleError :
          s.bubbleAi
        ]}
        onLongPress={copyText}
        activeOpacity={0.85}
      >
        {msg.streaming && msg.text === '' ? (
          <View style={{ flexDirection: 'row', gap: 5, padding: 4 }}>
            {[0,1,2].map(i => <View key={i} style={s.dot} />)}
          </View>
        ) : (
          <Text style={[s.bubbleText, {
            color: isUser   ? '#c0d8ff'     :
                   isError  ? C.neonOrange  :
                   isSystem ? C.neonCyan    :
                   C.textPrimary
          }]}>{msg.text}{msg.streaming ? '▌' : ''}</Text>
        )}
        <Text style={[s.meta, isUser && { textAlign: 'right' }]}>
          {isUser ? `USER // ${msg.time}` : `${(modelName||'AI').slice(0,14).toUpperCase()} // ${msg.time}`}
          {isAi && !msg.streaming ? '  [hold=copier]' : ''}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const now = () => new Date().toTimeString().slice(0, 8);

const s = StyleSheet.create({
  root:     { flex: 1, backgroundColor: C.bgDeep },
  modeBar:  { flexDirection: 'row', gap: 6, padding: 8, borderBottomWidth: 1, borderBottomColor: C.borderDim, backgroundColor: 'rgba(2,8,16,0.97)' },
  modeBtn:  { flex: 1, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: C.borderDim, alignItems: 'center' },
  modeBtnText: { fontFamily: 'monospace', fontSize: 9, color: C.textDim, letterSpacing: 1 },
  list:     { flex: 1 },
  rowAi:    { alignItems: 'flex-start' },
  rowUser:  { alignItems: 'flex-end' },
  bubble:   { maxWidth: '88%', borderRadius: 12, padding: 12, marginBottom: 2 },
  bubbleAi:    { backgroundColor: 'rgba(0,212,255,0.06)', borderWidth: 1, borderColor: 'rgba(0,212,255,0.15)', borderTopLeftRadius: 4 },
  bubbleUser:  { backgroundColor: 'rgba(0,100,255,0.15)', borderWidth: 1, borderColor: 'rgba(0,100,255,0.3)',  borderTopRightRadius: 4 },
  bubbleError: { backgroundColor: 'rgba(255,34,85,0.08)',  borderWidth: 1, borderColor: 'rgba(255,34,85,0.3)',  borderTopLeftRadius: 4 },
  bubbleText:  { fontSize: 13, lineHeight: 20 },
  meta:        { fontFamily: 'monospace', fontSize: 8, color: C.textDim, marginTop: 6 },
  dot:         { width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.neonBlue, opacity: 0.7 },
  inputWrap:   { borderTopWidth: 1, borderTopColor: C.borderDim, backgroundColor: 'rgba(2,8,16,0.97)' },
  abortBtn:    { alignSelf: 'center', marginTop: 8, paddingHorizontal: 20, paddingVertical: 6, borderWidth: 1, borderColor: C.neonRed + '66', borderRadius: 6, backgroundColor: C.neonRed + '11' },
  abortText:   { fontFamily: 'monospace', fontSize: 10, color: C.neonRed, letterSpacing: 2 },
  inputRow:    { flexDirection: 'row', gap: 10, padding: 10 },
  input:       { flex: 1, backgroundColor: 'rgba(0,212,255,0.04)', borderWidth: 1, borderColor: C.borderDim, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, color: C.textPrimary, fontSize: 14, maxHeight: 120 },
  sendBtn:     { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,212,255,0.2)', borderWidth: 1, borderColor: 'rgba(0,212,255,0.5)', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' },
  sendIcon:    { color: C.neonBlue, fontSize: 18 },
});

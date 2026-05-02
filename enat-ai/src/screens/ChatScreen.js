import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert
} from 'react-native';
import { C, GGUF_NAME, LLAMA_PORT } from '../theme';

const SYSTEM_PROMPT = (model) =>
  `Tu es ${model || 'ENAT AI'}, un LLM local puissant. Réponds de façon précise, complète et utile. Langue: français si l'utilisateur écrit en français.`;

export default function ChatScreen({ route }) {
  const modelName = route?.params?.modelName || GGUF_NAME;
  const [messages, setMessages] = useState([
    { id: '0', role: 'system', text: `🤖 ENAT AI — ${modelName} prêt.\nEntrez votre prompt.`, time: '00:00:00' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('local'); // 'local' | 'api'
  const [port, setPort] = useState(LLAMA_PORT);
  const history = useRef([]); // OpenAI-format conversation history
  const listRef = useRef(null);

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');

    const userMsg = { id: Date.now().toString(), role: 'user', text: msg, time: now() };
    setMessages(prev => [...prev, userMsg]);
    history.current.push({ role: 'user', content: msg });

    setLoading(true);
    const thinkingId = Date.now().toString() + '_think';
    setMessages(prev => [...prev, { id: thinkingId, role: 'thinking', text: '...', time: now() }]);

    try {
      let reply = '';

      if (mode === 'local') {
        // ── llama.cpp OpenAI-compatible API ──
        const res = await fetch(`http://127.0.0.1:${port}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: modelName,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT(modelName) },
              ...history.current.slice(-20),
            ],
            max_tokens: 1024,
            temperature: 0.7,
            stream: false,
          }),
        });
        if (!res.ok) throw new Error(`llama.cpp HTTP ${res.status} — serveur actif?`);
        const data = await res.json();
        reply = data.choices?.[0]?.message?.content || '(réponse vide)';

      } else {
        // ── Claude API (online) ──
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
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error?.message || `HTTP ${res.status}`);
        }
        const data = await res.json();
        reply = data.content?.[0]?.text || '(réponse vide)';
      }

      history.current.push({ role: 'assistant', content: reply });
      setMessages(prev => prev
        .filter(m => m.id !== thinkingId)
        .concat({ id: Date.now().toString(), role: 'ai', text: reply, time: now() })
      );

    } catch (e) {
      let errText = '';
      if (mode === 'local' && (e.message.includes('Network') || e.message.includes('fetch') || e.message.includes('connect'))) {
        errText = `🔴 llama.cpp introuvable sur port ${port}\n\n▸ Lance dans Termux:\ncd llama.cpp && ./build/bin/llama-server -m /storage/emulated/0/Download/Qwen3.5-9B-Uncensored-HauhauCS-Aggressive-Q6_K.gguf --port ${port} --ctx-size 4096 --threads 4\n\n▸ Ou passe en mode API (internet requis)`;
      } else {
        errText = `⚠️ ${e.message}`;
      }
      setMessages(prev => prev
        .filter(m => m.id !== thinkingId)
        .concat({ id: Date.now().toString(), role: 'error', text: errText, time: now() })
      );
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    history.current = [];
    setMessages([{ id: '0', role: 'system', text: `⚡ Nouvelle session — ${modelName}`, time: now() }]);
  };

  const changePort = () => {
    Alert.prompt('Port llama.cpp', 'Port du serveur (défaut: 8080)', (val) => {
      const p = parseInt(val);
      if (!isNaN(p)) setPort(p);
    }, 'plain-text', String(port), 'numeric');
  };

  return (
    <KeyboardAvoidingView
      style={s.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      {/* MODE BAR */}
      <View style={s.modeBar}>
        <TouchableOpacity
          style={[s.modeBtn, mode === 'local' && s.modeBtnActive]}
          onPress={() => setMode('local')}
        >
          <Text style={[s.modeBtnText, mode === 'local' && { color: C.neonGreen }]}>⚡ LOCAL</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.modeBtn, mode === 'api' && s.modeBtnApiActive]}
          onPress={() => setMode('api')}
        >
          <Text style={[s.modeBtnText, mode === 'api' && { color: C.neonBlue }]}>🌐 API</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.modeBtn} onPress={changePort}>
          <Text style={s.modeBtnText}>⚙ :{port}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.modeBtn} onPress={clearChat}>
          <Text style={[s.modeBtnText, { color: C.neonOrange }]}>+ NEW</Text>
        </TouchableOpacity>
      </View>

      {/* MESSAGES */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.id}
        style={s.list}
        contentContainerStyle={{ padding: 12, gap: 10 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => <Bubble msg={item} modelName={modelName} />}
      />

      {/* INPUT */}
      <View style={s.inputRow}>
        <TextInput
          style={s.input}
          value={input}
          onChangeText={setInput}
          placeholder="Entrez votre prompt..."
          placeholderTextColor={C.textDim}
          multiline
          maxLength={2000}
          onSubmitEditing={send}
          editable={!loading}
        />
        <TouchableOpacity style={s.sendBtn} onPress={send} disabled={loading}>
          {loading
            ? <ActivityIndicator color={C.neonBlue} size="small" />
            : <Text style={s.sendIcon}>➤</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({ msg, modelName }) {
  const isUser    = msg.role === 'user';
  const isAi      = msg.role === 'ai';
  const isSystem  = msg.role === 'system';
  const isThink   = msg.role === 'thinking';
  const isError   = msg.role === 'error';

  const bubbleStyle = isUser   ? [s.bubble, s.bubbleUser]
    : isError  ? [s.bubble, s.bubbleError]
    : [s.bubble, s.bubbleAi];

  const textColor = isUser ? '#c0d8ff'
    : isError ? C.neonOrange
    : isSystem ? C.neonCyan
    : C.textPrimary;

  return (
    <View style={isUser ? s.rowUser : s.rowAi}>
      <View style={bubbleStyle}>
        {isThink
          ? <View style={{ flexDirection: 'row', gap: 4, padding: 4 }}>
              {[0,1,2].map(i => <View key={i} style={s.dot} />)}
            </View>
          : <Text style={[s.bubbleText, { color: textColor }]}>{msg.text}</Text>
        }
        <Text style={[s.meta, isUser && { textAlign: 'right' }]}>
          {isUser ? `USER // ${msg.time}` : `${(modelName||'AI').slice(0,14).toUpperCase()} // ${msg.time}`}
        </Text>
      </View>
    </View>
  );
}

const now = () => new Date().toTimeString().slice(0, 8);

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bgDeep },
  modeBar: { flexDirection: 'row', gap: 6, padding: 8, borderBottomWidth: 1, borderBottomColor: C.borderDim, backgroundColor: 'rgba(2,8,16,0.97)' },
  modeBtn: { flex: 1, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: C.borderDim, alignItems: 'center' },
  modeBtnActive:    { borderColor: 'rgba(0,255,136,0.4)', backgroundColor: 'rgba(0,255,136,0.1)' },
  modeBtnApiActive: { borderColor: 'rgba(0,212,255,0.4)', backgroundColor: 'rgba(0,212,255,0.1)' },
  modeBtnText: { fontFamily: 'monospace', fontSize: 9, color: C.textDim, letterSpacing: 1 },
  list:    { flex: 1 },
  rowAi:   { alignItems: 'flex-start' },
  rowUser: { alignItems: 'flex-end' },
  bubble:  { maxWidth: '85%', borderRadius: 12, padding: 12, marginBottom: 2 },
  bubbleAi:    { backgroundColor: 'rgba(0,212,255,0.06)', borderWidth: 1, borderColor: 'rgba(0,212,255,0.15)', borderTopLeftRadius: 4 },
  bubbleUser:  { backgroundColor: 'rgba(0,100,255,0.15)', borderWidth: 1, borderColor: 'rgba(0,100,255,0.3)', borderTopRightRadius: 4 },
  bubbleError: { backgroundColor: 'rgba(255,107,0,0.08)', borderWidth: 1, borderColor: 'rgba(255,107,0,0.3)', borderTopLeftRadius: 4 },
  bubbleText:  { fontSize: 13, lineHeight: 20 },
  meta:        { fontFamily: 'monospace', fontSize: 8, color: C.textDim, marginTop: 4 },
  dot:         { width: 6, height: 6, borderRadius: 3, backgroundColor: C.neonBlue, opacity: 0.6 },
  inputRow:    { flexDirection: 'row', gap: 10, padding: 10, borderTopWidth: 1, borderTopColor: C.borderDim, backgroundColor: 'rgba(2,8,16,0.97)' },
  input:       { flex: 1, backgroundColor: 'rgba(0,212,255,0.04)', borderWidth: 1, borderColor: C.borderDim, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, color: C.textPrimary, fontSize: 14, maxHeight: 100 },
  sendBtn:     { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,212,255,0.2)', borderWidth: 1, borderColor: 'rgba(0,212,255,0.4)', alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-end' },
  sendIcon:    { color: C.neonBlue, fontSize: 18 },
});

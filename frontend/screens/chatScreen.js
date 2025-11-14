import React, { useState, useEffect, useRef } from 'react';
import {View,Text,FlatList,TextInput,TouchableOpacity,KeyboardAvoidingView,Platform,StyleSheet,} from 'react-native';
import { ref, push, onValue, onDisconnect, set } from 'firebase/database';
import { db } from '../../db/firebaseConfig';

export default function ChatScreen({ route, navigation }) {
  const { user, selectedUser } = route.params;
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const [isOtherOnline, setIsOtherOnline] = useState(false);
  const [isMeOnline, setIsMeOnline] = useState(false);
  const flatListRef = useRef(null);

  if (!user || !selectedUser) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, textAlign: 'center', padding: 20 }}>
          ⚠️ No se seleccionó ningún usuario para chatear.
        </Text>
      </View>
    );
  }

  const chatId = [user.uid, selectedUser.uid].sort().join('_');
  const chatRef = ref(db, `chats/${chatId}/messages`);

  useEffect(() => {
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val() || {};
      const parsed = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
      parsed.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      setMessages(parsed);
    });
    return () => unsubscribe();
  }, [selectedUser.uid]);

  useEffect(() => {
    const connectedRef = ref(db, '.info/connected');
    const userStatusRef = ref(db, `status/${user.uid}`);

    const unsubscribe = onValue(connectedRef, (snapshot) => {
      if (snapshot.val() === true) {
        setIsMeOnline(true);
        // Si se desconecta, marcar como offline autommticamente
        onDisconnect(userStatusRef).set({ online: false, lastSeen: Date.now() });
        // Marcar como online
        set(userStatusRef, { online: true, lastSeen: Date.now() });
      } else {
        setIsMeOnline(false);
      }
    });

    return () => unsubscribe();
  }, [user.uid]);

  //  Escuchar si el otro usuario está conectado
  useEffect(() => {
    const otherStatusRef = ref(db, `status/${selectedUser.uid}`);
    const unsubscribe = onValue(otherStatusRef, (snapshot) => {
      const data = snapshot.val();
      setIsOtherOnline(!!data?.online);
    });
    return () => unsubscribe();
  }, [selectedUser.uid]);

  //  Enviar mensaje
  const sendMessage = async () => {
    if (!text.trim()) return;

    await push(chatRef, {
      from: user.uid,
      to: selectedUser.uid,
      name: user.name || 'Anon',
      text: text.trim(),
      timestamp: Date.now(),
    });

    setText('');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'android' ? 'padding' : undefined}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>💬 Chat con {selectedUser.name}</Text>
          <Text style={styles.statusText}>
            {isOtherOnline ? '🟢 En línea' : '🔴 Desconectado'}
          </Text>
        </View>
        {/* boton de salir:
        <TouchableOpacity onPress={onLogout}>
          <Text style={styles.logoutButton}>Salir</Text>
        </TouchableOpacity> */}
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageContainer,
              item.from === user.uid ? styles.myMessage : styles.otherMessage,
            ]}>
            <Text style={styles.messageUser}>
              {item.from === user.uid ? 'Tú' : selectedUser.name}
            </Text>
            <Text style={styles.messageText}>{item.text}</Text>
          </View>
        )}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Escribe un mensaje..."
          autoFocus={true}
          style={styles.input}
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Text style={{ color: '#fff' }}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#6200EE',
    padding: 12,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  statusText: { color: '#fff', fontSize: 13, marginTop: 2 },
  messageContainer: {
    marginVertical: 5,
    padding: 8,
    borderRadius: 8,
    maxWidth: '80%',
  },
  myMessage: { alignSelf: 'flex-end', backgroundColor: '#DCF8C6' },
  otherMessage: { alignSelf: 'flex-start', backgroundColor: '#EAEAEA' },
  messageUser: { fontWeight: 'bold', fontSize: 12 },
  messageText: { fontSize: 16 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderColor: '#DDD',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 20,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#2b8',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
});

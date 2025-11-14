import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { ref, onValue } from 'firebase/database';
import { db } from '../../db/firebaseConfig';

export default function ChatListScreen({ navigation, route }) {
  const { user } = route.params;
  const [chats, setChats] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const chatsRef = ref(db, 'chats');
    const unsubscribe = onValue(chatsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const chatList = [];

      // 4ecorremos cada chat existente
      Object.entries(data).forEach(([chatId, chatData]) => {
        if (!chatData.messages) return;

        const messages = Object.values(chatData.messages);
        if (messages.length === 0) return;

        // detectar si el usuario participa en este chat
        const isParticipant = chatId.includes(user.uid);
        if (!isParticipant) return;

        // bbtener el último mensaje
        const lastMessage = messages[messages.length - 1];

        // identificamos el otro usuario
        const otherUid =
          lastMessage.from === user.uid ? lastMessage.to : lastMessage.from;

        chatList.push({
          chatId,
          lastMessage,
          otherUid,
        });
      });

      setChats(chatList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid]);

  // wbtener datos del otro usuario desde users/
  const [userCache, setUserCache] = useState({});
  useEffect(() => {
    const usersRef = ref(db, 'users');
    const unsub = onValue(usersRef, (snapshot) => {
      const data = snapshot.val() || {};
      setUserCache(data);
    });
    return () => unsub();
  }, []);

  const filteredChats = chats.filter((chat) => {
    const otherUser = userCache[chat.otherUid];
    const name = otherUser?.name?.toLowerCase() || '';
    return name.includes(search.toLowerCase());
  });

  const openChat = (chat) => {
    const otherUser = userCache[chat.otherUid];
    if (!otherUser) return;
    navigation.navigate('Chat', { user, selectedUser: otherUser });
  };

  const renderItem = ({ item }) => {
    const otherUser = userCache[item.otherUid];
    if (!otherUser) return null;

    return (
      <TouchableOpacity style={styles.chatItem} onPress={() => openChat(item)}>
        <Image
          source={
            otherUser.photo
              ? { uri: otherUser.photo.startsWith('data:image') ? otherUser.photo : `data:image/jpeg;base64,${otherUser.photo}` }
              : require('../../assets/default-avatar.png')
          }
          style={styles.avatar}
        />

        <View style={styles.chatInfo}>
          <Text style={styles.name}>{otherUser.name}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage.text}
          </Text>
        </View>

        <Text style={styles.time}>
          {new Date(item.lastMessage.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2b8" />
        <Text>Cargando tus chats...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchBar}
        placeholder="Buscar chat..."
        value={search}
        onChangeText={setSearch}
      />

      {filteredChats.length === 0 ? (
        <Text style={styles.noChats}>No tienes chats todavía 😅</Text>
      ) : (
        <FlatList
          data={filteredChats}
          renderItem={renderItem}
          keyExtractor={(item) => item.chatId}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  searchBar: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    height: 40,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  chatInfo: { flex: 1 },
  name: { fontWeight: 'bold', fontSize: 16 },
  lastMessage: { color: '#666', marginTop: 2 },
  time: { fontSize: 12, color: '#999' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noChats: { textAlign: 'center', marginTop: 50, color: '#888' },
});

import React, { useState, useEffect } from 'react';
import {  
    View, Text, FlatList, TextInput, TouchableOpacity, 
    StyleSheet, KeyboardAvoidingView, Platform, Alert,  
    ActivityIndicator, Dimensions, StatusBar 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ref, onValue, push, runTransaction, remove, update } from 'firebase/database';
import { db } from '../../db/firebaseConfig';
import { useNavigation } from '@react-navigation/native'

//Responsividad
const { width } = Dimensions.get('window');
const IS_TABLET = width >= 600;
const PADDING_CONTENT_HORIZONTAL = IS_TABLET ? 40 : 16;

export default function PostDetailScreen({ route }) {
    const { postId, postTitle, user } = route.params;
    const navigation = useNavigation();
    const [comments, setComments] = useState([]);
    const [newCommentText, setNewCommentText] = useState('');
    const [loading, setLoading] = useState(true);
    
    const [editingComment, setEditingComment] = useState(null); 
    const [editText, setEditText] = useState('');

    //Carga de Comentarios
    useEffect(() => {
      const commentsRef = ref(db, `foro/${postId}/comments`); 
      const unsubscribe = onValue(commentsRef, (snapshot) => {
        const data = snapshot.val() || {};
        const commentList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        commentList.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)); 
        setComments(commentList);
        setLoading(false);
      });
      return () => unsubscribe();
    }, [postId]);

    //Enviar nuevo comentario
    const handleCommentSubmit = async () => {
      if (!newCommentText.trim()) {
        return Alert.alert('Error', 'No puedes enviar un comentario vacío.');
      }

      const commentData = {
          authorUid: user.uid,
          authorName: user.name || user.displayName || user.email.split('@')[0],
          authorType: user.type || "paciente",
          text: newCommentText.trim(),
          timestamp: Date.now(),
      };
      
      try {
        await push(ref(db, `foro/${postId}/comments`), commentData);
        setNewCommentText('');

        //Actualizar el contador de comentarios
        const postRef = ref(db, `foro/${postId}`);
        await runTransaction(postRef, (post) => {
          if (post) {
            post.commentCount = (post.commentCount || 0) + 1;
          }
          return post;
        });
      } catch (error) {
        console.error('Error al enviar el comentario:', error);
        Alert.alert('Error', 'Hubo un problema al enviar tu comentario.');
      }
    };

    //Eliminar comentario
    const handleDeleteComment = (commentId) => {
      Alert.alert(
        "Confirmar Eliminación",
        "¿Estás seguro de que quieres eliminar este comentario?",
        [
          { text: "Cancelar", style: "cancel" },
          { 
            text: "Eliminar", 
            style: "destructive", 
            onPress: async () => {
              try {
                //Eliminar el comentario
                const commentRef = ref(db, `foro/${postId}/comments/${commentId}`);
                await remove(commentRef);
                
                //Actualizar el contador de comentarios
                const postRef = ref(db, `foro/${postId}`);
                await runTransaction(postRef, (post) => {
                  if (post && post.commentCount > 0) {
                    post.commentCount -= 1;
                  }
                  return post;
                });
                
                Alert.alert("Éxito", "Comentario eliminado correctamente.");
              } catch (error) {
                console.error('Error al eliminar el comentario:', error);
                Alert.alert('Error', 'No se pudo eliminar el comentario.');
              }
            }
          },
        ]
      );
    };

    //Guardar edicion del comentario
    const handleSaveEdit = async () => {
      if (!editText.trim()) {
        return Alert.alert('Error', 'El texto del comentario no puede estar vacío.');
      }
      try {
        const commentRef = ref(db, `foro/${postId}/comments/${editingComment}`);
        await update(commentRef, {
          text: editText.trim(),
          editedAt: Date.now(), 
        });
        setEditingComment(null); 
        setEditText('');
        Alert.alert("Éxito", "Comentario editado correctamente.");
      } catch (error) {
        console.error('Error al editar el comentario:', error);
        Alert.alert('Error', 'No se pudo editar el comentario.');
      }
    };

    //Renderización Individual del Comentario
    const renderItem = ({ item }) => {
      const isAuthor = item.authorUid === user.uid;
      const isEditing = editingComment === item.id;
      const displayTime = new Date(item.timestamp).toLocaleString();
      
      if (isEditing) {
        return (
          <View style={[styles.commentItem, styles.commentEditContainer]}>
            <TextInput
              style={styles.commentEditInput}
              value={editText}
              onChangeText={setEditText}
              multiline
            />
            <View style={styles.commentEditActions}>
              <TouchableOpacity style={styles.commentSaveButton} onPress={handleSaveEdit}>
                <Text style={styles.commentSaveButtonText}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.commentCancelButton} onPress={() => setEditingComment(null)}>
                <Text style={styles.commentCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }
      
      return (
        <View style={styles.commentItem}>
          <Text style={styles.commentAuthor} allowFontScaling={true}>
            {item.authorName}
            <Text style={styles.commentType} allowFontScaling={true}> ({item.authorType || 'paciente'})</Text>
          </Text>
          <Text style={styles.commentText} allowFontScaling={true}>{item.text}</Text>
          <Text style={styles.commentTime} allowFontScaling={false}>{displayTime}</Text>
          
          {/* Acciones editar y eliminar */}
          {isAuthor && (
            <View style={styles.commentActions}>
              <TouchableOpacity onPress={() => { setEditingComment(item.id); setEditText(item.text); }}>
                <Text style={styles.commentActionText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteComment(item.id)}>
                <Text style={[styles.commentActionText, { color: 'red' }]}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    };

    const ListHeader = () => (
      <View style={styles.postHeader}>
        <Text style={styles.postTitle} allowFontScaling={true}>{postTitle}</Text>
        <Text style={styles.commentSectionTitle}>Comentarios ({comments.length})</Text>
      </View>
    );

    //Si la lista está cargando, mostrar un indicador de carga
    if (loading) {
        return (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#008b38ff" />
            <Text style={{ fontSize: IS_TABLET ? 18 : 16 }}>Cargando foro...</Text>
          </View>
        );
    }

    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#EAEEFFFF" />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} 
        >
          <View style={styles.container}> 

            <FlatList
              data={comments}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              ListHeaderComponent={ListHeader}
              style={styles.commentList}
              contentContainerStyle={{paddingVertical: 8, paddingHorizontal: PADDING_CONTENT_HORIZONTAL}}
              ListEmptyComponent={
                !loading && (
                  <Text style={styles.emptyText}>Sé el primero en comentar. 🖊️</Text>
                )
              }
            />

            {/* Inpunt de comentarios */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Escribe tu comentario..."
                value={newCommentText}
                onChangeText={setNewCommentText}
                multiline
                placeholderTextColor="#999" 
              />
              <TouchableOpacity style={styles.sendButton} onPress={handleCommentSubmit}>
                <Text style={styles.sendButtonText}>Comentar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { 
        flex: 1, 
        backgroundColor: '#EAEEFFFF' 
    },
    container: {
        flex: 1, 
        paddingTop: 16, 
        backgroundColor: '#EAEEFFFF' 
    },
    center: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#EAEEFFFF' 
    },
    postHeader: { 
        paddingBottom: 15, 
        borderBottomWidth: 1, 
        borderBottomColor: '#ddd', 
        marginBottom: 10 
    },
    postTitle: { 
        fontSize: IS_TABLET ? 22 : 18, 
        fontWeight: 'bold', 
        color: '#005187', 
        marginBottom: 5 
    },
    commentSectionTitle: { 
        fontSize: IS_TABLET ? 18 : 16, 
        fontWeight: 'bold', 
        marginTop: 10, 
        color: '#555' 
    },
    commentList: { flex: 1 },
    commentItem: { 
        backgroundColor: '#fff', 
        padding: IS_TABLET ? 14 : 10, 
        borderRadius: 8, 
        marginBottom: 8,
        borderLeftWidth: 2, 
        borderLeftColor: '#ff9800' 
    },
    commentAuthor: { 
        fontWeight: 'bold', 
        fontSize: IS_TABLET ? 15 : 14, 
        color: '#333' 
    },
    commentType: { 
        fontWeight: 'normal', 
        fontSize: IS_TABLET ? 12 : 10, 
        color: '#666' 
    },
    commentText: { 
        fontSize: IS_TABLET ? 15 : 14, 
        marginTop: 3, 
        marginBottom: 5 
    },
    commentTime: { 
        fontSize: 9, 
        color: '#999', 
        textAlign: 'right' 
    },
    emptyText: { 
        textAlign: 'center', 
        marginTop: 30, 
        color: '#888' 
    },
    commentActions: { 
        flexDirection: 'row', 
        justifyContent: 'flex-end', 
        marginTop: 5, 
        gap: 10, 
        borderTopWidth: 1, 
        borderTopColor: '#eee', 
        paddingTop: 5 
    },
    commentActionText: { 
        color: '#ff9800', 
        fontWeight: '600', 
        fontSize: 12 
    },
    commentEditContainer: { 
        borderLeftColor: 
        '#007ACC' 
    },
    commentEditInput: { 
        borderWidth: 1, 
        borderColor: '#007ACC', 
        borderRadius: 5,
        padding: 8, 
        minHeight: 60, 
        marginBottom: 5, 
        fontSize: IS_TABLET ? 14 : 13 
    },
    commentEditActions: { 
        flexDirection: 'row', 
        justifyContent: 'flex-end', 
        gap: 8 
    },
    commentSaveButton: { 
        backgroundColor: '#007ACC', 
        padding: 6, 
        borderRadius: 4 
    },
    commentSaveButtonText: { 
        color: '#fff', 
        fontSize: 12, 
        fontWeight: 'bold' 
    },
    commentCancelButton: { 
        backgroundColor: '#ccc', 
        padding: 6, 
        borderRadius: 4 
    },
    commentCancelButtonText: { 
        color: '#333', 
        fontSize: 12, 
        fontWeight: 'bold' 
    },
    inputContainer: { 
        flexDirection: 'row', 
        alignItems: 'flex-end', 
        paddingVertical: 10, 
        borderTopWidth: 1, 
        borderColor: '#eee', 
        backgroundColor: '#fff',
        paddingHorizontal: PADDING_CONTENT_HORIZONTAL 
    },
    input: { 
        flex: 1, 
        borderWidth: 1, 
        borderColor: '#CCC', 
        borderRadius: 25, 
        paddingHorizontal: 15, 
        paddingVertical: Platform.OS === 'ios' ? 12 : 10, 
        marginRight: 8, 
        minHeight: 45, 
        maxHeight: 120 
    },
    sendButton: { 
        backgroundColor: '#008b38ff', 
        borderRadius: 25, 
        paddingHorizontal: 15, 
        paddingVertical: 12, 
        height: 45, justifyContent: 'center' 
    },
    sendButtonText: { 
        color: '#fff', 
        fontWeight: 'bold', 
        fontSize: 15 
    },
});
import React, { useState, useEffect } from "react";
import { 
    View, Text, TextInput, TouchableOpacity, FlatList, 
    StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, 
    Platform, Dimensions, StatusBar 
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from "@react-navigation/native"; 
import { db } from "../../db/firebaseConfig";
import { ref, push, onValue, remove, update } from "firebase/database";
import { Ionicons } from "@expo/vector-icons";

//Responsividad
const { width } = Dimensions.get('window');
const IS_TABLET = width >= 600;
const PADDING_CONTENT_HORIZONTAL = IS_TABLET ? 40 : 16;

export default function ForumListScreen({ route }) {
    const navigation = useNavigation();
    const { user } = route.params; 

    const [mensaje, setMensaje] = useState("");
    const [publicaciones, setPublicaciones] = useState([]);
    const [loading, setLoading] = useState(true);

    const [editingPost, setEditingPost] = useState(null); 
    const [editText, setEditText] = useState("");

    //Carga de Foros Principales
    useEffect(() => {
        const foroRef = ref(db, 'foro/'); 
        const unsubscribe = onValue(foroRef, (snapshot) => {
            const data = snapshot.val() || {};
            const lista = Object.keys(data)
                .map((id) => ({ id, ...data[id] }))
                .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)); //descendente
            setPublicaciones(lista);
            setLoading(false);
        }, (error) => {
            console.error('Error al cargar publicaciones:', error);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    //Publicar nuevo foro
    const publicarMensaje = async () => {
        if (!mensaje.trim()) {
            Alert.alert("Campo vacío", "Escribe algo para publicar.");
            return;
        }

        try {
            const foroRef = ref(db, 'foro/'); 
            await push(foroRef, {
                authorUid: user.uid,
                authorName: user.name || user.displayName || user.email.split('@')[0], 
                authorType: user.type || "paciente", 
                text: mensaje.trim(), 
                timestamp: Date.now(), 
                commentCount: 0, 
            });
            setMensaje("");
        } catch (error) {
            console.error("Error al publicar:", error);
            Alert.alert("Error", "No se pudo publicar el mensaje.");
        }
    };
    
    //Eliminar foro
    const handleDeletePost = (postId) => {
        Alert.alert(
            "Confirmar Eliminación",
            "¿Estás seguro de que quieres eliminar esta publicación y sus comentarios?",
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Eliminar", 
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            const postRef = ref(db, `foro/${postId}`);
                            await remove(postRef);
                            Alert.alert("Éxito", "Publicación eliminada correctamente.");
                        } catch (error) {
                            console.error('Error al eliminar la publicación:', error);
                            Alert.alert('Error', 'No se pudo eliminar la publicación.');
                        }
                    }
                },
            ]
        );
    };

    //Guardar edición
    const handleSaveEdit = async () => {
        if (!editText.trim()) {
            return Alert.alert('Error', 'El texto no puede estar vacío.');
        }
        try {
            const postRef = ref(db, `foro/${editingPost}`);
            await update(postRef, {
                text: editText.trim(),
                editedAt: Date.now(), 
            });
            setEditingPost(null); 
            setEditText('');
            Alert.alert("Éxito", "Publicación editada.");
        } catch (error) {
            console.error('Error al editar la publicación:', error);
            Alert.alert('Error', 'No se pudo editar la publicación.');
        }
    };

    //Renderización Individual de foro
    const renderItem = ({ item }) => {
        const isAuthor = item.authorUid === user.uid;
        const isEditing = editingPost === item.id;
        const displayTime = new Date(item.timestamp).toLocaleString();
        
        //Vista de edicion
        if (isEditing) {
            return (
                <View style={[styles.card, styles.editCard, { marginHorizontal: PADDING_CONTENT_HORIZONTAL }]}>
                    <TextInput
                        style={styles.editInput}
                        value={editText}
                        onChangeText={setEditText}
                        multiline
                    />
                    <View style={styles.editActions}>
                        <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit}>
                            <Text style={styles.saveButtonText}>Guardar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => setEditingPost(null)}>
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        return (
            <TouchableOpacity
                style={[
                    styles.card,
                    { marginHorizontal: PADDING_CONTENT_HORIZONTAL },
                    item.authorType === "doctor" && { borderLeftColor: "#007ACC" },
                ]}
                onPress={() => navigation.navigate('PostDetail', { 
                    postId: item.id, 
                    postTitle: item.text, 
                    user: user 
                })}
            >
                <Text style={styles.autor}>
                    {item.authorType === "doctor" ? "👨‍⚕️ " : "🧑 "} {item.authorName}
                </Text>
                <Text style={styles.mensaje}>{item.text}</Text>
                <View style={styles.bottomRow}>
                    <Text style={styles.commentCount}>💬 {item.commentCount || 0}</Text>
                    <Text style={styles.fecha}>{displayTime}</Text>
                </View>
                
                {/* Acciones editar y eliminar */}
                {isAuthor && (
                    <View style={styles.postActions}>
                        <TouchableOpacity onPress={() => { setEditingPost(item.id); setEditText(item.text); }}>
                            <Text style={styles.actionText}>Editar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeletePost(item.id)}>
                            <Text style={[styles.actionText, { color: 'red' }]}>Eliminar</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    if (loading)
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#007ACC" />
                <Text>Cargando publicaciones...</Text>
            </View>
        );

    return (
      <SafeAreaView style={{flex: 1, backgroundColor: "#F6FAFF"}}>
        <StatusBar barStyle="dark-content" backgroundColor="#F6FAFF" /> 
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"} 
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} 
        >
            <Text style={[styles.title, {marginHorizontal: PADDING_CONTENT_HORIZONTAL}]}>
                🩺 Foro de Salud: Publicaciones Principales
            </Text>

            <FlatList
                data={publicaciones}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={{paddingVertical: 8}}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>¡Sé el primero en publicar! 🚀</Text>
                }
            />

            {/* Área de entrada para nueva publicación */}
            <View style={[styles.inputRow, {paddingHorizontal: PADDING_CONTENT_HORIZONTAL}]}>
                <TextInput
                    style={styles.input}
                    placeholder="Crea un nuevo tema de conversación..."
                    value={mensaje}
                    onChangeText={setMensaje}
                    multiline
                />
                <TouchableOpacity style={styles.btn} onPress={publicarMensaje}>
                    <Ionicons name="send" size={22} color="#fff" />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: "#F6FAFF" 
    },
    title: {
        fontSize: IS_TABLET ? 28 : 22, 
        fontWeight: "bold", 
        color: "#007ACC", 
        marginBottom: 10, 
        textAlign: 'center',
    },
    card: {
        backgroundColor: "#fff", 
        borderRadius: 10, 
        padding: 12, 
        marginBottom: 12, 
        borderLeftWidth: 5, 
        borderLeftColor: "#00BFA6",
    },
    autor: { 
        fontWeight: "bold", 
        color: "#333", 
        marginBottom: 4 },
    mensaje: { 
        fontSize: 15, 
        color: "#444" 
    },
    bottomRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginTop: 6 
    },
    commentCount: { 
        fontSize: 12, 
        fontWeight: 'bold', 
        color: '#555' 
    },
    fecha: { 
        fontSize: 12, 
        color: "#777", 
        textAlign: "right" 
    },
    postActions: { 
        flexDirection: 'row', 
        justifyContent: 'flex-end', 
        marginTop: 8, gap: 15, 
        borderTopWidth: 1, 
        borderTopColor: '#eee', 
        paddingTop: 5 
    },
    actionText: { 
        color: '#007ACC', 
        fontWeight: '600', 
        fontSize: 14 
    },
    editCard: { 
        borderLeftColor: '#007ACC' 
    },
    editInput: { 
        borderWidth: 1, 
        borderColor: '#007ACC', 
        borderRadius: 5, 
        padding: 10, 
        minHeight: 80,
        marginBottom: 10, 
        fontSize: 15 
    },
    editActions: { 
        flexDirection: 'row', 
        justifyContent: 'flex-end', 
        gap: 10 
    },
    saveButton: { 
        backgroundColor: '#007ACC', 
        padding: 8, 
        borderRadius: 5 
    },
    saveButtonText: { 
        color: '#fff',
        fontWeight: 'bold' 
    },
    cancelButton: { 
        backgroundColor: '#ccc', 
        padding: 8, 
        borderRadius: 5 
    },
    cancelButtonText: { 
        color: '#333', 
        fontWeight: 'bold' 
    },
    inputRow: { 
        flexDirection: "row", 
        alignItems: "flex-end", 
        paddingVertical: 10, 
        borderTopWidth: 1, 
        borderColor: '#eee', 
        backgroundColor: '#fff', 
    },
    input: { 
        flex: 1,
        backgroundColor: "#fff", 
        borderRadius: 25, 
        paddingHorizontal: 15, 
        paddingVertical: Platform.OS === 'ios' ? 12 : 10, 
        borderWidth: 1, 
        borderColor: "#ccc", 
        minHeight: 45, 
        maxHeight: 120 
    },
    btn: { 
        backgroundColor: "#007ACC", 
        marginLeft: 10, 
        padding: 12, 
        borderRadius: 25, 
        height: 45, 
        justifyContent: 'center' 
    },
    emptyText: { 
        textAlign: 'center', 
        marginTop: 30, 
        color: '#888',
        fontSize: 16 
    },
    center: { 
        flex: 1,
        justifyContent: "center", 
        alignItems: "center" 
    },
});
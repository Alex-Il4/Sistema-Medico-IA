import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    StatusBar,
    TextInput,
    TouchableOpacity,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    Alert,
    Keyboard,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useAuth } from '../../db/useAuth';
import { Ionicons as Icon } from '@expo/vector-icons';
import BottomMenu from './components/BottomMenu';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AIChat = ({ navigation }) => {
    const [prompt, setPrompt] = useState('');
    const [messages, setMessages] = useState([]);
    const { user, idToken, isLoading } = useAuth();
    const API_URL = 'http://192.168.1.40:8000/api/chat/response/';
    const [attachedImage, setAttachedImage] = useState(null);
    const [keyboardHeight, setKeyboardHeight] = useState(0);
    const flatListRef = useRef(null);
    let loadingIdRef = useRef(null);
    const insets = useSafeAreaInsets();

    const showLoadingMessage = (text) => {
        const id = 'loading-' + Date.now();
        loadingIdRef.current = id;
        const loadingMessage = { id: id, text: text, sender: 'ai', type: 'text', isLoading: true };
        setMessages(prev => [...prev, loadingMessage]);
        return id;
    };

    const replaceLoadingMessage = (loadingId, aiResponseText) => {
        const aiMessage = {
            id: Date.now().toString(),
            text: aiResponseText,
            sender: 'ai',
            type: 'text',
            isLoading: false
        };
        setMessages(prevMessages =>
            prevMessages.map(msg => msg.id === loadingId ? aiMessage : msg)
        );
    };

    const removeLoadingMessageAndShowError = (loadingId, errorMessageText) => {
        const errorMessage = {
            id: Date.now().toString(),
            text: `Error: ${errorMessageText}`,
            sender: 'ai',
            type: 'text'
        };
        setMessages(prevMessages => {
            const withoutLoading = prevMessages.filter(msg => msg.id !== loadingId);
            return [...withoutLoading, errorMessage];
        });
    };

    const handleAddImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Permiso Requerido", "Se requiere permiso para acceder a la galería de fotos para subir recetas.");
            return;
        }
        let pickerResult = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.8,
        });
        if (pickerResult.canceled || !pickerResult.assets || pickerResult.assets.length === 0) {
            return;
        }
        const asset = pickerResult.assets[0];
        setAttachedImage({
            uri: asset.uri,
            type: asset.mimeType || 'image/jpeg',
            name: asset.fileName || 'recipe_image.jpg',
        });
        setPrompt('');
    };
//FUNCION PARA STREAMING DE API
const handleSend = async () => {
    if (isLoading || !user || !idToken) return;

    const currentPrompt = prompt.trim();
    const imageToSend = attachedImage;

    if (!currentPrompt && !imageToSend) return;

    // Mensaje del usuario
    if (imageToSend) {
        const userImageMessage = {
            id: Date.now().toString(),
            uri: imageToSend.uri,
            sender: 'user',
            type: 'image'
        };
        setMessages(prev => [...prev, userImageMessage]);
    } else {
        const userMessage = {
            id: Date.now().toString(),
            text: currentPrompt,
            sender: 'user',
            type: 'text'
        };
        setMessages(prev => [...prev, userMessage]);
    }

    const streamId = 'stream-' + Date.now();
    const streamMessage = { 
        id: streamId, 
        text: '', 
        sender: 'ai', 
        type: 'text', 
        isLoading: true 
    };
    setMessages(prev => [...prev, streamMessage]);

    setPrompt('');
    setAttachedImage(null);

    try {
        let response;
        if (imageToSend) {
            const formData = new FormData();
            formData.append('prompt', currentPrompt || "Describe esta imagen");
            formData.append('image_file', {
                uri: imageToSend.uri,
                type: imageToSend.type,
                name: imageToSend.name,
            });
            
            response = await axios.post(API_URL, formData, {
                headers: {
                    'Authorization': `Bearer ${idToken}`,
                    'Content-Type': 'multipart/form-data',
                },
            });
        } else {
            response = await axios.post(API_URL, {
                prompt: currentPrompt,
            }, {
                headers: {
                    'Authorization': `Bearer ${idToken}`,
                },
            });
        }

        const aiResponseText = response.data.generated_text || "No response";
        
        // Simular streaming dividiendo el texto
        let displayedText = '';
        const words = aiResponseText.split(' ');
        
        for (let i = 0; i < words.length; i++) {
            displayedText += (i === 0 ? '' : ' ') + words[i];
            
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === streamId
                        ? { ...msg, text: displayedText }
                        : msg
                )
            );
            
            // Pequeña pausa entre palabras para efecto de streaming
            await new Promise(resolve => setTimeout(resolve, 50));
            
            // Scroll automático
            flatListRef.current?.scrollToEnd({ animated: true });
        }
        
        // Finalizar
        setMessages(prev =>
            prev.map(msg =>
                msg.id === streamId
                    ? { ...msg, isLoading: false }
                    : msg
            )
        );

    } catch (error) {
        console.error("Error en el API:", error);
        setMessages(prev =>
            prev.map(msg =>
                msg.id === streamId
                    ? { 
                        ...msg, 
                        text: `Error: ${error.message}`, 
                        isLoading: false 
                      }
                    : msg
            )
        );
    }
};
//FIN DE FUNCION PARA STREAMING DE API
    

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (e) => {
                setKeyboardHeight(e.endCoordinates.height);
                setTimeout(() => {
                    flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
            }
        );
        const keyboardDidHideListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            () => {
                setKeyboardHeight(0);
            }
        );
        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    const renderMessage = ({ item }) => {
        const isUser = item.sender === 'user';
        const textStyle = isUser ? styles.userMessageText : styles.aiMessageText;
        return (
            <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.aiMessage]}>
                {item.type === 'text' && <Text style={[styles.messageText, textStyle]}>{item.text}</Text>}
                {item.type === 'image' && (
                    <Image source={{ uri: item.uri }} style={styles.imageMessage} />
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor="#f0f4f9" barStyle="dark-content" />
            <KeyboardAvoidingView 
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <Text style={styles.title}>Chat AI</Text>
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{
                        paddingVertical: 10,
                        paddingBottom: Platform.OS === 'android' ? 
                            (keyboardHeight > 0 ? keyboardHeight + 150 : 150) : 120,
                    }}
                    style={{ flex: 1 }}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />
                <View style={[
                    styles.inputBar,
                    { paddingBottom: Platform.OS === 'android' ? 
                        (keyboardHeight > 340 ? keyboardHeight : 10) : 0 }
                ]}>
                    <TouchableOpacity
                        style={[styles.iconButton, isLoading && styles.disabledButton]}
                        onPress={handleAddImage}
                        disabled={isLoading}
                    >
                        <Icon name="image" size={24} color={'#000'} />
                    </TouchableOpacity>
                    {attachedImage && (
                        <Image
                            source={{ uri: attachedImage.uri }}
                            style={styles.attachedImagePreview}
                        />
                    )}
                    <TextInput
                        style={styles.input}
                        placeholder={isLoading ? "Cargando sesión..." : (attachedImage ? "Añade una pregunta..." : "Escribe tu mensaje...")}
                        value={prompt}
                        onChangeText={setPrompt}
                        multiline={true}
                        editable={!isLoading}
                    />
                    <TouchableOpacity
                        style={[
                            styles.iconButton,
                            styles.sendButton,
                            (isLoading || (!prompt.trim() && !attachedImage)) && styles.disabledButton
                        ]}
                        onPress={handleSend}
                        disabled={isLoading || (!prompt.trim() && !attachedImage)}
                    >
                        <Icon name="send" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
            <BottomMenu navigation={navigation} user={user} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f4f9',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        paddingHorizontal: 20,
        paddingVertical: 15,
        color: '#1a1a1a',
    },
    messageContainer: {
        marginVertical: 4,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 20,
        maxWidth: '85%',
    },
    userMessage: {
        alignSelf: 'flex-end',
        marginRight: 10,
        backgroundColor: '#007aff',
        borderBottomRightRadius: 5,
    },
    aiMessage: {
        alignSelf: 'flex-start',
        marginLeft: 10,
        backgroundColor: '#ffffff',
        borderBottomLeftRadius: 5,
        borderWidth: 1,
        borderColor: '#e0e0e0',
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    userMessageText: {
        color: '#ffffff',
    },
    aiMessageText: {
        color: '#333333',
    },
    imageMessage: {
        width: 180,
        height: 180,
        borderRadius: 12,
        resizeMode: 'cover',
    },
    inputBar: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 10,
        paddingVertical: 8,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    attachedImagePreview: {
        width: 32,
        height: 32,
        borderRadius: 6,
        marginRight: 4,
        marginLeft: 4,
        borderWidth: 1,
        borderColor: '#007aff',
        marginBottom: 8,
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 120,
        borderRadius: 22,
        paddingHorizontal: 15,
        paddingVertical: 10,
        marginHorizontal: 8,
        fontSize: 16,
        backgroundColor: '#f0f0f0',
        color: '#1a1a1a',
    },
    iconButton: {
        padding: 10,
        marginBottom: 4,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButton: {
        backgroundColor: '#007aff',
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    disabledButton: {
        opacity: 0.4,
    }
});

export default AIChat;
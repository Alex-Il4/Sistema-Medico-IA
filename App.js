import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signOut } from "firebase/auth";
import { auth } from "./db/firebaseConfig";

// Screens
import LoginScreen from "./frontend/screens/loginScreen";
import RegisterScreen from "./frontend/screens/registerScreen";
import HomeScreen from "./frontend/screens/homeScreen";
import ChatScreen from "./frontend/screens/chatScreen";
import ChatListScreen from "./frontend/screens/chatListScreen";
import ProfileScreen from "./frontend/screens/ProfileScreen";
import DoctorSearchScreen from "./frontend/screens/doctorSearchScreen";
import DoctorSearchAgendarScreen from "./frontend/screens/doctorSearchAgendar";
import CitaAgendarScreen from "./frontend/screens/CitaAgendarScreen";
import CitasScreen from "./frontend/screens/CitasScreen";
import CitasDoctorScreen from "./frontend/screens/CitasDoctorScreen";
import MiDisponibilidadScreen from "./frontend/screens/MiDisponibilidadScreen";
import RecetaEmitirScreen from "./frontend/screens/RecetaEmitirScreen";
import RecetasPacienteScreen from "./frontend/screens/RecetasPacienteScreen";
import HistorialScreen from "./frontend/screens/historialScreen";
import HistorialDetalleScreen from "./frontend/screens/historialDetalleScreen";
import RecetaDetalleScreen from "./frontend/screens/recetaDetalleScreen";
import ForumListScreen from "./frontend/screens/ForumListScreen";
import PostDetailScreen from "./frontend/screens/PostDetailScreen";
import { AuthProvider, useAuth } from "./db/useAuth";
import AIChat from "./frontend/screens/AIChat";
import { useSafeAreaInsets, SafeAreaProvider } from 'react-native-safe-area-context';
const Stack = createNativeStackNavigator();

function AuthenticatedStack({ user, onLogout }) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" options={{ headerShown: false }}>
        {(props) => <HomeScreen {...props} user={user} onLogout={onLogout} />}
      </Stack.Screen>

      {/* Chats */}
      <Stack.Screen name="Chat" options={{ headerShown: false }}>
        {(props) => <ChatScreen {...props} user={user} />}
      </Stack.Screen>
      <Stack.Screen name="ChatList" options={{ headerShown: false }}>
        {(props) => <ChatListScreen {...props} user={user} />}
      </Stack.Screen>

      {/* Citas */}
      <Stack.Screen name="DoctorSearchAgendar" options={{ headerShown: false }}>
        {(props) => <DoctorSearchAgendarScreen {...props} user={user} />}
      </Stack.Screen>
      <Stack.Screen name="CitaAgendar" options={{ headerShown: false }} component={CitaAgendarScreen} />
      <Stack.Screen name="Citas" options={{ headerShown: false }}>
        {(props) => <CitasScreen {...props} user={user} />}
      </Stack.Screen>
      <Stack.Screen name="CitasDoctor" options={{ headerShown: false }}>
        {(props) => <CitasDoctorScreen {...props} user={user} />}
      </Stack.Screen>

      {/* Disponibilidad */}
      <Stack.Screen
        name="MiDisponibilidad"
        options={{ title: "Mi Disponibilidad", headerShown: true }}
      >
        {(props) => <MiDisponibilidadScreen {...props} user={user} />}
      </Stack.Screen>

      {/* Recetas */}
      <Stack.Screen name="RecetaEmitir" options={{ headerShown: false }}>
        {(props) => <RecetaEmitirScreen {...props} user={user} />}
      </Stack.Screen>
      <Stack.Screen name="RecetasPaciente" options={{ headerShown: false }}>
        {(props) => <RecetasPacienteScreen {...props} user={user} />}
      </Stack.Screen>
      <Stack.Screen name="RecetaDetalle" options={{ headerShown: true, title: "Detalle de Receta" }} component={RecetaDetalleScreen} />

      {/* Historial */}
      <Stack.Screen name="Historial" options={{ headerShown: false }}>
        {(props) => <HistorialScreen {...props} user={user} />}
      </Stack.Screen>
      <Stack.Screen name="HistorialDetalle" options={{ title: "Detalle del Registro" }}>
        {(props) => <HistorialDetalleScreen {...props} user={user} />}
      </Stack.Screen>

      {/* Perfil y búsqueda */}
      <Stack.Screen name="Profile" options={{ headerShown: false }}>
        {(props) => <ProfileScreen {...props} user={user} />}
      </Stack.Screen>
      <Stack.Screen name="DoctorSearch" options={{ headerShown: false }}>
        {(props) => <DoctorSearchScreen {...props} user={user} />}
      </Stack.Screen>

      {/* Foro */}
      <Stack.Screen name="ForumList" options={{ headerShown: false }}>
        {(props) => <ForumListScreen {...props} user={user} />}
      </Stack.Screen>
      <Stack.Screen name="PostDetail" options={{ headerShown: true, title: "Comentarios de la publicación" }}>
        {(props) => <PostDetailScreen {...props} user={user} />}
      </Stack.Screen>
      {/* AI Chat */}
      <Stack.Screen name="AIChat" options={{ headerShown: false }}>
        {(props) => <AIChat {...props} user={user} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

export default function App() {
  const [user, setUser] = useState(null);

  //  Cargarmos usuario al iniciar
  useEffect(() => {
    const loadUser = async () => {
      const saved = await AsyncStorage.getItem('user');
      if (saved) setUser(JSON.parse(saved));
    };
    loadUser();
  }, []);

  //  Guardamos usuario al iniciar sesión
  const handleLogin = async (userObj) => {
    await AsyncStorage.setItem('user', JSON.stringify(userObj));
    setUser(userObj);
  };

  // Cerrar sesión
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      await signOut(auth);
    } catch (err) {
      console.warn(err);
    }
    setUser(null);
  };

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!user ? (
              <>
                <Stack.Screen name="Login">
                  {(props) => <LoginScreen {...props} onLogin={handleLogin} />}
                </Stack.Screen>
                <Stack.Screen
                  name="Register"
                  options={{ headerShown: true, title: 'Crear cuenta' }}
                  component={RegisterScreen}
                />
              </>
            ) : (
              <Stack.Screen name="Authenticated">
                {(props) => (
                  <AuthenticatedStack {...props} user={user} onLogout={handleLogout} />
                )}
              </Stack.Screen>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

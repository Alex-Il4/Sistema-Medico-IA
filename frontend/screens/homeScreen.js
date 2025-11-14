import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Platform, StatusBar } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signOut } from "firebase/auth";
import { auth } from "../../db/firebaseConfig";
import DraggableAIButton from './components/DraggableAIButton';
import BottomMenu from './components/BottomMenu';

export default function HomeScreen({ onLogout }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const stored = await AsyncStorage.getItem("user");
        if (stored) setUser(JSON.parse(stored));
      } catch (err) {
        console.warn("Error al cargar usuario", err);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem("user");
      onLogout();
    } catch (err) {
      console.warn("Error al cerrar sesión:", err);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2b8" />
      </View>
    );
  }

  return (
    <View style={styles.fullScreenContainer}>
      {/* StatusBar con padding seguro */}
      <StatusBar backgroundColor="#EAEEFFFF" barStyle="dark-content" />
      
      <View style={[
        styles.container,
        {
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : insets.top,
        }
      ]}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: 100, // Espacio extra para el menú inferior
            }
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>
            Bienvenido{user?.name ? `, ${user.name}` : ""} 👋
          </Text>
          <Text style={styles.subtitle}>TuDoctor</Text>

          {/* 🔹 Chat general */}
          {user?.type !== "doctor" && (
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigation.navigate("DoctorSearch", { user })}
            >
              <MaterialCommunityIcons name="magnify" size={24} color="#fff" />
              <Text style={styles.menuText}>Buscar Doctor</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.navigate("ChatList", { user })}
          >
            <MaterialCommunityIcons name="chat" size={24} color="#fff" />
            <Text style={styles.menuText}>Ir al Chat</Text>
          </TouchableOpacity>

          {/* 🔹 Solo Paciente: Agendar cita */}
          {user?.type !== "doctor" && (
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigation.navigate("DoctorSearchAgendar", { user })}
            >
              <MaterialCommunityIcons name="calendar-plus" size={24} color="#fff" />
              <Text style={styles.menuText}>Agendar Cita</Text>
            </TouchableOpacity>
          )}

          {/* 🔹 Solo Doctor: Disponibilidad */}
          {user?.type === "doctor" && (
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => navigation.navigate("MiDisponibilidad", { user })}
            >
              <MaterialCommunityIcons name="clock" size={24} color="#fff" />
              <Text style={styles.menuText}>Mi Disponibilidad</Text>
            </TouchableOpacity>
          )}

          {/* 🔹 Historial Médico */}
          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: "#007ACC" }]}
            onPress={() => navigation.navigate("Historial", { user })}
          >
            <MaterialCommunityIcons name="file-document" size={24} color="#fff" />
            <Text style={styles.menuText}>Historial Médico</Text>
          </TouchableOpacity>

          {/* 🔹 Foro */}
          <TouchableOpacity
            style={[styles.menuButton, { backgroundColor: "#00927fff" }]}
            onPress={() => navigation.navigate("ForumList", { user })}
          >
            <MaterialCommunityIcons name="account-group" size={24} color="#fff" />
            <Text style={styles.menuText}>Foro de Salud</Text>
          </TouchableOpacity>

          {/* 🔹 Logout */}
          <TouchableOpacity style={styles.buttonDanger} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={24} color="#fff" />
            <Text style={styles.buttonText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 🔹 Menú Inferior - Ahora con SafeArea */}
      <BottomMenu navigation={navigation} user={user} />

      {/* 🔹 Botón flotante de IA */}
      <DraggableAIButton navigation={navigation} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  fullScreenContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: "#EAEEFFFF",
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    marginBottom: 5,
    fontWeight: "bold",
    color: "#005187",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 30,
    color: "#333",
    textAlign: "center",
  },
  menuButton: {
    flexDirection: "row",
    width: "100%",
    padding: 12,
    backgroundColor: "#2b8",
    borderRadius: 10,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 8,
  },
  menuText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  buttonDanger: {
    flexDirection: "row",
    width: "100%",
    padding: 10,
    backgroundColor: "red",
    borderRadius: 10,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
});
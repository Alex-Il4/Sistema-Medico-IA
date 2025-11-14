// frontend/screens/registerScreen.js
import React, { useState } from 'react';
import {View,Text,TextInput,TouchableOpacity,Alert,StyleSheet,ActivityIndicator,KeyboardAvoidingView,Platform,ScrollView} from 'react-native';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, db } from '../../db/firebaseConfig'; 

export default function RegisterScreen({ onRegisterSuccess, onBack }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [userType, setUserType] = useState('paciente'); //valor por defecto
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email.trim() || !password || !confirm)
      return Alert.alert("Campos vacíos", "Completa todos los campos.");
    if (password !== confirm)
      return Alert.alert("Error", "Las contraseñas no coinciden.");

    setLoading(true);
    try {
      // 1️ Crear usuario en Firebase Auth
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      await updateProfile(cred.user, {
        displayName: name || email.split("@")[0],
      });

      // 2️ Guardar en Realtime Database
      const userRef = ref(db, "users/" + cred.user.uid);
      await set(userRef, {
        uid: cred.user.uid,
        name: name || email.split("@")[0],
        email: cred.user.email,
        type: userType,
        createdAt: Date.now(),
      });

      // 3️ Notificar éxito
      Alert.alert("✅ Registro exitoso", "Tu cuenta ha sido creada.");

      onRegisterSuccess &&
        onRegisterSuccess({
          uid: cred.user.uid,
          name: name || email.split("@")[0],
          email: cred.user.email,
          type: userType,
          provider: "firebase",
        });
    } catch (err) {
      console.log("Error al registrar:", err.code);

      if (err.code === "auth/email-already-in-use") {
        Alert.alert("Correo ya registrado", "El correo que ingresaste ya tiene una cuenta asociada.");
      } else if (err.code === "auth/invalid-email") {
        Alert.alert("Correo inválido", "El formato del correo electrónico no es válido.");
      } else if (err.code === "auth/weak-password") {
        Alert.alert("Contraseña débil", "La contraseña debe tener al menos 6 caracteres.");
      } else {
        Alert.alert("Error al registrar", "Ocurrió un error inesperado. Intenta nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "android" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Text style={styles.title}>🩺 Crear cuenta nueva</Text>

          <TextInput
            placeholder="Nombre"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
          <TextInput
            placeholder="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          <TextInput
            placeholder="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />
          <TextInput
            placeholder="Confirmar contraseña"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            style={styles.input}
          />

          {/* tipo de usuario */}
          <Text style={styles.label}>Selecciona tu tipo de usuario:</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                userType === "paciente" && styles.toggleActive,
              ]}
              onPress={() => setUserType("paciente")}
            >
              <Text
                style={[
                  styles.toggleText,
                  userType === "paciente" && styles.toggleTextActive,
                ]}
              >
                🙋🏻‍♂️ Paciente
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleButton,
                userType === "doctor" && styles.toggleActive,
              ]}
              onPress={() => setUserType("doctor")}
            >
              <Text
                style={[
                  styles.toggleText,
                  userType === "doctor" && styles.toggleTextActive,
                ]}
              >
                👨‍⚕️ Doctor
              </Text>
            </TouchableOpacity>
          </View>

          {/* Botón principal */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Registrar</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: {
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  label: { marginTop: 10, marginBottom: 8, fontWeight: '600', color: '#333' },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2b8',
    marginHorizontal: 6,
  },
  toggleActive: { backgroundColor: '#2b8' },
  toggleText: { color: '#2b8', fontWeight: '600' },
  toggleTextActive: { color: '#fff', fontWeight: '600' },
  primaryButton: {
    backgroundColor: '#2b8',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
});

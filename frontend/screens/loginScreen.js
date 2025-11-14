import React, { useState } from 'react';
import {View,Text,TextInput,TouchableOpacity,ActivityIndicator,Alert,StyleSheet,} from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ref, get } from "firebase/database";
import { auth, db  } from '../../db/firebaseConfig';

export default function LoginScreen({ navigation, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password)
      return Alert.alert('Campos vacíos', 'Completa ambos campos.');

    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
       const userRef = ref(db , `users/${cred.user.uid}`);
    const snapshot = await get(userRef);

    let userData;
    if (snapshot.exists()) {
      userData = snapshot.val(); // incluimos type, name, email, etc.
    } else {
      userData = {
        uid: cred.user.uid,
        name: cred.user.displayName || email.split("@")[0],
        email: cred.user.email,
        type: "paciente", // valor por defecto
      };
    }

    // llamarmos al callback del login con el usuario completo
    onLogin(userData);
  } catch (err) {
    Alert.alert('Error al iniciar sesión', err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔑 Iniciar sesión</Text>

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

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Entrar</Text>
        )}
      </TouchableOpacity>

      {/* enlace de registro */}
      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={styles.secondaryText}>¿No tienes cuenta? Regístrate</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 22, textAlign: 'center', marginBottom: 20, fontWeight: 'bold' },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  primaryButton: {
    backgroundColor: '#2b8',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  secondaryButton: { marginTop: 15, alignItems: 'center' },
  secondaryText: { color: '#2b8' },
});

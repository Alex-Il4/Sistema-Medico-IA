import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { db, auth } from "../../db/firebaseConfig";
import { ref, onValue, push, serverTimestamp } from "firebase/database";
import { Picker } from "@react-native-picker/picker";

export default function RecetaEmitirScreen({ navigation }) {
  const [pacientes, setPacientes] = useState([]);
  const [pacienteId, setPacienteId] = useState("");
  const [medicamento, setMedicamento] = useState("");
  const [indicaciones, setIndicaciones] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔹 Cargar lista de pacientes
  useEffect(() => {
    const usersRef = ref(db, "users/");
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val() || {};
      const lista = Object.keys(data)
        .map((key) => ({ id: key, ...data[key] }))
        .filter((u) => u.type === "paciente");
      setPacientes(lista);
    });
  }, []);

  // 🔹 Función para emitir la receta
  const handleEmitir = async () => {
    if (!pacienteId || !medicamento.trim() || !indicaciones.trim()) {
      Alert.alert("⚠️ Campos incompletos", "Completa todos los campos requeridos.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "No se encontró el usuario autenticado.");
      return;
    }

    const paciente = pacientes.find((p) => p.id === pacienteId);
    if (!paciente) {
      Alert.alert("Error", "Paciente no válido.");
      return;
    }

    try {
      setLoading(true);

      const recetaData = {
        pacienteId: paciente.id,
        pacienteName: paciente.name,
        doctorId: user.uid,
        doctorName: user.displayName || "Doctor",
        medicamento,
        indicaciones,
        diagnostico,
        fecha: new Date().toISOString(), // ✅ ISO estándar
        createdAt: serverTimestamp(),
      };

      // 📦 Guardar receta
      const recetaRef = ref(db, "recetas/");
      await push(recetaRef, recetaData);

      // 🩺 Agregar al historial médico automáticamente
      const historialRef = ref(db, "historial_medico/");
      await push(historialRef, {
        tipo: "receta",
        descripcion: `Receta médica emitida por ${recetaData.doctorName}`,
        detalles: `${recetaData.medicamento} - ${recetaData.indicaciones}`,
        doctor: recetaData.doctorName,
        paciente: recetaData.pacienteName,
        fecha: recetaData.fecha,
        createdAt: serverTimestamp(),
      });

      Alert.alert("✅ Éxito", "Receta emitida y guardada en el historial médico.");
      navigation.goBack();
    } catch (error) {
      console.error("Error al emitir receta:", error);
      Alert.alert("❌ Error", "No se pudo emitir la receta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🩺 Emitir Receta</Text>

      <Text style={styles.label}>Selecciona Paciente</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={pacienteId}
          onValueChange={(v) => setPacienteId(v)}
        >
          <Picker.Item label="Seleccionar paciente" value="" />
          {pacientes.map((p) => (
            <Picker.Item key={p.id} label={p.name} value={p.id} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Diagnóstico</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        multiline
        value={diagnostico}
        onChangeText={setDiagnostico}
        placeholder="Ej: Gripe estacional, infección respiratoria, etc."
      />

      <Text style={styles.label}>Medicamento(s)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        multiline
        value={medicamento}
        onChangeText={setMedicamento}
        placeholder="Ej: Paracetamol 500mg cada 8 horas"
      />

      <Text style={styles.label}>Indicaciones</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        multiline
        value={indicaciones}
        onChangeText={setIndicaciones}
        placeholder="Ej: Tomar después de los alimentos durante 5 días"
      />

      <TouchableOpacity
        style={[styles.button, loading && { backgroundColor: "#ccc" }]}
        onPress={handleEmitir}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Emitir Receta</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

// 🎨 Estilos
const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#F6FAFF", padding: 20 },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#007ACC",
    marginBottom: 20,
    textAlign: "center",
  },
  label: { fontWeight: "600", marginTop: 10, marginBottom: 4, color: "#333" },
  pickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  textArea: { height: 80, textAlignVertical: "top" },
  button: {
    backgroundColor: "#007ACC",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});

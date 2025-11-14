import React, { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, FlatList, Platform, ActivityIndicator
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { db, auth } from "../../db/firebaseConfig";
import { ref, onValue, push, remove } from "firebase/database";

export default function MiDisponibilidadScreen() {
  const [dia, setDia] = useState("Lunes");
  const [horaInicio, setHoraInicio] = useState(new Date(2025, 0, 1, 9, 0));
  const [horaFin, setHoraFin] = useState(new Date(2025, 0, 1, 12, 0));
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [horarios, setHorarios] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const refDisponibilidad = ref(db, `disponibilidad/${user.uid}`);
    const unsubscribe = onValue(refDisponibilidad, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
      setHorarios(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const formatHM = (d) => {
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  };

  const agregarHorario = async () => {
    if (!user) {
      Alert.alert("Error", "Debes iniciar sesión como doctor.");
      return;
    }

    const inicio = formatHM(horaInicio);
    const fin = formatHM(horaFin);

    if (inicio >= fin) {
      Alert.alert("Error", "La hora de inicio debe ser menor que la hora fin.");
      return;
    }

    setSaving(true);
    try {
      await push(ref(db, `disponibilidad/${user.uid}`), {
        dia,
        horaInicio: inicio,
        horaFin: fin,
      });
      Alert.alert("Éxito", "Horario agregado correctamente.");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo guardar el horario.");
    } finally {
      setSaving(false);
    }
  };

  const eliminarHorario = async (id) => {
    try {
      await remove(ref(db, `disponibilidad/${user.uid}/${id}`));
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "No se pudo eliminar el horario.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🕒 Mi Disponibilidad</Text>

      <Text style={styles.label}>Día:</Text>
      <View style={styles.pickerContainer}>
        <Picker selectedValue={dia} onValueChange={(v) => setDia(v)}>
          {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map((d) => (
            <Picker.Item key={d} label={d} value={d} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Hora inicio:</Text>
      <TouchableOpacity style={styles.input} onPress={() => setShowStart(true)}>
        <Text>{formatHM(horaInicio)}</Text>
      </TouchableOpacity>
      {showStart && (
        <DateTimePicker
          value={horaInicio}
          mode="time"
          is24Hour
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(_, selected) => {
            setShowStart(false);
            if (selected) setHoraInicio(selected);
          }}
        />
      )}

      <Text style={styles.label}>Hora fin:</Text>
      <TouchableOpacity style={styles.input} onPress={() => setShowEnd(true)}>
        <Text>{formatHM(horaFin)}</Text>
      </TouchableOpacity>
      {showEnd && (
        <DateTimePicker
          value={horaFin}
          mode="time"
          is24Hour
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(_, selected) => {
            setShowEnd(false);
            if (selected) setHoraFin(selected);
          }}
        />
      )}

      <TouchableOpacity
        style={[styles.button, saving && { backgroundColor: "#ccc" }]}
        onPress={agregarHorario}
        disabled={saving}
      >
        <Text style={styles.buttonText}>{saving ? "Guardando..." : "Agregar horario"}</Text>
      </TouchableOpacity>

      <Text style={styles.subtitle}>📅 Mis horarios:</Text>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} />
      ) : horarios.length === 0 ? (
        <Text style={{ marginTop: 10, color: "#777" }}>No tienes horarios registrados.</Text>
      ) : (
        <FlatList
          data={horarios}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text>{item.dia}: {item.horaInicio} - {item.horaFin}</Text>
              <TouchableOpacity onPress={() => eliminarHorario(item.id)}>
                <Text style={{ color: "red" }}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F5F8FF" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10, color: "#007ACC" },
  label: { marginTop: 10, fontWeight: "600" },
  pickerContainer: { backgroundColor: "#fff", borderRadius: 8, marginBottom: 10 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 12, borderRadius: 8, backgroundColor: "#fff", marginBottom: 10 },
  button: { backgroundColor: "#007ACC", padding: 12, borderRadius: 8, marginTop: 5 },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "bold" },
  subtitle: { marginTop: 20, fontWeight: "600", color: "#333" },
  row: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#fff", padding: 10, borderRadius: 8, marginTop: 6 },
});

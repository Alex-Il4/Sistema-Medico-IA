import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { db } from "../../db/firebaseConfig";
import { ref, onValue, update, remove } from "firebase/database";

export default function CitasDoctorScreen({ route }) {
  const { user } = route.params;
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    const refCitas = ref(db, "citas/");
    const unsub = onValue(refCitas, (snapshot) => {
      const data = snapshot.val() || {};
      const lista = Object.keys(data)
        .map((id) => ({ id, ...data[id] }))
        .filter((c) => c.doctorId === user.uid && c.estado !== "completada")
        .sort((a, b) => new Date(a.fechaCita) - new Date(b.fechaCita));
      setCitas(lista);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const completarCita = async (cita) => {
    try {
      // Actualizar estado
      const citaRef = ref(db, `citas/${cita.id}`);
      await update(citaRef, { estado: "completada" });
      Alert.alert("✅ Cita completada", "Se eliminará automáticamente en 3 minutos.");

      // Esperar 3 minutosss y se elimina la cita
      setTimeout(async () => {
        await remove(citaRef);
        console.log("🗑️ Cita eliminada automáticamente:", cita.id);
      }, 180000);
    } catch (err) {
      console.error("Error completando cita:", err);
      Alert.alert("Error", "No se pudo completar la cita.");
    }
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007ACC" />
        <Text>Cargando citas...</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📅 Citas Programadas</Text>

      {citas.length === 0 ? (
        <Text style={{ color: "#777" }}>No tienes citas pendientes.</Text>
      ) : (
        <FlatList
          data={citas}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.name}>👤 {item.pacienteName}</Text>
              <Text>Motivo: {item.motivo}</Text>
              <Text>
                Fecha de cita:{" "}
                <Text style={styles.bold}>
                  {new Date(item.fechaCita).toLocaleDateString()} {item.horaCita || ""}
                </Text>
              </Text>

              <TouchableOpacity
                style={[styles.btn, { backgroundColor: "#28a745" }]}
                onPress={() => completarCita(item)}
              >
                <Text style={styles.btnText}>✅ Completar cita</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, padding: 20, backgroundColor: "#F5F8FF" },
  title: { fontSize: 22, fontWeight: "bold", color: "#007ACC", marginBottom: 15 },
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderColor: "#ddd",
    borderWidth: 1,
  },
  name: { fontWeight: "bold", fontSize: 16, color: "#007ACC" },
  bold: { fontWeight: "600" },
  btn: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "bold" },
});

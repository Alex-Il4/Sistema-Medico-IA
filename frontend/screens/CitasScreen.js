import React, { useEffect, useState } from "react";
import {View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity} from "react-native";
import { db } from "../../db/firebaseConfig";
import { ref, onValue, remove } from "firebase/database";

export default function CitasScreen({ route }) {
  const { user } = route.params;
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const refCitas = ref(db, "citas/");
    const unsubscribe = onValue(refCitas, (snapshot) => {
      const data = snapshot.val() || {};
      const lista = Object.keys(data)
        .map((key) => ({ id: key, ...data[key] }))
        .filter((c) => c.pacienteId === user.uid)
        .sort((a, b) => new Date(a.fechaCita) - new Date(b.fechaCita));

      setCitas(lista);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const formatearFecha = (fechaStr) => {
    if (!fechaStr) return "No definida";
    try {
      const fecha = new Date(fechaStr);
      if (isNaN(fecha)) return fechaStr;
      return fecha.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "Fecha inválida";
    }
  };

  const obtenerHora = (cita) => {
    // 🔍 Soporta distintos nombres de campo
    return (
      cita.horaCita ||
      cita.hora ||
      cita.horario ||
      (cita.fechaCita
        ? new Date(cita.fechaCita).toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "No definida")
    );
  };

  const completarCita = async (id) => {
    try {
      await remove(ref(db, "citas/" + id));
      alert("✅ Cita completada y eliminada.");
    } catch (error) {
      alert("❌ Error al eliminar la cita.");
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
      <Text style={styles.title}>🗓️ Mis Citas</Text>

      {citas.length === 0 ? (
        <Text style={{ color: "#777" }}>No tienes citas registradas.</Text>
      ) : (
        <FlatList
          data={citas}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.name}>
                👨‍⚕️ Dr. {item.doctorName || "No especificado"}
              </Text>
              <Text>🧑 Paciente: {item.pacienteName || user.name}</Text>
              <Text>🩺 Motivo: {item.motivo || "Sin motivo"}</Text>
              <Text style={styles.fecha}>
                📅 Fecha: {formatearFecha(item.fechaCita)}
              </Text>
              <Text style={styles.fecha}>
                🕒 Hora: {obtenerHora(item)}
              </Text>

              <TouchableOpacity
                style={styles.btn}
                onPress={() => completarCita(item.id)}
              >
                <Text style={styles.btnText}>✅ Marcar como completada</Text>
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
  fecha: { marginTop: 4, color: "#333" },
  btn: {
    marginTop: 10,
    backgroundColor: "#28a745",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "bold" },
});

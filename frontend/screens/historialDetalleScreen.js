//Esta vista es para ver los detalles de un registro del historial pero no supe como implementarla
//a lo demas que hice :(
import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function HistorialDetalleScreen({ route }) {
  const { registro } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{registro.tipo.toUpperCase()}</Text>
      <Text style={styles.subtitle}>{registro.descripcion}</Text>

      <View style={styles.section}>
        <Text style={styles.label}>🗓 Fecha:</Text>
        <Text style={styles.value}>{registro.fecha}</Text>

        <Text style={styles.label}>👨‍⚕️ Doctor:</Text>
        <Text style={styles.value}>{registro.doctor}</Text>

        <Text style={styles.label}>👤 Paciente:</Text>
        <Text style={styles.value}>{registro.paciente}</Text>

        <Text style={styles.label}>🩺 Detalles:</Text>
        <Text style={styles.value}>{registro.detalles}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#EAEEFFFF", padding: 20 },
  title: { fontSize: 26, fontWeight: "bold", color: "#005187" },
  subtitle: { fontSize: 18, color: "#333", marginBottom: 20 },
  section: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  label: { fontWeight: "bold", marginTop: 10, color: "#005187" },
  value: { fontSize: 16, color: "#333", marginBottom: 5 },
});

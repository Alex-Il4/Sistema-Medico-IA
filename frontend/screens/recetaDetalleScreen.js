import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export default function RecetaDetalleScreen({ route, navigation }) {
  const { receta } = route.params;

  if (!receta) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>No se encontraron datos de la receta.</Text>
      </View>
    );
  }

  const formatearFechaCompleta = (fecha) => {
    if (!fecha) return "Sin fecha";
    try {
      const d = new Date(fecha);
      if (isNaN(d)) return "Sin fecha válida";
      return d.toLocaleString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Sin fecha válida";
    }
  };

  const handleDownloadPDF = async () => {
    const fechaFormateada = formatearFechaCompleta(receta.fecha);

    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial; padding: 25px; color: #333; background: #f9f9f9; }
            h1 { color: #007ACC; text-align: center; }
            .card { background: #fff; padding: 20px; border-radius: 12px; }
            .linea { border-top: 1px solid #ddd; margin: 12px 0; }
            .dato { margin-bottom: 6px; }
          </style>
        </head>
        <body>
          <h1>Receta Médica</h1>
          <div class="card">
            <p class="dato"><strong>👨‍⚕️ Doctor:</strong> ${receta.doctorName || "No especificado"}</p>
            <p class="dato"><strong>🧑 Paciente:</strong> ${receta.pacienteName || "No especificado"}</p>
            <p class="dato"><strong>📅 Fecha y hora de emisión:</strong> ${fechaFormateada}</p>
            <div class="linea"></div>
            <p><strong>🩺 Diagnóstico:</strong></p>
            <p>${receta.diagnostico || "No especificado"}</p>
            <div class="linea"></div>
            <p><strong>💊 Medicamento(s):</strong></p>
            <p>${receta.medicamento || "No indicado"}</p>
            <div class="linea"></div>
            <p><strong>📋 Indicaciones:</strong></p>
            <p>${receta.indicaciones || "Sin indicaciones"}</p>
          </div>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri);
    Alert.alert("📄 PDF generado", "La receta fue exportada correctamente.");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Ionicons name="medical" size={26} color="#007ACC" />
        <Text style={styles.title}>Receta Médica</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>👨‍⚕️ Doctor:</Text>
        <Text style={styles.value}>{receta.doctorName || "No especificado"}</Text>

        <Text style={styles.label}>🧑 Paciente:</Text>
        <Text style={styles.value}>{receta.pacienteName || "No especificado"}</Text>

        <Text style={styles.label}>📅 Fecha de Emisión:</Text>
        <Text style={styles.value}>{formatearFechaCompleta(receta.fecha)}</Text>

        <View style={styles.separator} />

        <Text style={styles.sectionTitle}>🩺 Diagnóstico</Text>
        <Text style={styles.text}>{receta.diagnostico || "No especificado"}</Text>

        <Text style={styles.sectionTitle}>💊 Medicamento(s)</Text>
        <Text style={styles.text}>{receta.medicamento || "No especificado"}</Text>

        <Text style={styles.sectionTitle}>📋 Indicaciones</Text>
        <Text style={styles.text}>{receta.indicaciones || "No especificado"}</Text>

        <TouchableOpacity style={styles.button} onPress={handleDownloadPDF}>
          <Text style={styles.buttonText}>📥 Descargar PDF</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={20} color="#fff" />
        <Text style={styles.buttonText}>Volver</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: "#F6FAFF", padding: 20, alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  title: { fontSize: 22, fontWeight: "bold", color: "#007ACC", marginLeft: 8 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 16, width: "100%", elevation: 3 },
  label: { fontWeight: "bold", color: "#444", marginTop: 8 },
  value: { color: "#333", marginBottom: 6 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#007ACC", marginTop: 12 },
  text: { color: "#333", fontSize: 15, marginTop: 4 },
  separator: { borderBottomWidth: 1, borderBottomColor: "#ccc", marginVertical: 10 },
  button: {
    backgroundColor: "#007ACC",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  buttonText: { color: "#fff", fontWeight: "bold", marginLeft: 6 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  error: { fontSize: 16, color: "red" },
});

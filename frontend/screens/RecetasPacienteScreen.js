import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { db } from "../../db/firebaseConfig";
import { ref, onValue, remove } from "firebase/database";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function RecetasPacienteScreen({ route }) {
  const { user } = route.params;
  const [recetas, setRecetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    if (!user?.uid) return;

    const refRecetas = ref(db, "recetas/");
    const unsub = onValue(refRecetas, (snapshot) => {
      const data = snapshot.val() || {};
      const lista = Object.keys(data)
        .map((id) => ({ id, ...data[id] }))
        .filter((r) => r.pacienteId === user.uid)
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha)); // ✅ Más recientes primero

      setRecetas(lista);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  // ✅ Formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return "Sin fecha válida";
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

  // ✅ Generar PDF
  const generarPDF = async (receta) => {
    const fechaFormateada = formatearFecha(receta.fecha);

    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial; padding: 20px; color: #333; }
            h1 { color: #007ACC; text-align: center; }
            .linea { border-top: 1px solid #ddd; margin: 12px 0; }
            .dato { margin-bottom: 6px; }
          </style>
        </head>
        <body>
          <h1>Receta Médica</h1>
          <p class="dato"><strong>👨‍⚕️ Doctor:</strong> ${receta.doctorName || "No especificado"}</p>
          <p class="dato"><strong>🧑 Paciente:</strong> ${receta.pacienteName || "No especificado"}</p>
          <p class="dato"><strong>📅 Fecha:</strong> ${fechaFormateada}</p>
          <div class="linea"></div>
          <p><strong>🩺 Diagnóstico:</strong></p>
          <p>${receta.diagnostico || "No especificado"}</p>
          <div class="linea"></div>
          <p><strong>💊 Medicamento(s):</strong></p>
          <p>${receta.medicamento || "No indicado"}</p>
          <div class="linea"></div>
          <p><strong>📋 Indicaciones:</strong></p>
          <p>${receta.indicaciones || "Sin indicaciones"}</p>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri);
  };

  // 🗑 Eliminar receta
  const eliminarReceta = (id) => {
    Alert.alert("Confirmar", "¿Deseas eliminar esta receta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            const recetaRef = ref(db, `recetas/${id}`);
            await remove(recetaRef);
            Alert.alert("✅ Eliminada", "La receta fue eliminada correctamente.");
          } catch (error) {
            console.error("Error al eliminar receta:", error);
            Alert.alert("Error", "No se pudo eliminar la receta.");
          }
        },
      },
    ]);
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007ACC" />
        <Text>Cargando recetas...</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💊 Mis Recetas</Text>

      {recetas.length === 0 ? (
        <Text style={{ color: "#777" }}>No tienes recetas registradas.</Text>
      ) : (
        <FlatList
          data={recetas}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("RecetaDetalle", { receta: item })
              }
            >
              <View style={styles.card}>
                <View style={styles.headerRow}>
                  <Text style={styles.name}>👨‍⚕️ Dr. {item.doctorName}</Text>
                  <TouchableOpacity onPress={() => eliminarReceta(item.id)}>
                    <MaterialCommunityIcons
                      name="delete-outline"
                      size={22}
                      color="red"
                    />
                  </TouchableOpacity>
                </View>

                <Text>📅 {formatearFecha(item.fecha)}</Text>
                <Text numberOfLines={2}>💊 Medicamento: {item.medicamento}</Text>

                <TouchableOpacity
                  style={styles.btn}
                  onPress={() => generarPDF(item)}
                >
                  <Text style={styles.btnText}>📄 Descargar PDF</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

// 🎨 Estilos
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, padding: 20, backgroundColor: "#F5F8FF" },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#007ACC",
    marginBottom: 15,
  },
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderColor: "#ddd",
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: { fontWeight: "bold", fontSize: 16, color: "#007ACC" },
  btn: {
    backgroundColor: "#007ACC",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  btnText: { color: "#fff", fontWeight: "bold" },
});

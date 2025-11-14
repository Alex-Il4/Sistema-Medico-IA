//Esta vuista es para ver los detalles de un registro del historial pero como dije no supe como darle 
//uso talves alguien le da uso rapido
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, TextInput, Alert, ActivityIndicator} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ref, push, set, onValue, update, remove } from "firebase/database";
import { db } from "../../db/firebaseConfig";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker"; // ⬅️ NUEVO

export default function HistorialScreen() {
  const navigation = useNavigation();
  const [historial, setHistorial] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [registroEditando, setRegistroEditando] = useState(null);

  const [nuevoRegistro, setNuevoRegistro] = useState({
    tipo: "consulta",
    descripcion: "",
    detalles: "",
    doctor: "",
    paciente: "",
    fecha: new Date().toLocaleDateString(),
  });

  // 🔹 Cargar registros en tiempo real
  useEffect(() => {
    const dbRef = ref(db, "historial_medico");
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const registros = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setHistorial(registros.reverse());
        setFiltered(registros.reverse());
      } else {
        setHistorial([]);
        setFiltered([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 🔍 Filtrar historial
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(historial);
    } else {
      const term = search.toLowerCase();
      const result = historial.filter(
        (item) =>
          item.descripcion?.toLowerCase().includes(term) ||
          item.paciente?.toLowerCase().includes(term) ||
          item.doctor?.toLowerCase().includes(term) ||
          item.tipo?.toLowerCase().includes(term)
      );
      setFiltered(result);
    }
  }, [search, historial]);

  // 🟢 Guardar o editar
  const guardarRegistro = async () => {
    if (!nuevoRegistro.descripcion || !nuevoRegistro.detalles) {
      Alert.alert("Error", "Por favor completa todos los campos.");
      return;
    }

    try {
      if (editMode && registroEditando) {
        const registroRef = ref(db, `historial_medico/${registroEditando.id}`);
        await update(registroRef, nuevoRegistro);
        Alert.alert("✅ Éxito", "Registro actualizado correctamente.");
      } else {
        const newRef = push(ref(db, "historial_medico"));
        await set(newRef, nuevoRegistro);
        Alert.alert("✅ Éxito", "Registro médico guardado correctamente.");
      }

      setModalVisible(false);
      setEditMode(false);
      setRegistroEditando(null);
      setNuevoRegistro({
        tipo: "consulta",
        descripcion: "",
        detalles: "",
        doctor: "",
        paciente: "",
        fecha: new Date().toLocaleDateString(),
      });
    } catch (error) {
      console.error("🔥 Error al guardar registro:", error);
      Alert.alert("Error", "No se pudo guardar el registro.");
    }
  };

  // 🗑 Eliminar registro
  const eliminarRegistro = (id) => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Deseas eliminar este registro médico?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const registroRef = ref(db, `historial_medico/${id}`);
              await remove(registroRef);
              Alert.alert("✅ Eliminado", "Registro eliminado correctamente.");
            } catch (error) {
              console.error("Error al eliminar:", error);
              Alert.alert("Error", "No se pudo eliminar el registro.");
            }
          },
        },
      ]
    );
  };

  // ✏️ Editar registro existente
  const editarRegistro = (registro) => {
    setNuevoRegistro(registro);
    setRegistroEditando(registro);
    setEditMode(true);
    setModalVisible(true);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2b8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historial Médico Digital</Text>

      {/* 🔍 Buscador */}
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar por paciente, doctor o tipo..."
        value={search}
        onChangeText={setSearch}
      />

      {/* 📋 Lista */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate("HistorialDetalle", { registro: item })
            }
          >
            <Text style={styles.cardTitle}>
              {item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1)}
            </Text>
            <Text style={styles.cardSubtitle}>{item.descripcion}</Text>
            <Text style={styles.cardDate}>🗓 {item.fecha}</Text>
            <Text style={styles.cardDoctor}>👨‍⚕️ {item.doctor}</Text>
            <Text style={styles.cardPatient}>👤 {item.paciente}</Text>

            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={() => editarRegistro(item)}
                style={styles.editButton}
              >
                <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => eliminarRegistro(item.id)}
                style={styles.deleteButton}
              >
                <MaterialCommunityIcons name="delete" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay registros médicos aún.</Text>
        }
      />

      {/* ➕ Botón flotante */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </TouchableOpacity>

      {/* 🩹 Modal con Picker */}
      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>
            {editMode ? "Editar Registro" : "Nuevo Registro Médico"}
          </Text>

          {/* ⬇️ Picker (ComboBox) */}
          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Tipo de registro:</Text>
            <Picker
              selectedValue={nuevoRegistro.tipo}
              onValueChange={(value) =>
                setNuevoRegistro({ ...nuevoRegistro, tipo: value })
              }
              style={styles.picker}
            >
              <Picker.Item label="Consulta" value="consulta" />
              <Picker.Item label="Receta" value="receta" />
              <Picker.Item label="Resultado de prueba" value="resultado" />
              <Picker.Item label="Examen" value="examen" />
            </Picker>
          </View>

          <TextInput
            placeholder="Descripción breve"
            style={styles.input}
            value={nuevoRegistro.descripcion}
            onChangeText={(text) =>
              setNuevoRegistro({ ...nuevoRegistro, descripcion: text })
            }
          />
          <TextInput
            placeholder="Detalles del registro"
            style={[styles.input, { height: 100 }]}
            multiline
            value={nuevoRegistro.detalles}
            onChangeText={(text) =>
              setNuevoRegistro({ ...nuevoRegistro, detalles: text })
            }
          />
          <TextInput
            placeholder="Nombre del Doctor"
            style={styles.input}
            value={nuevoRegistro.doctor}
            onChangeText={(text) =>
              setNuevoRegistro({ ...nuevoRegistro, doctor: text })
            }
          />
          <TextInput
            placeholder="Nombre del Paciente"
            style={styles.input}
            value={nuevoRegistro.paciente}
            onChangeText={(text) =>
              setNuevoRegistro({ ...nuevoRegistro, paciente: text })
            }
          />

          <TouchableOpacity style={styles.saveButton} onPress={guardarRegistro}>
            <Text style={styles.saveText}>
              {editMode ? "Actualizar" : "Guardar"} Registro
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setModalVisible(false);
              setEditMode(false);
              setRegistroEditando(null);
            }}
          >
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

// 🎨 Estilos
const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, padding: 20, backgroundColor: "#EAEEFFFF" },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#005187",
    textAlign: "center",
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  cardTitle: { fontSize: 20, fontWeight: "bold", color: "#333" },
  cardSubtitle: { fontSize: 16, color: "#555" },
  cardDate: { fontSize: 14, color: "#888", marginTop: 5 },
  cardDoctor: { fontSize: 14, color: "#005187" },
  cardPatient: { fontSize: 14, color: "#444" },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  editButton: {
    backgroundColor: "#2b8",
    padding: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: "red",
    padding: 8,
    borderRadius: 8,
  },
  fab: {
    position: "absolute",
    bottom: 25,
    right: 25,
    backgroundColor: "#005187",
    borderRadius: 30,
    padding: 16,
    elevation: 5,
  },
  modalContainer: { flex: 1, padding: 20, backgroundColor: "#fff" },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#005187",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 10,
    marginTop: 10,
  },
  saveButton: {
    backgroundColor: "#2b8",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  saveText: { color: "#fff", textAlign: "center", fontSize: 18 },
  cancelButton: { marginTop: 10 },
  cancelText: {
    color: "red",
    textAlign: "center",
    fontSize: 16,
    textDecorationLine: "underline",
  },
  emptyText: { textAlign: "center", marginTop: 20, color: "#777" },
});

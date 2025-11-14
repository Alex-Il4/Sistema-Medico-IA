import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert } from "react-native";
import { db } from "../../db/firebaseConfig";
import { ref, push, onValue } from "firebase/database";
import { Picker } from "@react-native-picker/picker";

export default function RecetasScreen({ route }) {
  const { user } = route.params;
  const [recetas, setRecetas] = useState([]);
  const [pacienteId, setPacienteId] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [pacientes, setPacientes] = useState([]);

  useEffect(() => {
    if (user.type === "doctor") {
      const refCitas = ref(db, "citas/");
      const refUsers = ref(db, "users/");
      let listaPacientes = [];

      // Cargar pacientes desde las citas
      onValue(refCitas, (snapshot) => {
        const data = snapshot.val() || {};
        listaPacientes = Object.values(data)
          .filter((c) => c.doctorId === user.uid)
          .map((c) => ({ id: c.pacienteId, nombre: c.pacienteName }));

        // Luego agregar también los pacientes del nodo "users"
        onValue(refUsers, (snap2) => {
          const usersData = snap2.val() || {};
          const pacientesUsers = Object.values(usersData)
            .filter((u) => u.type === "paciente")
            .map((u) => ({ id: u.uid, nombre: u.name }));

          const combinados = [...listaPacientes, ...pacientesUsers];
          const unicos = combinados.filter(
            (v, i, a) => a.findIndex((t) => t.id === v.id) === i
          );
          setPacientes(unicos);
        });
      });
    }

    // Cargar recetas existentes
    const recetasRef = ref(db, "recetas/");
    onValue(recetasRef, (snapshot) => {
      const data = snapshot.val() || {};
      const lista = Object.keys(data)
        .map((key) => ({ id: key, ...data[key] }))
        .filter((r) =>
          user.type === "doctor"
            ? r.doctorId === user.uid
            : r.pacienteId === user.uid
        );
      setRecetas(lista);
    });
  }, [user]);


  const agregarReceta = async () => {
    if (!pacienteId || !descripcion.trim()) {
      Alert.alert("Error", "Completa todos los campos.");
      return;
    }

    const recetaData = {
      pacienteId,
      doctorId: user.uid,
      doctorName: user.name,
      descripcion,
      fecha: new Date().toISOString(),
    };

    try {
      await push(ref(db, "recetas/"), recetaData);
      Alert.alert("Éxito", "Receta agregada correctamente.");
      setPacienteId("");
      setDescripcion("");
    } catch (err) {
      Alert.alert("Error", "No se pudo guardar la receta.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recetas Electrónicas</Text>

      {user.type === "doctor" && (
        <>
          <Text style={{ fontWeight: "600", marginBottom: 6 }}>Selecciona paciente:</Text>
          <View style={{ backgroundColor: "#fff", borderRadius: 8, marginBottom: 10 }}>
            <Picker selectedValue={pacienteId} onValueChange={(v) => setPacienteId(v)}>
              <Picker.Item label="Seleccione paciente" value="" />
              {pacientes.map((p) => (
                <Picker.Item key={p.id} label={p.nombre} value={p.id} />
              ))}
            </Picker>
          </View>

          <TextInput
            placeholder="Descripción de la receta"
            style={[styles.input, { height: 80 }]}
            multiline
            value={descripcion}
            onChangeText={setDescripcion}
          />
          <TouchableOpacity style={styles.btn} onPress={agregarReceta}>
            <Text style={styles.btnText}>Guardar Receta</Text>
          </TouchableOpacity>
        </>
      )}

      <FlatList
        data={recetas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Dr. {item.doctorName}</Text>
            <Text>{item.descripcion}</Text>
            <Text style={styles.fecha}>{new Date(item.fecha).toLocaleString()}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F5F8FF" },
  title: { fontSize: 22, fontWeight: "bold", color: "#007ACC", marginBottom: 12 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderColor: "#ccc",
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  btn: {
    backgroundColor: "#007ACC",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  btnText: { color: "#fff", fontWeight: "bold" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderColor: "#ddd",
    borderWidth: 1,
  },
  cardTitle: { fontWeight: "bold", marginBottom: 4 },
  fecha: { color: "#777", marginTop: 4, fontSize: 12 },
});

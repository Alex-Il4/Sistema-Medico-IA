import React, { useState, useEffect } from "react";
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from "react-native";
import { db } from "../../db/firebaseConfig";
import { ref, onValue } from "firebase/database";
import { useNavigation } from "@react-navigation/native";

export default function DoctorSearchScreen({ route }) {
  const { user: currentUser } = route.params || {};
  const navigation = useNavigation();
  const [doctors, setDoctors] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const doctorsRef = ref(db, "users");
    const unsubscribe = onValue(doctorsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const doctorList = Object.keys(data)
        .filter((key) => data[key].type === "doctor")
        .map((key) => ({ id: key, ...data[key] }));
      setDoctors(doctorList);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading)
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#007ACC" />
        <Text>Cargando médicos...</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Buscar médico por nombre o especialidad"
        value={searchText}
        onChangeText={setSearchText}
      />

      <FlatList
        data={doctors.filter(
          (d) =>
            d.name.toLowerCase().includes(searchText.toLowerCase()) ||
            d.especialidad.toLowerCase().includes(searchText.toLowerCase())
        )}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate("CitaAgendar", {
                doctor: item,
                user: currentUser,  // aqui me daba error para agendar xd
              })
            }        >
            <Image
              source={{ uri: item.photo || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" }}
              style={styles.photo}
            />
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.sub}>{item.especialidad}</Text>
              <Text style={styles.sub}>{item.idioma}</Text>
              <Text style={styles.status}>
                {item.estado === "disponible" ? "🟢 Disponible" : "🔴 No disponible"}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F5F8FF" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  search: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 12,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    alignItems: "center",
    elevation: 2,
  },
  photo: { width: 60, height: 60, borderRadius: 30, marginRight: 10 },
  name: { fontSize: 16, fontWeight: "bold" },
  sub: { color: "#555" },
  status: { marginTop: 4, fontWeight: "600" },
});

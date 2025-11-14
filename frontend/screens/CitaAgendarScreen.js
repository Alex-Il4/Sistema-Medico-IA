import React, { useState, useEffect } from "react";
import {View, Text, TouchableOpacity, StyleSheet, Alert} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { db } from "../../db/firebaseConfig";
import { ref, push, onValue } from "firebase/database";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";

export default function CitaAgendarScreen({ route }) {
  const navigation = useNavigation();
  const { doctor, user } = route.params || {};

  const [fecha, setFecha] = useState(new Date());
  const [mostrarFecha, setMostrarFecha] = useState(false);
  const [mostrarHora, setMostrarHora] = useState(false);
  const [motivo, setMotivo] = useState("consulta");
  const [disponibilidad, setDisponibilidad] = useState([]);
  const [horariosOcupados, setHorariosOcupados] = useState([]);
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const [horaSeleccionada, setHoraSeleccionada] = useState(null);
  const [loading, setLoading] = useState(false);

  // aqui cargamos los horarios base del doctor
  useEffect(() => {
    if (!doctor?.id) return;
    const refDispo = ref(db, `disponibilidad/${doctor.id}`);
    const unsub = onValue(refDispo, (snapshot) => {
      const data = snapshot.val() || {};
      const lista = Object.values(data);
      setDisponibilidad(lista);
    });
    return () => unsub();
  }, [doctor]);

  // cargamos citas ocupadas para ese doctor
  useEffect(() => {
    if (!doctor?.id) return;
    const refCitas = ref(db, "citas/");
    const unsub = onValue(refCitas, (snapshot) => {
      const data = snapshot.val() || {};
      const ocupadas = Object.values(data)
        .filter((c) => c.doctorId === doctor.id)
        .map((c) => ({
          fecha: new Date(c.fecha).toDateString(),
          hora: c.hora,
        }));
      setHorariosOcupados(ocupadas);
    });
    return () => unsub();
  }, [doctor]);

  // yo le puse un intervalo de 30 minutos
  const generarIntervalos = (inicio, fin) => {
    const [hIni, mIni] = inicio.split(":").map(Number);
    const [hFin, mFin] = fin.split(":").map(Number);
    let resultado = [];
    let hora = new Date();
    hora.setHours(hIni, mIni, 0, 0);

    const horaFin = new Date();
    horaFin.setHours(hFin, mFin, 0, 0);

    while (hora < horaFin) {
      const siguiente = new Date(hora.getTime() + 30 * 60000);
      const texto = `${hora.getHours().toString().padStart(2, "0")}:${hora
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
      resultado.push(texto);
      hora = siguiente;
    }
    return resultado;
  };

  // generamos horarios disponibles para el día seleccionado 
  useEffect(() => {
    const diaSemana = [
      "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado",
    ][fecha.getDay()];

    const dispDia = disponibilidad.find((d) => d.dia === diaSemana);
    if (!dispDia) {
      setHorariosDisponibles([]);
      return;
    }

    const intervalos = generarIntervalos(dispDia.horaInicio, dispDia.horaFin);

    // se filtra si estan horarios  ocupados
    const fechaActual = fecha.toDateString();
    const libres = intervalos.map((h) => ({
      hora: h,
      ocupado: horariosOcupados.some(
        (c) => c.fecha === fechaActual && c.hora === h
      ),
    }));
    setHorariosDisponibles(libres);
  }, [fecha, disponibilidad, horariosOcupados]);

  const agendarCita = async () => {
    if (!user || !user.uid) return Alert.alert("Error", "Debes iniciar sesión.");
    if (!horaSeleccionada)
      return Alert.alert("Selecciona un horario disponible.");
    if (!motivo)
      return Alert.alert("Selecciona el motivo de la consulta.");

    setLoading(true);
    const citaData = {
      doctorId: doctor.id,
      doctorName: doctor.name,
      pacienteId: user.uid,
      pacienteName: user.name,
      fechaCreacion: new Date().toISOString(),
      fechaCita: fecha.toISOString(),
      hora: horaSeleccionada,
      motivo,
      estado: "pendiente",
    };


    try {
      await push(ref(db, "citas"), citaData);
      Alert.alert("✅ Cita registrada", "Tu cita ha sido agendada exitosamente.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error("❌ Error al registrar cita:", error);
      Alert.alert("Error", "No se pudo registrar la cita.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agendar cita con {doctor.name}</Text>

      <Text style={styles.label}>📅 Fecha de la cita</Text>
      <TouchableOpacity
        style={styles.input}
        onPress={() => setMostrarFecha(true)}
      >
        <Text>{fecha.toLocaleDateString()}</Text>
      </TouchableOpacity>

      {mostrarFecha && (
        <DateTimePicker
          value={fecha}
          mode="date"
          display="default"
          onChange={(e, selected) => {
            setMostrarFecha(false);
            if (selected) setFecha(selected);
          }}
        />
      )}

      <Text style={styles.label}>Motivo de la consulta</Text>
      <View style={styles.pickerBox}>
        <Picker selectedValue={motivo} onValueChange={setMotivo}>
          <Picker.Item label="Consulta médica" value="consulta" />
          <Picker.Item label="Recetas" value="recetas" />
          <Picker.Item label="Exámenes" value="examenes" />
          <Picker.Item label="Resultados de pruebas" value="resultados" />
        </Picker>
      </View>

      <Text style={styles.label}>🕐 Selecciona horario disponible</Text>
      {horariosDisponibles.length === 0 ? (
        <Text style={{ color: "#777" }}>No hay horarios disponibles para este día.</Text>
      ) : (
        <View style={styles.horariosContainer}>
          {horariosDisponibles.map((h) => (
            <TouchableOpacity
              key={h.hora}
              disabled={h.ocupado}
              onPress={() => setHoraSeleccionada(h.hora)}
              style={[
                styles.horaBtn,
                h.ocupado && { backgroundColor: "#ccc" },
                horaSeleccionada === h.hora && { backgroundColor: "#007ACC" },
              ]}
            >
              <Text
                style={{
                  color: h.ocupado
                    ? "#666"
                    : horaSeleccionada === h.hora
                      ? "#fff"
                      : "#333",
                }}
              >
                {h.hora}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.btn} onPress={agendarCita} disabled={loading}>
        <Text style={styles.btnText}>{loading ? "Agendando..." : "Confirmar Cita"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#F5F8FF" },
  title: { fontSize: 20, fontWeight: "bold", color: "#007ACC", marginBottom: 20 },
  label: { fontWeight: "600", marginTop: 10 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 10,
  },
  pickerBox: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 10,
  },
  horariosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 10,
  },
  horaBtn: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    width: "30%",
    alignItems: "center",
  },
  btn: {
    backgroundColor: "#007ACC",
    padding: 14,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});

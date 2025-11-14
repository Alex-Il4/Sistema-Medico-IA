import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { db } from '../../db/firebaseConfig'; // importar configuración de Firebase
import { ref, onValue } from 'firebase/database';

export default function DoctorSearchScreen({ navigation, route }) {
  const { currentUser } = route.params; // viene de la pantalla anterior
  const [doctors, setDoctors] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [loading, setLoading] = useState(true); // manejamos el estado de carga

  // fetch de doctores de firebase
  useEffect(() => {
    const doctorsRef = ref(db, 'users');
    const unsubscribe = onValue(doctorsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const doctorList = Object.keys(data)
        .filter(key => data[key].type === 'doctor') // solo doctores
        .map((key) => ({ id: key, ...data[key] }));

      setDoctors(doctorList);
      setLoading(false); // terminar la carga
    });

    return () => unsubscribe();
  }, []);

  // Filtrar medicos
  const filterDoctors = () => {
    return doctors.filter(doctor => {
      const matchesSpecialty = specialtyFilter ? doctor.especialidad.toLowerCase().includes(specialtyFilter.toLowerCase()) : true;
      const matchesLanguage = languageFilter ? doctor.idioma.toLowerCase().includes(languageFilter.toLowerCase()) : true;
      const matchesName = doctor.name.toLowerCase().includes(searchText.toLowerCase());

      return matchesSpecialty && matchesLanguage && matchesName;
    });
  };

  const handleStartChat = (doctor) => {
    navigation.navigate('Chat', {
      user: currentUser, //usuario logueado
      selectedUser: doctor, //doctor seleccionado
    });
  };
  const renderDoctorItem = ({ item }) => (
    <View style={styles.doctorItem}>
      <View style={styles.doctorInfo}>
        {/* Mostrar la foto de perfil del doctor, si existe */}
        <View style={styles.photoContainer}>
          {item.photo ? (
            <Image
              source={{ uri: item.photo }}
              style={styles.doctorPhoto}
            />
          ) : (
            <Image
              source={require('../../assets/default-avatar.png')} // Foto por defecto si no existe
              style={styles.doctorPhoto}
            />
          )}
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.doctorName}>{item.name}</Text>
          <Text style={styles.doctorDetails}>
            {item.especialidad} | {item.idioma}
          </Text>
          <Text style={styles.doctorLocation}>{item.ubicacion}</Text>

          {/* Estado del doctor */}
          {item.estado && (
            <Text
              style={[
                styles.estadoText,
                { color: item.estado === 'disponible' ? 'green' : 'red' },
              ]}
            >
              {item.estado === 'disponible' ? '🟢 Disponible' : '🔴 No disponible'}
            </Text>
          )}
        </View>
      </View>

    {/* <TouchableOpacity
      style={styles.chatButton}
      onPress={() => handleStartChat(item)}pasa todo el objeto del doctor
    >
      <Text style={styles.chatButtonText}>Chatear</Text>
    </TouchableOpacity> */}
    <TouchableOpacity
      style={[
        styles.chatButton,
        { backgroundColor: item.estado === 'disponible' ? '#6200EE' : '#ccc' },
      ]}
      disabled={item.estado !== 'disponible'}
      onPress={() => handleStartChat(item)}
    >
      <Text style={styles.chatButtonText}>
        {item.estado === 'disponible' ? 'Chatear' : 'No disponible'}
      </Text>
    </TouchableOpacity>

    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200EE" />
        <Text>Cargando médicos...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar médicos"
          value={searchText}
          onChangeText={setSearchText}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Filtrar por especialidad"
          value={specialtyFilter}
          onChangeText={setSpecialtyFilter}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Filtrar por idioma"
          value={languageFilter}
          onChangeText={setLanguageFilter}
        />
      </View>

      <FlatList
        data={filterDoctors()}
        renderItem={renderDoctorItem}
        keyExtractor={(item) => item.id}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 12,
    marginBottom: 8,
  },
  doctorItem: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 12,
    borderRadius: 8,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoContainer: {
    marginRight: 16,
  },
  doctorPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  detailsContainer: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  doctorDetails: {
    fontSize: 14,
    color: '#555',
  },
  doctorLocation: {
    fontSize: 14,
    color: '#888',
    marginVertical: 8,
  },
  chatButton: {
    backgroundColor: '#6200EE',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignItems: 'center',
  },
  chatButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
});

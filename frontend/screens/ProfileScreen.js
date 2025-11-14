import React, { useState, useEffect } from 'react';
import {View,Text,TextInput,TouchableOpacity,ScrollView,StyleSheet,Image,KeyboardAvoidingView,Platform,Alert,ActivityIndicator,} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { ref, set, get } from 'firebase/database';
import { db } from '../../db/firebaseConfig';

export default function ProfileScreen({ user }) {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    type: '',
    age: '',
    photo: null,
    estado: 'disponible',
    especialidad: '',
    ubicacion: '',
    idioma: '',
    lat: null,
    lng: null,
  });

  const [loadingLocation, setLoadingLocation] = useState(false);

  useEffect(() => {
    const userRef = ref(db, `users/${user.uid}`);
    get(userRef).then((snapshot) => {
      if (snapshot.exists()) {
        setProfile((prev) => ({ ...prev, ...snapshot.val() }));
      }
    });
  }, [user.uid]);

  //  Obtener ubicación actual
  const getCurrentLocation = async () => {
    try {
      setLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la ubicación');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Obtener dirección legible
      const addressResponse = await Location.reverseGeocodeAsync({ latitude, longitude });
      const address = addressResponse[0];
      const formattedAddress = `${address.city || ''}, ${address.region || ''}, ${address.country || ''}`;

      setProfile((prev) => ({
        ...prev,
        lat: latitude,
        lng: longitude,
        ubicacion: formattedAddress,
      }));
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo obtener la ubicación');
    } finally {
      setLoadingLocation(false);
    }
  };

  //  Conversión de imagen
  const uriToBase64 = async (uri) => {
    const response = await fetch(uri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara');
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled && result.assets?.length) uploadImage(result.assets[0].uri);
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permiso denegado', 'Se necesita acceso a la galería');
    const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!result.canceled && result.assets?.length) uploadImage(result.assets[0].uri);
  };

  const uploadImage = async (uri) => {
    try {
      const base64Image = await uriToBase64(uri);
      setProfile((prev) => ({ ...prev, photo: base64Image }));
      await set(ref(db, `users/${user.uid}/photo`), base64Image);
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'No se pudo actualizar la foto de perfil');
    }
  };

  const saveProfile = async () => {
    const userRef = ref(db, `users/${user.uid}`);
    try {
      await set(userRef, { ...profile, uid: user.uid });
      Alert.alert('✅ Perfil actualizado');
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'No se pudo guardar el perfil');
    }
  };

  const handleMapPress = (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setProfile((prev) => ({ ...prev, lat: latitude, lng: longitude }));
    reverseGeocode(latitude, longitude); // Revertir geocodificación para obtener dirección
  };

  const reverseGeocode = async (latitude, longitude) => {
    try {
      const addressResponse = await Location.reverseGeocodeAsync({ latitude, longitude });
      const address = addressResponse[0];
      const formattedAddress = `${address.city || ''}, ${address.region || ''}, ${address.country || ''}`;
      setProfile((prev) => ({ ...prev, ubicacion: formattedAddress }));
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'No se pudo obtener la dirección');
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.photoContainer}>
          <Image
            source={profile.photo ? { uri: profile.photo } : require('../../assets/default-avatar.png')}
            style={styles.photo}
          />
          <View style={styles.photoButtons}>
            <TouchableOpacity style={styles.photoBtn} onPress={pickFromCamera}>
              <Text style={styles.photoBtnText}>Cámara</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoBtn} onPress={pickFromGallery}>
              <Text style={styles.photoBtnText}>Galería</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          value={profile.name}
          onChangeText={(text) => setProfile({ ...profile, name: text })}
        />

        <Text style={styles.label}>Correo</Text>
        <TextInput style={[styles.input, { backgroundColor: '#eee' }]} value={profile.email} editable={false} />

        <Text style={styles.label}>Tipo de usuario</Text>
        <TextInput style={[styles.input, { backgroundColor: '#eee' }]} value={profile.type} editable={false} />

        <Text style={styles.label}>Edad</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={profile.age}
          onChangeText={(text) => setProfile({ ...profile, age: text })}
        />

        {profile.type === 'doctor' && (
          <>
            <Text style={styles.label}>Estado</Text>
            <TouchableOpacity
              style={[styles.input, { justifyContent: 'center' }]}
              onPress={() =>
                setProfile((prev) => ({
                  ...prev,
                  estado: prev.estado === 'disponible' ? 'no disponible' : 'disponible',
                }))
              }
            >
              <Text>{profile.estado}</Text>
            </TouchableOpacity>

            <Text style={styles.label}>Especialidad</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Cardiología"
              value={profile.especialidad}
              onChangeText={(text) => setProfile({ ...profile, especialidad: text })}
            />

            <Text style={styles.label}>Idioma</Text>
            <TextInput
              style={styles.input}
              value={profile.idioma}
              onChangeText={(text) => setProfile({ ...profile, idioma: text })}
            />

            <Text style={styles.label}>Ubicación</Text>
            <View style={{ marginBottom: 10 }}>
              <TouchableOpacity style={styles.locationBtn} onPress={getCurrentLocation}>
                <Text style={styles.locationBtnText}>📍 Obtener ubicación actual</Text>
              </TouchableOpacity>
              {loadingLocation ? (
                <ActivityIndicator size="small" color="#2b8" />
              ) : (
                <Text>{profile.ubicacion || 'No disponible'}</Text>
              )}
            </View>

            {profile.lat && profile.lng && (
              <MapView
                style={styles.map}
                region={{
                  latitude: profile.lat,
                  longitude: profile.lng,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                onPress={handleMapPress}
              >
                <Marker
                  coordinate={{ latitude: profile.lat, longitude: profile.lng }}
                  draggable
                  onDragEnd={(e) => {
                    const { latitude, longitude } = e.nativeEvent.coordinate;
                    setProfile((prev) => ({ ...prev, lat: latitude, lng: longitude }));
                    reverseGeocode(latitude, longitude); // Revertir geocodificación al soltar el marcador
                  }}
                />
              </MapView>
            )}
          </>
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={saveProfile}>
          <Text style={styles.saveBtnText}>Guardar cambios</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 50 },
  photoContainer: { alignItems: 'center', marginBottom: 20 },
  photo: { width: 120, height: 120, borderRadius: 60, marginBottom: 10 },
  photoButtons: { flexDirection: 'row', justifyContent: 'space-around', width: '60%' },
  photoBtn: { backgroundColor: '#2b8', padding: 10, borderRadius: 8 },
  photoBtnText: { color: '#fff', fontWeight: 'bold' },
  label: { fontWeight: '600', marginTop: 10, marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#CCC', borderRadius: 8, padding: 10, marginBottom: 10 },
  saveBtn: { backgroundColor: '#2b8', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  saveBtnText: { color: '#fff', fontWeight: '600' },
  locationBtn: {
    backgroundColor: '#2b8',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 6,
  },
  locationBtnText: { color: '#fff', fontWeight: 'bold' },
  map: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    marginBottom: 10,
  },
});

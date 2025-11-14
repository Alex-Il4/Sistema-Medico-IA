import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BottomMenu({ navigation, user }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.bottomMenu,
      {
        paddingBottom: Platform.OS === 'android' ? 10 : insets.bottom,
        height: 70 + (Platform.OS === 'android' ? 10 : insets.bottom),
      }
    ]}>
      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => navigation.navigate("Profile")}
      >
        <MaterialCommunityIcons name="account" size={24} color="#666" />
        <Text style={styles.menuText}>Perfil</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => navigation.navigate("Home")}
      >
        <MaterialCommunityIcons name="home" size={24} color="#666" />
        <Text style={styles.menuText}>Home</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() =>
          user?.type === "doctor"
            ? navigation.navigate("RecetaEmitir", { user })
            : navigation.navigate("RecetasPaciente", { user })
        }
      >
        <MaterialCommunityIcons name="pill" size={24} color="#666" />
        <Text style={styles.menuText}>Recetas</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.menuItem}
        onPress={() => navigation.navigate("Citas", { user })}
      >
        <MaterialCommunityIcons name="calendar" size={24} color="#666" />
        <Text style={styles.menuText}>Citas</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomMenu: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 10,
    paddingHorizontal: 5,
  },
  menuItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  menuText: {
    fontSize: 12,
    marginTop: 4,
    color: '#666',
    fontWeight: '500',
  },
});
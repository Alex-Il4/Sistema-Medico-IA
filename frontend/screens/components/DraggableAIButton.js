import React, { useRef, useState } from 'react';
import { StyleSheet, PanResponder, Dimensions, View, Animated } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const AI_BUTTON_SIZE = 60;
const PADDING = 10;

export default function DraggableAIButton({ navigation }) {
    const insets = useSafeAreaInsets();
    
    // 1. REEMPLAZO: Usamos Animated.ValueXY para la posición
    const pan = useRef(new Animated.ValueXY({
        x: width - AI_BUTTON_SIZE - PADDING, // Posición inicial derecha
        y: height / 2 - AI_BUTTON_SIZE / 2
    })).current;

    // 2. FUNCIÓN DE CLAMPING (restricción de límites)
    const clamp = (value, min, max) => {
        return Math.min(Math.max(value, min), max);
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            
            onPanResponderGrant: () => {
                // Guarda la posición actual de Animated.ValueXY como punto de inicio
                pan.setOffset({
                    x: pan.x._value,
                    y: pan.y._value,
                });
                pan.setValue({ x: 0, y: 0 }); // Reinicia el valor a cero (el movimiento será relativo al offset)
            },

            onPanResponderMove: (e, gestureState) => {
                
                // Límites: Calculados en cada movimiento para aplicar el CLAMP
                const MIN_X = PADDING;
                const MAX_X = width - AI_BUTTON_SIZE - PADDING;
                const MIN_Y = PADDING + insets.top;
                const MAX_Y = height - AI_BUTTON_SIZE - PADDING - insets.bottom;

                // Aplicar CLAMP a los valores de desplazamiento (dx/dy)
                // Se usa el valor de Animated.Value (pan.x._value) + el desplazamiento (gestureState.dx)
                const newX = clamp(pan.x._offset + gestureState.dx, MIN_X, MAX_X);
                const newY = clamp(pan.y._offset + gestureState.dy, MIN_Y, MAX_Y);

                // Mover el botón sin llamar a setPosition, usando Animated.Value
                pan.setValue({ x: newX - pan.x._offset, y: newY - pan.y._offset });
            },

            onPanResponderRelease: (e, gestureState) => {
                
                // Si fue un toque rápido (no arrastre), navegamos
                if (Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5) {
                    navigation.navigate('AIChat');
                    return;
                }
                
                // Guarda la posición final del movimiento
                pan.flattenOffset();
            }
        })
    ).current;

    const gradientColors = ['#007bff', '#8A2BE2', '#FF69B4']; 
    
    return (
        <Animated.View 
            {...panResponder.panHandlers}
            style={[
                styles.floatingAIButton,
                pan.getLayout() // Aplica la transformación { translateX, translateY }
            ]}
        >
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.linearGradient}
            >
                <MaterialIcons name="auto-awesome" size={28} color="#FFFFFF" />
            </LinearGradient>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    floatingAIButton: {
        position: 'absolute',
        width: AI_BUTTON_SIZE,
        height: AI_BUTTON_SIZE,
        borderRadius: AI_BUTTON_SIZE / 2, 
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 15, 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        zIndex: 9999,
    },
    linearGradient: {
        width: '100%',
        height: '100%',
        borderRadius: AI_BUTTON_SIZE / 2, 
        justifyContent: 'center',
        alignItems: 'center',
    },
});
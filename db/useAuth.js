import React, { 
    createContext, 
    useContext, 
    useState, 
    useEffect 
} from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth'; 
import { FIREBASE_APP } from './firebaseConfig';
// Asume que tienes inicializado Firebase en tu proyecto.
// Ejemplo: import { FIREBASE_APP } from './firebaseConfig'; 
// Reemplaza 'getAuth()' con 'getAuth(FIREBASE_APP)' si tienes una instancia específica.


// 1. Inicializar Firebase Auth
const auth = getAuth(FIREBASE_APP);

// 2. Crear el Contexto
const AuthContext = createContext({
    user: null, // Objeto de usuario de Firebase
    idToken: null, // Token JWT para el backend de Django
    isLoading: true, // Estado de carga inicial
});

// 3. Crear el Provider
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [idToken, setIdToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Suscribirse a los cambios de estado de autenticación
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            
            if (currentUser) {
                try {
                    // Obtener el ID Token (JWT) para enviarlo al backend de Django
                    const token = await currentUser.getIdToken();
                    setIdToken(token);
                } catch (error) {
                    console.error("Error al obtener Firebase ID Token:", error);
                    setIdToken(null);
                }
            } else {
                setIdToken(null);
            }

            setIsLoading(false);
        });

        // Desuscribirse cuando el componente se desmonte
        return unsubscribe;
    }, []);

    // La función refreshIdToken fuerza la obtención de un nuevo token si es necesario
    const refreshIdToken = async () => {
        if (user) {
            try {
                const token = await user.getIdToken(true); // Pasar 'true' para forzar el refresh
                setIdToken(token);
            } catch (error) {
                console.error("Error al refrescar Firebase ID Token:", error);
            }
        }
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            idToken, 
            isLoading, 
            refreshIdToken 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// 4. Crear el Hook
export const useAuth = () => {
    return useContext(AuthContext);
};
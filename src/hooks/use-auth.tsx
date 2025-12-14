
"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFirebase } from "@/firebase";
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut,
    User as FirebaseUser
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

type User = {
  email: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

const createInitialSettings = async (firestore: any, user: FirebaseUser) => {
    const userSettingsRef = doc(firestore, "userSettings", user.uid);
    try {
        await setDoc(userSettingsRef, {
            ownerId: user.uid,
            categories: [],
            sites: [],
        });
    } catch (error) {
        console.error("Error creating initial user settings:", error);
    }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { auth, firestore, user: firebaseUser, isUserLoading } = useFirebase();
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading) {
      if (firebaseUser) {
        setUser({ 
          email: firebaseUser.email || ''
        });
      } else {
        setUser(null);
      }
    }
  }, [firebaseUser, isUserLoading]);

  const login = async (email: string, pass: string) => {
    let authEmail = email;

    if (email === 'RajShah') {
        authEmail = 'rajshah@example.com';
    } else if (email === 'Karthik1983') {
        authEmail = 'karthik1983@example.com';
    } else if (!isValidEmail(email)) {
        authEmail = `${email.toLowerCase()}@example.com`;
    }
    
    try {
      await signInWithEmailAndPassword(auth, authEmail, pass);
      router.push("/");
      return true;
    } catch (error: any) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, authEmail, pass);
                // Create initial settings for the new user
                await createInitialSettings(firestore, userCredential.user);
                router.push("/");
                return true;
            } catch (signUpError) {
                console.error("Sign up error:", signUpError);
                return false;
            }
        }
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading: isUserLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

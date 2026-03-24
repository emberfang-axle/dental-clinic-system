import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);

      if (!currentUser) {
        setUser(null);
        setUserData(null);
        setLoading(false);
        return;
      }

      setUser(currentUser);

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();

          setUserData({
            ...data,
            uid: currentUser.uid,
            email: currentUser.email,
            fullName:
              data.fullName ||
              currentUser.displayName ||
              currentUser.email.split('@')[0],
            phone: data.phone || '',
            role: data.role || null,
          });
        } else {
          setUserData({
            uid: currentUser.uid,
            email: currentUser.email,
            fullName: currentUser.displayName || currentUser.email.split('@')[0],
            phone: '',
            role: null,
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUserData({
          uid: currentUser.uid,
          email: currentUser.email,
          fullName: currentUser.displayName || currentUser.email.split('@')[0],
          phone: '',
          role: null,
        });
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
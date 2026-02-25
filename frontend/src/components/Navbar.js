import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';

function Navbar() {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <nav className="navbar">
      <h1>🦷 Dental Clinic System</h1>
      <button onClick={handleLogout}>Logout</button>
    </nav>
  );
}

export default Navbar;
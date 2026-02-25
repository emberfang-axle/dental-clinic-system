import { 
  collection, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from './firebase';

// Create a new patient
export const createPatient = async (patientData) => {
  try {
    const docRef = await addDoc(collection(db, 'patients'), {
      ...patientData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Create patient error:', error);
    return { success: false, error: error.message };
  }
};

// Get all patients
export const getAllPatients = async () => {
  try {
    const q = query(collection(db, 'patients'), orderBy('fullName', 'asc'));
    const snapshot = await getDocs(q);
    const patients = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, data: patients };
  } catch (error) {
    console.error('Get patients error:', error);
    return { success: false, error: error.message };
  }
};

// Get patient by ID
export const getPatientById = async (patientId) => {
  try {
    const docRef = doc(db, 'patients', patientId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Patient not found' };
  } catch (error) {
    console.error('Get patient error:', error);
    return { success: false, error: error.message };
  }
};

// Update patient
export const updatePatient = async (patientId, updateData) => {
  try {
    await updateDoc(doc(db, 'patients', patientId), {
      ...updateData,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Update patient error:', error);
    return { success: false, error: error.message };
  }
};

// Delete patient
export const deletePatient = async (patientId) => {
  try {
    await deleteDoc(doc(db, 'patients', patientId));
    return { success: true };
  } catch (error) {
    console.error('Delete patient error:', error);
    return { success: false, error: error.message };
  }
};

// Search patients by name
export const searchPatients = async (searchTerm) => {
  try {
    const q = query(collection(db, 'patients'));
    const snapshot = await getDocs(q);
    const patients = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const filtered = patients.filter(patient =>
      patient.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone?.includes(searchTerm)
    );
    
    return { success: true, data: filtered };
  } catch (error) {
    console.error('Search patients error:', error);
    return { success: false, error: error.message };
  }
};

// Get patient by email
export const getPatientByEmail = async (email) => {
  try {
    const q = query(collection(db, 'patients'), where('email', '==', email));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { success: true, data: { id: doc.id, ...doc.data() } };
    }
    return { success: false, error: 'Patient not found' };
  } catch (error) {
    console.error('Get patient by email error:', error);
    return { success: false, error: error.message };
  }
};

// Get patient appointments
export const getPatientAppointments = async (patientId) => {
  try {
    const q = query(
      collection(db, 'appointments'),
      where('patientId', '==', patientId),
      orderBy('date', 'desc')
    );
    const snapshot = await getDocs(q);
    const appointments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, data: appointments };
  } catch (error) {
    console.error('Get patient appointments error:', error);
    return { success: false, error: error.message };
  }
};

// Get patient bills
export const getPatientBills = async (patientId) => {
  try {
    const q = query(
      collection(db, 'billing'),
      where('patientId', '==', patientId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const bills = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, data: bills };
  } catch (error) {
    console.error('Get patient bills error:', error);
    return { success: false, error: error.message };
  }
};

// Get total patients count
export const getTotalPatientsCount = async () => {
  try {
    const q = query(collection(db, 'patients'));
    const snapshot = await getDocs(q);
    return { success: true, data: snapshot.size };
  } catch (error) {
    console.error('Get total patients count error:', error);
    return { success: false, error: error.message };
  }
};

export default {
  createPatient,
  getAllPatients,
  getPatientById,
  updatePatient,
  deletePatient,
  searchPatients,
  getPatientByEmail,
  getPatientAppointments,
  getPatientBills,
  getTotalPatientsCount
};
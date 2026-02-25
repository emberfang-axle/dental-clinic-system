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
  orderBy,
  limit 
} from 'firebase/firestore';
import { db } from './firebase';

// Create a new appointment
export const createAppointment = async (appointmentData) => {
  try {
    const docRef = await addDoc(collection(db, 'appointments'), {
      ...appointmentData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Create appointment error:', error);
    return { success: false, error: error.message };
  }
};

// Get all appointments
export const getAllAppointments = async () => {
  try {
    const q = query(collection(db, 'appointments'), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    const appointments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, data: appointments };
  } catch (error) {
    console.error('Get appointments error:', error);
    return { success: false, error: error.message };
  }
};

// Get appointments by user ID
export const getAppointmentsByUser = async (userId, role) => {
  try {
    let q;
    
    if (role === 'patient') {
      q = query(
        collection(db, 'appointments'),
        where('patientId', '==', userId),
        orderBy('date', 'desc')
      );
    } else if (role === 'doctor') {
      q = query(
        collection(db, 'appointments'),
        where('doctorId', '==', userId),
        orderBy('date', 'desc')
      );
    } else {
      q = query(collection(db, 'appointments'), orderBy('date', 'desc'));
    }

    const snapshot = await getDocs(q);
    const appointments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, data: appointments };
  } catch (error) {
    console.error('Get appointments by user error:', error);
    return { success: false, error: error.message };
  }
};

// Get today's appointments
export const getTodayAppointments = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, 'appointments'),
      where('date', '==', today),
      orderBy('time', 'asc')
    );
    const snapshot = await getDocs(q);
    const appointments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, data: appointments };
  } catch (error) {
    console.error('Get today appointments error:', error);
    return { success: false, error: error.message };
  }
};

// Get appointment by ID
export const getAppointmentById = async (appointmentId) => {
  try {
    const docRef = doc(db, 'appointments', appointmentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Appointment not found' };
  } catch (error) {
    console.error('Get appointment error:', error);
    return { success: false, error: error.message };
  }
};

// Update appointment
export const updateAppointment = async (appointmentId, updateData) => {
  try {
    await updateDoc(doc(db, 'appointments', appointmentId), {
      ...updateData,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Update appointment error:', error);
    return { success: false, error: error.message };
  }
};

// Update appointment status
export const updateAppointmentStatus = async (appointmentId, status) => {
  try {
    await updateDoc(doc(db, 'appointments', appointmentId), {
      status,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Update status error:', error);
    return { success: false, error: error.message };
  }
};

// Delete appointment
export const deleteAppointment = async (appointmentId) => {
  try {
    await deleteDoc(doc(db, 'appointments', appointmentId));
    return { success: true };
  } catch (error) {
    console.error('Delete appointment error:', error);
    return { success: false, error: error.message };
  }
};

// Get appointments by date
export const getAppointmentsByDate = async (date) => {
  try {
    const q = query(
      collection(db, 'appointments'),
      where('date', '==', date),
      orderBy('time', 'asc')
    );
    const snapshot = await getDocs(q);
    const appointments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, data: appointments };
  } catch (error) {
    console.error('Get appointments by date error:', error);
    return { success: false, error: error.message };
  }
};

export default {
  createAppointment,
  getAllAppointments,
  getAppointmentsByUser,
  getTodayAppointments,
  getAppointmentById,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  getAppointmentsByDate
};
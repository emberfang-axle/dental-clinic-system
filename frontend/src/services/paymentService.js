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

// Service prices
export const SERVICE_PRICES = {
  'Check-up': 500,
  'Cleaning': 1500,
  'Tooth Extraction': 2000,
  'Fillings': 1000,
  'Braces': 25000,
  'Root Canal': 5000,
  'Whitening': 3000,
  'Dental Crown': 8000,
  'Implant': 15000,
  'X-Ray': 500,
  'Consultation': 300
};

// Create a new bill
export const createBill = async (billData) => {
  try {
    const docRef = await addDoc(collection(db, 'billing'), {
      ...billData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Create bill error:', error);
    return { success: false, error: error.message };
  }
};

// Get all bills
export const getAllBills = async () => {
  try {
    const q = query(collection(db, 'billing'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const bills = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, data: bills };
  } catch (error) {
    console.error('Get bills error:', error);
    return { success: false, error: error.message };
  }
};

// Get bills by patient ID
export const getBillsByPatient = async (patientId) => {
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

// Get bill by ID
export const getBillById = async (billId) => {
  try {
    const docRef = doc(db, 'billing', billId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    }
    return { success: false, error: 'Bill not found' };
  } catch (error) {
    console.error('Get bill error:', error);
    return { success: false, error: error.message };
  }
};

// Update bill
export const updateBill = async (billId, updateData) => {
  try {
    await updateDoc(doc(db, 'billing', billId), {
      ...updateData,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Update bill error:', error);
    return { success: false, error: error.message };
  }
};

// Process payment
export const processPayment = async (billId, paymentMethod, gcashRef = null) => {
  try {
    const paymentData = {
      paymentStatus: 'paid',
      paymentMethod,
      paymentDate: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (gcashRef) {
      paymentData.gcashReference = gcashRef;
    }

    await updateDoc(doc(db, 'billing', billId), paymentData);
    return { success: true };
  } catch (error) {
    console.error('Process payment error:', error);
    return { success: false, error: error.message };
  }
};

// Delete bill
export const deleteBill = async (billId) => {
  try {
    await deleteDoc(doc(db, 'billing', billId));
    return { success: true };
  } catch (error) {
    console.error('Delete bill error:', error);
    return { success: false, error: error.message };
  }
};

// Get total revenue
export const getTotalRevenue = async () => {
  try {
    const q = query(collection(db, 'billing'), where('paymentStatus', '==', 'paid'));
    const snapshot = await getDocs(q);
    const bills = snapshot.docs.map(doc => doc.data());
    const total = bills.reduce((sum, bill) => sum + (parseFloat(bill.amount) || 0), 0);
    return { success: true, data: total };
  } catch (error) {
    console.error('Get total revenue error:', error);
    return { success: false, error: error.message };
  }
};

// Get pending payments
export const getPendingPayments = async () => {
  try {
    const q = query(collection(db, 'billing'), where('paymentStatus', '==', 'pending'));
    const snapshot = await getDocs(q);
    const bills = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, data: bills };
  } catch (error) {
    console.error('Get pending payments error:', error);
    return { success: false, error: error.message };
  }
};

// GCash payment integration (Placeholder)
// In production, you would integrate with GCash API
export const initiateGCashPayment = async (amount, billId) => {
  try {
    // This is a placeholder for GCash API integration
    // In production, you would:
    // 1. Call your backend API
    // 2. Generate GCash payment link
    // 3. Redirect user to GCash
    
    console.log('Initiating GCash payment:', { amount, billId });
    
    return { 
      success: true, 
      data: {
        paymentUrl: 'https://www.gcash.com',
        reference: `GCASH-${Date.now()}`
      }
    };
  } catch (error) {
    console.error('GCash payment error:', error);
    return { success: false, error: error.message };
  }
};

// Verify GCash payment
export const verifyGCashPayment = async (reference) => {
  try {
    // This would verify payment with GCash API
    // Placeholder implementation
    return { success: true, data: { status: 'paid' } };
  } catch (error) {
    console.error('Verify GCash payment error:', error);
    return { success: false, error: error.message };
  }
};

export default {
  SERVICE_PRICES,
  createBill,
  getAllBills,
  getBillsByPatient,
  getBillById,
  updateBill,
  processPayment,
  deleteBill,
  getTotalRevenue,
  getPendingPayments,
  initiateGCashPayment,
  verifyGCashPayment
};
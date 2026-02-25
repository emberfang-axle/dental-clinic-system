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

// Get paid payments
export const getPaidPayments = async () => {
  try {
    const q = query(collection(db, 'billing'), where('paymentStatus', '==', 'paid'));
    const snapshot = await getDocs(q);
    const bills = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, data: bills };
  } catch (error) {
    console.error('Get paid payments error:', error);
    return { success: false, error: error.message };
  }
};

// Get bills by date range
export const getBillsByDateRange = async (startDate, endDate) => {
  try {
    const q = query(
      collection(db, 'billing'),
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const bills = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return { success: true, data: bills };
  } catch (error) {
    console.error('Get bills by date range error:', error);
    return { success: false, error: error.message };
  }
};

// Get revenue by date range
export const getRevenueByDateRange = async (startDate, endDate) => {
  try {
    const bills = await getBillsByDateRange(startDate, endDate);
    if (bills.success) {
      const paidBills = bills.data.filter(bill => bill.paymentStatus === 'paid');
      const total = paidBills.reduce((sum, bill) => sum + (parseFloat(bill.amount) || 0), 0);
      return { success: true, data: total };
    }
    return { success: false, error: bills.error };
  } catch (error) {
    console.error('Get revenue by date range error:', error);
    return { success: false, error: error.message };
  }
};

// Get payment methods breakdown
export const getPaymentMethodsBreakdown = async () => {
  try {
    const q = query(collection(db, 'billing'), where('paymentStatus', '==', 'paid'));
    const snapshot = await getDocs(q);
    const bills = snapshot.docs.map(doc => doc.data());
    
    const breakdown = bills.reduce((acc, bill) => {
      const method = bill.paymentMethod || 'unknown';
      acc[method] = (acc[method] || 0) + (parseFloat(bill.amount) || 0);
      return acc;
    }, {});
    
    return { success: true, data: breakdown };
  } catch (error) {
    console.error('Get payment methods breakdown error:', error);
    return { success: false, error: error.message };
  }
};

// Get monthly revenue
export const getMonthlyRevenue = async (year, month) => {
  try {
    const startDate = new Date(year, month - 1, 1).toISOString();
    const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();
    
    const revenue = await getRevenueByDateRange(startDate, endDate);
    return revenue;
  } catch (error) {
    console.error('Get monthly revenue error:', error);
    return { success: false, error: error.message };
  }
};

// GCash payment integration (Placeholder)
export const initiateGCashPayment = async (amount, billId) => {
  try {
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
    return { success: true, data: { status: 'paid' } };
  } catch (error) {
    console.error('Verify GCash payment error:', error);
    return { success: false, error: error.message };
  }
};

// Generate invoice number
export const generateInvoiceNumber = async () => {
  try {
    const q = query(collection(db, 'billing'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const bills = snapshot.docs.map(doc => doc.data());
    
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = bills.length + 1;
    const invoiceNumber = `INV-${year}${month}-${String(count).padStart(4, '0')}`;
    
    return { success: true, data: invoiceNumber };
  } catch (error) {
    console.error('Generate invoice number error:', error);
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
  getPaidPayments,
  getBillsByDateRange,
  getRevenueByDateRange,
  getPaymentMethodsBreakdown,
  getMonthlyRevenue,
  initiateGCashPayment,
  verifyGCashPayment,
  generateInvoiceNumber
};
import { useState } from 'react';
import { auth, db } from '../../../firebase';
import { setDoc, doc } from 'firebase/firestore';

export default function StoreForm() {
  const [storeName, setStoreName] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!storeName || !address) {
      setError('Please fill in all fields');
      return;
    }

    try {
      // Save store data to Firestore
      await setDoc(doc(db, 'stores', auth.currentUser.uid), {
        storeName,
        address,
        userId: auth.currentUser.uid,
        verificationStatus: 'Pending',
      });

      // Redirect to next step (e.g., upload documents)
      window.location.href = '/register/docs';
    } catch (err) {
      setError('Error saving data');
    }
  };

  return (
    <div>
      <h2>Store Registration</h2>
      <form onSubmit={handleSubmit}>
        <label>Store Name</label>
        <input
          type="text"
          value={storeName}
          onChange={(e) => setStoreName(e.target.value)}
          required
        />
        
        <label>Address</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />
        
        <button type="submit">Submit</button>
      </form>
      {error && <p>{error}</p>}
    </div>
  );
}

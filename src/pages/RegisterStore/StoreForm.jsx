import React, { useState } from 'react';

export default function StoreForm() {
  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Store Registered!\nName: ${storeName}\nOwner: ${ownerName}`);
    setStoreName('');
    setOwnerName('');
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>Store Form</h1>
      <form onSubmit={handleSubmit} style={{ display: 'inline-block', marginTop: '20px' }}>
        <input type="text" placeholder="Store Name" value={storeName} onChange={e => setStoreName(e.target.value)} required /><br /><br />
        <input type="text" placeholder="Owner Name" value={ownerName} onChange={e => setOwnerName(e.target.value)} required /><br /><br />
        <button type="submit">Register Store</button>
      </form>
    </div>
  );
}

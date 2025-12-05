import React from 'react';
import { Link } from 'react-router-dom';

export default function RegisterStore() {
  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>Register Store</h1>
      <p>Click below to fill store details:</p>
      <Link to="/store-form">
        <button>Go to Store Form</button>
      </Link>
    </div>
  );
}

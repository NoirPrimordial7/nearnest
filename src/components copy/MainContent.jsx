import React from 'react';

export default function MainContent({ activePage }) {
  return (
    <div className="main-content">
      {activePage === 'dashboard' && <h2>Dashboard Content</h2>}
      {activePage === 'store-management' && <h2>Store Management Content</h2>}
      {activePage === 'document-verification' && <h2>Document Verification Content</h2>}
      {/* Add more cases for each page */}
    </div>
  );
}

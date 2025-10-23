import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase'; // Firebase initialization
import styles from './SignUp.module.css'; // Ensure this is created for styling

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // Redirect to admin dashboard after successful sign up
      window.location.href = '/admin';
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    // SignIn.jsx
    <div className={styles.authShell}>
      

    <div className={styles.container}>
      <main className={styles.card} role="main" aria-labelledby="title">
        <h1 id="title" className={styles.title}>Create Account</h1>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <label className={styles.label}>
            Email
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className={styles.input}
              placeholder="you@company.com"
            />
          </label>

          <label className={styles.label}>
            Password
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className={styles.input} 
              placeholder="••••••••"
            />
          </label>

          <label className={styles.label}>
            Confirm Password
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
              className={styles.input} 
              placeholder="••••••••"
            />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button className={styles.primary} type="submit">Create Account</button>

          <p className={styles.switch}>Already have an account? <a href="/signin" className={styles.link}>Sign In</a></p>
        </form>
      </main>
    </div>
    </div>
  );
}

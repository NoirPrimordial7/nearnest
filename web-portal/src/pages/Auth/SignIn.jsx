import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase';
import styles from './SignIn.module.css';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = '/admin';
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    }
  };

  return (
    <div className={styles.container}>
      <main className={styles.card} role="main" aria-labelledby="title">
        <h1 id="title" className={styles.title}>Sign In</h1>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <label className={styles.label}>
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
              placeholder="you@company.com"
            />
          </label>

          <label className={styles.label}>
            Password
            <div className={styles.passRow}>
              <input
                type={show ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={styles.input}
                placeholder="••••••••"
              />
              <button
                type="button"
                className={styles.eye}
                aria-label={show ? 'Hide password' : 'Show password'}
                onClick={() => setShow(s => !s)}
              >
                {show ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.primary}>Sign In</button>

          <p className={styles.switch}>
            Don’t have an account? <a href="/signup" className={styles.link}>Create one</a>
          </p>
        </form>
      </main>
    </div>
  );
}

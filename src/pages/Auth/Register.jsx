import { auth, db } from "../../firebase/firebase";  // your Firebase config file exporting auth & Firestore
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
// ... other imports (React, useState, etc.)

function Register() { 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // Optionally set display name
      await updateProfile(user, { displayName: name });

      // Prepare user profile data with default role
      const userData = {
        name: name,
        email: email,
        roles: ["user"],           // assign default 'user' role
        createdAt: Date.now()
      };
      // Save user profile in Firestore
      await setDoc(doc(db, "users", user.uid), userData);

      // Redirect or show success (you might navigate to home or login page)
      // e.g., navigate("/");  (if using react-router, ensure to import useNavigate)
    } catch (error) {
      console.error("Registration error:", error);
      // handle error (show message to user)
    }
  };

  return (
    <form onSubmit={handleRegister} className="authForm">
      <h2>Register</h2>
      <input 
        type="text" 
        placeholder="Name" 
        value={name} 
        onChange={e => setName(e.target.value)} 
        required />
      <input 
        type="email" 
        placeholder="Email" 
        value={email} 
        onChange={e => setEmail(e.target.value)} 
        required />
      <input 
        type="password" 
        placeholder="Password" 
        value={password} 
        onChange={e => setPassword(e.target.value)} 
        required />
      <button type="submit">Sign Up</button>
    </form>
  );
}

export default Register;

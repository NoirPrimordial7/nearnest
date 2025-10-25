import React, { useEffect, useRef } from "react";
import styles from "./OTPInput.module.css";

export default function OTPInput({ value, onChange, length = 6 }) {
  const inputs = useRef([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const setChar = (idx, ch) => {
    const v = (value || "").split("");
    v[idx] = ch.replace(/\D/g, "").slice(-1);
    onChange(v.join(""));
  };

  const onKey = (e, idx) => {
    if (e.key === "Backspace" && !value[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  return (
    <div className={styles.row}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          inputMode="numeric"
          maxLength={1}
          className={styles.box}
          value={(value || "")[i] || ""}
          onChange={(e) => {
            setChar(i, e.target.value);
            if (e.target.value && i < length - 1) inputs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => onKey(e, i)}
        />
      ))}
    </div>
  );
}

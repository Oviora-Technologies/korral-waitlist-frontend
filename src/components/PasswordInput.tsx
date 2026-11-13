import React, { useState, type InputHTMLAttributes } from 'react';
import './PasswordInput.css';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  visibilityLabel?: string;
};

export default function PasswordInput({ visibilityLabel = 'password', ...props }: Props) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-field">
      <input {...props} type={visible ? 'text' : 'password'} />
      <button
        className="password-visibility"
        type="button"
        onClick={() => setVisible(value => !value)}
        aria-label={`${visible ? 'Hide' : 'Show'} ${visibilityLabel}`}
        aria-controls={props.id}
        aria-pressed={visible}
        disabled={props.disabled}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
          {visible && <path d="m3 3 18 18" />}
        </svg>
      </button>
    </div>
  );
}

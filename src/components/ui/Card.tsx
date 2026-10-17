import React from 'react';
import styles from './Card.module.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '', ...rest }: CardProps): React.ReactElement {
  return (
    <div className={`${styles.card} ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}

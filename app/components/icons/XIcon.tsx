import React from 'react';
import BaseIcon from './BaseIcon';

interface Props {
  size?: number;
  className?: string;
}

const XIcon: React.FC<Props> = ({ size = 24, className }) => {
  return (
    <BaseIcon size={size} className={className}>
      <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.643 4.937c-.835.37-1.732.62-2.675.733.962-.576 1.664-1.48 2.033-2.53-.886.52-1.864.89-2.908 1.1-.828-.88-2.007-1.432-3.318-1.432-2.512 0-4.551 2.039-4.551 4.55a1.708 1.708 0 0 0 .145.856 4.534 4.534 0 0 1-3.332-1.684 4.534 4.534 0 0 1-.676 2.234c0 1.57 1.603 2.853 3.643 2.983-.789-.023-1.531-.242-2.163-.594v.057c0 2.193 1.567 4.01 3.643 4.437-.383.103-.783.156-1.196.156-.297 0-.587-.03-.864-.086.58 1.79 2.263 3.11 4.26 3.15A4.54 4.54 0 0 1 5.185 19.85a9.055 9.055 0 0 0 11.362-4.551c1.49-1.479 2.475-3.324 2.977-5.384a4.54 4.54 0 0 0 1.349-1.827l-.001-.079z"/>
      </svg>
    </BaseIcon>
  );
};

export default XIcon;

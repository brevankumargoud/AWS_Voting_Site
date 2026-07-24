import React from 'react';
import awsWebpLogo from '../assets/aws.webp';

export const AwsLogo = ({ className = "h-10 w-auto" }) => {
  return (
    <img
      src={awsWebpLogo}
      alt="AWS Logo"
      className={`object-contain max-w-full filter drop-shadow-md ${className}`}
    />
  );
};

export default AwsLogo;

import { useState, useEffect } from 'react';

const VOTER_ID_KEY = 'aws_voter_device_uuid';

export const useVoterId = () => {
  const [voterId, setVoterId] = useState('');

  useEffect(() => {
    let existingId = localStorage.getItem(VOTER_ID_KEY);
    if (!existingId) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        existingId = crypto.randomUUID();
      } else {
        existingId = `voter_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      }
      localStorage.setItem(VOTER_ID_KEY, existingId);
    }
    setVoterId(existingId);
  }, []);

  return voterId;
};

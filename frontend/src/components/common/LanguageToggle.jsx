import React, { useState } from 'react';
import { Button } from 'react-bootstrap';

const LanguageToggle = () => {
  const [language, setLanguage] = useState('en');

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  return (
    <Button variant="outline-light" onClick={toggleLanguage}>
      {language === 'en' ? '🇮🇳 हिंदी' : '🇬🇧 English'}
    </Button>
  );
};

export default LanguageToggle;
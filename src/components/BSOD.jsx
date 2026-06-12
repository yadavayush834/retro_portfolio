import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWindowManager } from '../context/WindowManagerContext';

export default function BSOD() {
  const { bsodActive, clearBsod } = useWindowManager();

  useEffect(() => {
    if (!bsodActive) return;
    
    const handleKey = () => {
      clearBsod();
    };

    const handleClick = () => {
      clearBsod();
    };

    document.addEventListener('keydown', handleKey);
    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('click', handleClick);
    };
  }, [bsodActive, clearBsod]);

  return (
    <AnimatePresence>
      {bsodActive && (
        <motion.div
          className="bsod"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3 } }}
        >
          <div className="bsod-title">Windows</div>
          <div className="bsod-text">
            A fatal exception 0E has occurred at 0028:C0011E36<br />
            in VxD VMM(01) + 00010E36.<br /><br />
            The current application will be terminated.<br /><br />
            * Press any key to terminate the current application.<br />
            * Press CTRL+ALT+DEL to restart your computer.<br />
            You will lose any unsaved information in all applications.
          </div>
          <div className="blink-text">
            Press any key to continue _
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

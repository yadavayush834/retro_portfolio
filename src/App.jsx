import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { WindowManagerProvider, useWindowManager } from './context/WindowManagerContext';
import BootScreen from './components/BootScreen';
import MatrixRain from './components/MatrixRain';
import DesktopIcons from './components/DesktopIcons';
import Taskbar from './components/Taskbar';
import Clippy from './components/Clippy';
import CRTOverlay from './components/CRTOverlay';
import BSOD from './components/BSOD';
import AboutWindow from './components/AboutWindow';
import ProjectsWindow from './components/ProjectsWindow';
import SkillsWindow from './components/SkillsWindow';
import ContactWindow from './components/ContactWindow';
import GrooveAmpWindow from './components/GrooveAmpWindow';
import NetScapeWindow from './components/NetScapeWindow';
import CinemaWindow from './components/CinemaWindow';
import TaskMasterWindow from './components/TaskMasterWindow';
import PaintWindow from './components/PaintWindow';
import SolitaireWindow from './components/SolitaireWindow';
import FlappyBirdWindow from './components/FlappyBirdWindow';
import ChessWindow from './components/ChessWindow';
import './styles/global.css';
import './styles/Apps.css';

function Desktop() {
  const { bootComplete, bsodActive } = useWindowManager();

  if (!bootComplete) return null;
  if (bsodActive) return null;

  return (
    <>
      <MatrixRain />
      <div className="desktop">
        <DesktopIcons />
        <AboutWindow />
        <ProjectsWindow />
        <SkillsWindow />
        <ContactWindow />
        <GrooveAmpWindow />
        <NetScapeWindow />
        <CinemaWindow />
        <TaskMasterWindow />
        <PaintWindow />
        <SolitaireWindow />
        <FlappyBirdWindow />
        <ChessWindow />
      </div>
      <Taskbar />
      <Clippy />
      <CRTOverlay />
    </>
  );
}

export default function App() {
  return (
    <WindowManagerProvider>
      <BootScreen />
      <Desktop />
      <BSOD />
    </WindowManagerProvider>
  );
}

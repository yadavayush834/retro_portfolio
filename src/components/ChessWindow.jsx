import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWindowManager } from '../context/WindowManagerContext';
import Window from './Window';

// Piece constants
const EMPTY = 0;
const W_PAWN = 1, W_ROOK = 2, W_KNIGHT = 3, W_BISHOP = 4, W_QUEEN = 5, W_KING = 6;
const B_PAWN = -1, B_ROOK = -2, B_KNIGHT = -3, B_BISHOP = -4, B_QUEEN = -5, B_KING = -6;

const PIECE_CHARS = {
  [W_KING]: '♔', [W_QUEEN]: '♕', [W_ROOK]: '♖', [W_BISHOP]: '♗', [W_KNIGHT]: '♘', [W_PAWN]: '♙',
  [B_KING]: '♚', [B_QUEEN]: '♛', [B_ROOK]: '♜', [B_BISHOP]: '♝', [B_KNIGHT]: '♞', [B_PAWN]: '♟',
};

const PIECE_VALUES = {
  [W_PAWN]: 10, [W_KNIGHT]: 30, [W_BISHOP]: 30, [W_ROOK]: 50, [W_QUEEN]: 90, [W_KING]: 900,
  [B_PAWN]: 10, [B_KNIGHT]: 30, [B_BISHOP]: 30, [B_ROOK]: 50, [B_QUEEN]: 90, [B_KING]: 900,
};

// Position bonuses for AI evaluation
const PAWN_TABLE = [
  [0,0,0,0,0,0,0,0],[5,5,5,5,5,5,5,5],[1,1,2,3,3,2,1,1],[0,0,1,2.5,2.5,1,0,0],
  [0,0,0,2,2,0,0,0],[0.5,-0.5,-1,0,0,-1,-0.5,0.5],[0.5,1,1,-2,-2,1,1,0.5],[0,0,0,0,0,0,0,0]
];

function initBoard() {
  return [
    [B_ROOK, B_KNIGHT, B_BISHOP, B_QUEEN, B_KING, B_BISHOP, B_KNIGHT, B_ROOK],
    [B_PAWN, B_PAWN, B_PAWN, B_PAWN, B_PAWN, B_PAWN, B_PAWN, B_PAWN],
    [0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],
    [W_PAWN, W_PAWN, W_PAWN, W_PAWN, W_PAWN, W_PAWN, W_PAWN, W_PAWN],
    [W_ROOK, W_KNIGHT, W_BISHOP, W_QUEEN, W_KING, W_BISHOP, W_KNIGHT, W_ROOK],
  ];
}

function cloneBoard(b) { return b.map(r => [...r]); }
function isWhite(p) { return p > 0; }
function isBlack(p) { return p < 0; }
function inBounds(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }

function getMovesForPiece(board, r, c, skipKingSafety = false) {
  const piece = board[r][c];
  if (piece === EMPTY) return [];
  const moves = [];
  const white = isWhite(piece);
  const friendly = (p) => white ? isWhite(p) : isBlack(p);
  const enemy = (p) => white ? isBlack(p) : isWhite(p);

  function addSliding(dirs) {
    for (const [dr, dc] of dirs) {
      for (let i = 1; i < 8; i++) {
        const nr = r + dr * i, nc = c + dc * i;
        if (!inBounds(nr, nc)) break;
        if (board[nr][nc] === EMPTY) { moves.push([nr, nc]); }
        else if (enemy(board[nr][nc])) { moves.push([nr, nc]); break; }
        else break;
      }
    }
  }

  const absP = Math.abs(piece);
  if (absP === 1) { // Pawn
    const dir = white ? -1 : 1;
    const startRow = white ? 6 : 1;
    if (inBounds(r + dir, c) && board[r + dir][c] === EMPTY) {
      moves.push([r + dir, c]);
      if (r === startRow && board[r + 2 * dir][c] === EMPTY) moves.push([r + 2 * dir, c]);
    }
    for (const dc of [-1, 1]) {
      if (inBounds(r + dir, c + dc) && enemy(board[r + dir][c + dc])) moves.push([r + dir, c + dc]);
    }
  } else if (absP === 2) { // Rook
    addSliding([[1,0],[-1,0],[0,1],[0,-1]]);
  } else if (absP === 3) { // Knight
    for (const [dr, dc] of [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]]) {
      const nr = r + dr, nc = c + dc;
      if (inBounds(nr, nc) && !friendly(board[nr][nc])) moves.push([nr, nc]);
    }
  } else if (absP === 4) { // Bishop
    addSliding([[1,1],[1,-1],[-1,1],[-1,-1]]);
  } else if (absP === 5) { // Queen
    addSliding([[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]);
  } else if (absP === 6) { // King
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = r + dr, nc = c + dc;
      if (inBounds(nr, nc) && !friendly(board[nr][nc])) moves.push([nr, nc]);
    }
  }

  if (skipKingSafety) return moves;

  // Filter moves that leave own king in check
  return moves.filter(([mr, mc]) => {
    const nb = cloneBoard(board);
    nb[mr][mc] = nb[r][c];
    nb[r][c] = EMPTY;
    // Pawn promotion
    if (Math.abs(piece) === 1 && (mr === 0 || mr === 7)) {
      nb[mr][mc] = white ? W_QUEEN : B_QUEEN;
    }
    return !isKingInCheck(nb, white);
  });
}

function isKingInCheck(board, whiteKing) {
  // Find king
  let kr = -1, kc = -1;
  const kingVal = whiteKing ? W_KING : B_KING;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if (board[r][c] === kingVal) { kr = r; kc = c; break; }
    if (kr >= 0) break;
  }
  if (kr < 0) return true; // King captured (shouldn't happen)

  // Check if any enemy piece attacks king
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = board[r][c];
    if (p === EMPTY) continue;
    if (whiteKing ? isBlack(p) : isWhite(p)) {
      const attacks = getMovesForPiece(board, r, c, true);
      if (attacks.some(([ar, ac]) => ar === kr && ac === kc)) return true;
    }
  }
  return false;
}

function getAllMoves(board, white) {
  const moves = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = board[r][c];
    if (p === EMPTY) continue;
    if (white ? isWhite(p) : isBlack(p)) {
      const pMoves = getMovesForPiece(board, r, c);
      for (const [mr, mc] of pMoves) moves.push({ fr: r, fc: c, tr: mr, tc: mc });
    }
  }
  return moves;
}

function evaluateBoard(board) {
  let score = 0;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = board[r][c];
    if (p === EMPTY) continue;
    const val = PIECE_VALUES[p] || 0;
    if (isWhite(p)) {
      score += val;
      if (Math.abs(p) === 1) score += (PAWN_TABLE[r]?.[c] || 0);
    } else {
      score -= val;
      if (Math.abs(p) === 1) score -= (PAWN_TABLE[7 - r]?.[c] || 0);
    }
  }
  return score;
}

function minimax(board, depth, alpha, beta, maximizing) {
  if (depth === 0) return evaluateBoard(board);

  const moves = getAllMoves(board, maximizing);
  if (moves.length === 0) {
    if (isKingInCheck(board, maximizing)) return maximizing ? -9999 : 9999;
    return 0; // Stalemate
  }

  if (maximizing) {
    let best = -Infinity;
    for (const m of moves) {
      const nb = cloneBoard(board);
      nb[m.tr][m.tc] = nb[m.fr][m.fc];
      nb[m.fr][m.fc] = EMPTY;
      if (Math.abs(nb[m.tr][m.tc]) === 1 && m.tr === 0) nb[m.tr][m.tc] = W_QUEEN;
      best = Math.max(best, minimax(nb, depth - 1, alpha, beta, false));
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const m of moves) {
      const nb = cloneBoard(board);
      nb[m.tr][m.tc] = nb[m.fr][m.fc];
      nb[m.fr][m.fc] = EMPTY;
      if (Math.abs(nb[m.tr][m.tc]) === 1 && m.tr === 7) nb[m.tr][m.tc] = B_QUEEN;
      best = Math.min(best, minimax(nb, depth - 1, alpha, beta, true));
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

function getAIMove(board) {
  const moves = getAllMoves(board, false);
  if (moves.length === 0) return null;
  let bestScore = Infinity;
  let bestMoves = [];
  for (const m of moves) {
    const nb = cloneBoard(board);
    nb[m.tr][m.tc] = nb[m.fr][m.fc];
    nb[m.fr][m.fc] = EMPTY;
    if (Math.abs(nb[m.tr][m.tc]) === 1 && m.tr === 7) nb[m.tr][m.tc] = B_QUEEN;
    const score = minimax(nb, 2, -Infinity, Infinity, true);
    if (score < bestScore) { bestScore = score; bestMoves = [m]; }
    else if (score === bestScore) bestMoves.push(m);
  }
  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}

function getGameStatus(board, whiteToMove) {
  const moves = getAllMoves(board, whiteToMove);
  if (moves.length > 0) {
    if (isKingInCheck(board, whiteToMove)) return 'check';
    return 'playing';
  }
  if (isKingInCheck(board, whiteToMove)) return whiteToMove ? 'black-wins' : 'white-wins';
  return 'stalemate';
}

export default function ChessWindow() {
  const { WINDOW_CONFIGS } = useWindowManager();
  const config = WINDOW_CONFIGS.chess;
  const [mode, setMode] = useState(null); // null = menu, 'single', 'multi'
  const [board, setBoard] = useState(initBoard);
  const [whiteToMove, setWhiteToMove] = useState(true);
  const [selected, setSelected] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [lastMove, setLastMove] = useState(null);
  const [animatingPiece, setAnimatingPiece] = useState(null);
  const [status, setStatus] = useState('playing');
  const [aiThinking, setAiThinking] = useState(false);
  const [capturedWhite, setCapturedWhite] = useState([]);
  const [capturedBlack, setCapturedBlack] = useState([]);

  const startGame = useCallback((m) => {
    setMode(m);
    setBoard(initBoard());
    setWhiteToMove(true);
    setSelected(null);
    setValidMoves([]);
    setLastMove(null);
    setAnimatingPiece(null);
    setStatus('playing');
    setAiThinking(false);
    setCapturedWhite([]);
    setCapturedBlack([]);
  }, []);

  const makeMove = useCallback((fr, fc, tr, tc, currentBoard) => {
    const nb = cloneBoard(currentBoard);
    const captured = nb[tr][tc];
    const piece = nb[fr][fc];
    nb[tr][tc] = piece;
    nb[fr][fc] = EMPTY;

    // Pawn promotion
    if (Math.abs(piece) === 1 && (tr === 0 || tr === 7)) {
      nb[tr][tc] = isWhite(piece) ? W_QUEEN : B_QUEEN;
    }

    // Track captured pieces
    if (captured !== EMPTY) {
      if (isWhite(captured)) {
        setCapturedWhite(prev => [...prev, captured]);
      } else {
        setCapturedBlack(prev => [...prev, captured]);
      }
    }

    return nb;
  }, []);

  const handleSquareClick = useCallback((r, c) => {
    if (status !== 'playing' && status !== 'check') return;
    if (aiThinking) return;
    if (mode === 'single' && !whiteToMove) return;

    const piece = board[r][c];

    if (selected) {
      // Check if this is a valid move
      if (validMoves.some(([mr, mc]) => mr === r && mc === c)) {
        // Animate the move
        setAnimatingPiece({ fr: selected[0], fc: selected[1], tr: r, tc: c, piece: board[selected[0]][selected[1]] });

        setTimeout(() => {
          const newBoard = makeMove(selected[0], selected[1], r, c, board);
          setBoard(newBoard);
          setLastMove({ fr: selected[0], fc: selected[1], tr: r, tc: c });
          setSelected(null);
          setValidMoves([]);
          setAnimatingPiece(null);

          const nextWhite = !whiteToMove;
          setWhiteToMove(nextWhite);
          const newStatus = getGameStatus(newBoard, nextWhite);
          setStatus(newStatus);

          // AI turn in single player
          if (mode === 'single' && nextWhite === false && (newStatus === 'playing' || newStatus === 'check')) {
            setAiThinking(true);
            setTimeout(() => {
              const aiMove = getAIMove(newBoard);
              if (aiMove) {
                setAnimatingPiece({ fr: aiMove.fr, fc: aiMove.fc, tr: aiMove.tr, tc: aiMove.tc, piece: newBoard[aiMove.fr][aiMove.fc] });
                setTimeout(() => {
                  const aiBoard = makeMove(aiMove.fr, aiMove.fc, aiMove.tr, aiMove.tc, newBoard);
                  setBoard(aiBoard);
                  setLastMove({ fr: aiMove.fr, fc: aiMove.fc, tr: aiMove.tr, tc: aiMove.tc });
                  setAnimatingPiece(null);
                  setWhiteToMove(true);
                  setStatus(getGameStatus(aiBoard, true));
                  setAiThinking(false);
                }, 250);
              } else {
                setAiThinking(false);
              }
            }, 300);
          }
        }, 200);
        return;
      }

      // Click on own piece to re-select
      if (piece !== EMPTY && ((whiteToMove && isWhite(piece)) || (!whiteToMove && isBlack(piece)))) {
        setSelected([r, c]);
        setValidMoves(getMovesForPiece(board, r, c));
        return;
      }

      setSelected(null);
      setValidMoves([]);
      return;
    }

    // Select own piece
    if (piece !== EMPTY && ((whiteToMove && isWhite(piece)) || (!whiteToMove && isBlack(piece)))) {
      setSelected([r, c]);
      setValidMoves(getMovesForPiece(board, r, c));
    }
  }, [board, selected, validMoves, whiteToMove, status, mode, aiThinking, makeMove]);

  const isValidTarget = useCallback((r, c) => validMoves.some(([mr, mc]) => mr === r && mc === c), [validMoves]);
  const isLastMoveSquare = useCallback((r, c) => {
    if (!lastMove) return false;
    return (r === lastMove.fr && c === lastMove.fc) || (r === lastMove.tr && c === lastMove.tc);
  }, [lastMove]);

  if (!mode) {
    return (
      <Window id="chess" title={config.title} defaultPos={config.defaultPos} defaultSize={config.defaultSize}>
        <div className="chess-menu">
          <div className="chess-menu-title">♛ Chess</div>
          <div className="chess-menu-subtitle">Select Mode</div>
          <div className="chess-mode-buttons">
            <button className="chess-mode-btn chess-mode-single" onClick={() => startGame('single')}>
              <span className="chess-mode-icon">🤖</span>
              <span className="chess-mode-label">Single Player</span>
              <span className="chess-mode-desc">Play vs AI</span>
            </button>
            <button className="chess-mode-btn chess-mode-multi" onClick={() => startGame('multi')}>
              <span className="chess-mode-icon">👥</span>
              <span className="chess-mode-label">Multiplayer</span>
              <span className="chess-mode-desc">Local 2 Player</span>
            </button>
          </div>
        </div>
      </Window>
    );
  }

  const statusText = {
    'playing': whiteToMove ? "White's turn" : "Black's turn",
    'check': `${whiteToMove ? 'White' : 'Black'} is in CHECK!`,
    'white-wins': '🎉 White wins by checkmate!',
    'black-wins': '🎉 Black wins by checkmate!',
    'stalemate': '🤝 Stalemate — Draw!',
  }[status] || '';

  return (
    <Window id="chess" title={config.title} defaultPos={config.defaultPos} defaultSize={config.defaultSize}>
      <div className="chess-game">
        {/* Captured pieces */}
        <div className="chess-captured">
          <span className="chess-captured-row">
            {capturedBlack.map((p, i) => <span key={i} className="chess-captured-piece">{PIECE_CHARS[p]}</span>)}
          </span>
        </div>

        {/* Board */}
        <div className="chess-board">
          {board.map((row, r) =>
            row.map((piece, c) => {
              const isDark = (r + c) % 2 === 1;
              const isSelected = selected && selected[0] === r && selected[1] === c;
              const isValid = isValidTarget(r, c);
              const isLast = isLastMoveSquare(r, c);
              const isAnimating = animatingPiece && animatingPiece.fr === r && animatingPiece.fc === c;

              return (
                <div
                  key={`${r}-${c}`}
                  className={`chess-square ${isDark ? 'chess-dark' : 'chess-light'} ${isSelected ? 'chess-selected' : ''} ${isLast ? 'chess-last-move' : ''}`}
                  onClick={() => handleSquareClick(r, c)}
                >
                  {isValid && (
                    <div className={`chess-valid-dot ${piece !== EMPTY ? 'chess-valid-capture' : ''}`} />
                  )}
                  {piece !== EMPTY && !isAnimating && (
                    <motion.span
                      className={`chess-piece ${isWhite(piece) ? 'chess-white-piece' : 'chess-black-piece'}`}
                      layoutId={`piece-${r}-${c}`}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    >
                      {PIECE_CHARS[piece]}
                    </motion.span>
                  )}
                  {animatingPiece && animatingPiece.tr === r && animatingPiece.tc === c && (
                    <motion.span
                      className={`chess-piece ${isWhite(animatingPiece.piece) ? 'chess-white-piece' : 'chess-black-piece'}`}
                      initial={{ scale: 1.3 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {PIECE_CHARS[animatingPiece.piece]}
                    </motion.span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Captured pieces */}
        <div className="chess-captured">
          <span className="chess-captured-row">
            {capturedWhite.map((p, i) => <span key={i} className="chess-captured-piece">{PIECE_CHARS[p]}</span>)}
          </span>
        </div>

        {/* Status bar */}
        <div className={`chess-status ${status === 'check' ? 'chess-check' : ''}`}>
          <span>{statusText}</span>
          {aiThinking && <span className="chess-thinking">🤔 AI thinking...</span>}
        </div>

        <div className="chess-actions">
          <button onClick={() => startGame(mode)}>🔄 New Game</button>
          <button onClick={() => setMode(null)}>← Mode Select</button>
          <span className="chess-mode-badge">{mode === 'single' ? '🤖 vs AI' : '👥 Local'}</span>
        </div>
      </div>
    </Window>
  );
}

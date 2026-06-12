import React, { useState, useCallback, useMemo } from 'react';
import { useWindowManager } from '../context/WindowManagerContext';
import Window from './Window';

const SUITS = ['♠', '♥', '♦', '♣'];
const SUIT_COLORS = { '♠': '#000', '♥': '#d00', '♦': '#d00', '♣': '#000' };
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (let r = 0; r < RANKS.length; r++) {
      deck.push({ suit, rank: RANKS[r], value: r + 1, faceUp: false, id: `${RANKS[r]}${suit}` });
    }
  }
  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function isRed(suit) { return suit === '♥' || suit === '♦'; }

function canStackOnTableau(card, target) {
  if (!target) return card.rank === 'K';
  return target.faceUp && isRed(card.suit) !== isRed(target.suit) && card.value === target.value - 1;
}

function canStackOnFoundation(card, topCard) {
  if (!topCard) return card.rank === 'A';
  return card.suit === topCard.suit && card.value === topCard.value + 1;
}

function initGame() {
  const deck = createDeck();
  const tableau = [[], [], [], [], [], [], []];
  let idx = 0;
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row <= col; row++) {
      const card = { ...deck[idx++] };
      card.faceUp = row === col;
      tableau[col].push(card);
    }
  }
  const stock = deck.slice(idx).map(c => ({ ...c, faceUp: false }));
  return { tableau, stock, waste: [], foundations: [[], [], [], []], moves: 0 };
}

function Card({ card, onClick, onDoubleClick, selected, small }) {
  if (!card) return null;

  if (!card.faceUp) {
    return (
      <div className={`sol-card sol-card-back ${selected ? 'sol-selected' : ''}`} onClick={onClick}>
        <div className="sol-card-pattern">🂠</div>
      </div>
    );
  }

  return (
    <div
      className={`sol-card sol-card-face ${selected ? 'sol-selected' : ''}`}
      style={{ color: SUIT_COLORS[card.suit] }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <div className="sol-card-corner sol-top-left">
        <div>{card.rank}</div>
        <div>{card.suit}</div>
      </div>
      <div className="sol-card-center">{card.suit}</div>
      <div className="sol-card-corner sol-bottom-right">
        <div>{card.rank}</div>
        <div>{card.suit}</div>
      </div>
    </div>
  );
}

export default function SolitaireWindow() {
  const { WINDOW_CONFIGS } = useWindowManager();
  const config = WINDOW_CONFIGS.solitaire;
  const [game, setGame] = useState(initGame);
  const [selected, setSelected] = useState(null); // { source, colIdx, cardIdx }
  const [won, setWon] = useState(false);

  const checkWin = useCallback((foundations) => {
    return foundations.every(f => f.length === 13);
  }, []);

  const handleNewGame = useCallback(() => {
    setGame(initGame());
    setSelected(null);
    setWon(false);
  }, []);

  const drawFromStock = useCallback(() => {
    setSelected(null);
    setGame(prev => {
      if (prev.stock.length === 0) {
        // Flip waste back to stock
        return {
          ...prev,
          stock: [...prev.waste].reverse().map(c => ({ ...c, faceUp: false })),
          waste: [],
        };
      }
      const stock = [...prev.stock];
      const card = { ...stock.pop(), faceUp: true };
      return { ...prev, stock, waste: [...prev.waste, card], moves: prev.moves + 1 };
    });
  }, []);

  const tryAutoFoundation = useCallback((card, source, colIdx, cardIdx) => {
    setGame(prev => {
      const foundations = prev.foundations.map(f => [...f]);
      for (let fi = 0; fi < 4; fi++) {
        const top = foundations[fi].length > 0 ? foundations[fi][foundations[fi].length - 1] : null;
        if (canStackOnFoundation(card, top)) {
          foundations[fi].push({ ...card });
          let newState = { ...prev, foundations, moves: prev.moves + 1 };

          if (source === 'waste') {
            const waste = [...prev.waste];
            waste.pop();
            newState.waste = waste;
          } else if (source === 'tableau') {
            const tableau = prev.tableau.map(col => [...col]);
            tableau[colIdx] = tableau[colIdx].slice(0, cardIdx);
            // Flip new last card
            if (tableau[colIdx].length > 0) {
              const last = { ...tableau[colIdx][tableau[colIdx].length - 1] };
              last.faceUp = true;
              tableau[colIdx][tableau[colIdx].length - 1] = last;
            }
            newState.tableau = tableau;
          }

          if (checkWin(foundations)) setWon(true);
          return newState;
        }
      }
      return prev;
    });
  }, [checkWin]);

  const handleCardClick = useCallback((source, colIdx, cardIdx) => {
    if (won) return;

    // Get the clicked card
    let clickedCard;
    if (source === 'waste') {
      clickedCard = game.waste[game.waste.length - 1];
    } else if (source === 'tableau') {
      clickedCard = game.tableau[colIdx][cardIdx];
    }

    if (!clickedCard || !clickedCard.faceUp) return;

    if (!selected) {
      setSelected({ source, colIdx, cardIdx });
      return;
    }

    // Try to place selected card(s) onto clicked location
    if (source === 'tableau') {
      setGame(prev => {
        const tableau = prev.tableau.map(col => [...col]);
        let cardsToMove;
        let sourceCards;

        if (selected.source === 'waste') {
          cardsToMove = [{ ...prev.waste[prev.waste.length - 1] }];
          sourceCards = 'waste';
        } else if (selected.source === 'tableau') {
          cardsToMove = prev.tableau[selected.colIdx].slice(selected.cardIdx).map(c => ({ ...c }));
          sourceCards = 'tableau';
        }

        if (!cardsToMove || cardsToMove.length === 0) return prev;

        const targetCol = tableau[colIdx];
        const target = targetCol.length > 0 ? targetCol[targetCol.length - 1] : null;

        if (canStackOnTableau(cardsToMove[0], target)) {
          // Move cards
          tableau[colIdx] = [...targetCol, ...cardsToMove];

          let newState = { ...prev, tableau, moves: prev.moves + 1 };

          if (sourceCards === 'waste') {
            const waste = [...prev.waste];
            waste.pop();
            newState.waste = waste;
          } else {
            tableau[selected.colIdx] = prev.tableau[selected.colIdx].slice(0, selected.cardIdx);
            if (tableau[selected.colIdx].length > 0) {
              const last = { ...tableau[selected.colIdx][tableau[selected.colIdx].length - 1] };
              last.faceUp = true;
              tableau[selected.colIdx][tableau[selected.colIdx].length - 1] = last;
            }
            newState.tableau = tableau;
          }

          setSelected(null);
          return newState;
        }

        return prev;
      });
      setSelected(null);
    }
  }, [selected, game, won]);

  const handleEmptyTableauClick = useCallback((colIdx) => {
    if (!selected || won) return;

    setGame(prev => {
      let cardsToMove;
      if (selected.source === 'waste') {
        cardsToMove = [{ ...prev.waste[prev.waste.length - 1] }];
      } else if (selected.source === 'tableau') {
        cardsToMove = prev.tableau[selected.colIdx].slice(selected.cardIdx).map(c => ({ ...c }));
      }

      if (!cardsToMove || cardsToMove[0].rank !== 'K') return prev;

      const tableau = prev.tableau.map(col => [...col]);
      tableau[colIdx] = [...cardsToMove];

      let newState = { ...prev, tableau, moves: prev.moves + 1 };

      if (selected.source === 'waste') {
        newState.waste = [...prev.waste.slice(0, -1)];
      } else {
        tableau[selected.colIdx] = prev.tableau[selected.colIdx].slice(0, selected.cardIdx);
        if (tableau[selected.colIdx].length > 0) {
          const last = { ...tableau[selected.colIdx][tableau[selected.colIdx].length - 1] };
          last.faceUp = true;
          tableau[selected.colIdx][tableau[selected.colIdx].length - 1] = last;
        }
      }

      setSelected(null);
      return newState;
    });
    setSelected(null);
  }, [selected, won]);

  const isSelected = useCallback((source, colIdx, cardIdx) => {
    if (!selected) return false;
    if (selected.source !== source) return false;
    if (source === 'waste') return true;
    return selected.colIdx === colIdx && selected.cardIdx <= cardIdx;
  }, [selected]);

  return (
    <Window id="solitaire" title={config.title} defaultPos={config.defaultPos} defaultSize={config.defaultSize}>
      <div className="sol-game">
        {/* Top row: Stock, Waste, Foundations */}
        <div className="sol-top-row">
          <div className="sol-stock" onClick={drawFromStock}>
            {game.stock.length > 0 ? (
              <div className="sol-card sol-card-back"><div className="sol-card-pattern">🂠</div></div>
            ) : (
              <div className="sol-card sol-empty-slot">↺</div>
            )}
          </div>

          <div className="sol-waste">
            {game.waste.length > 0 && (
              <Card
                card={game.waste[game.waste.length - 1]}
                selected={isSelected('waste')}
                onClick={() => {
                  if (selected && selected.source === 'waste') {
                    setSelected(null);
                  } else {
                    setSelected({ source: 'waste' });
                  }
                }}
                onDoubleClick={() => {
                  const card = game.waste[game.waste.length - 1];
                  if (card) tryAutoFoundation(card, 'waste');
                }}
              />
            )}
            {game.waste.length === 0 && <div className="sol-card sol-empty-slot" />}
          </div>

          <div className="sol-spacer" />

          {game.foundations.map((pile, fi) => (
            <div key={fi} className="sol-foundation">
              {pile.length > 0 ? (
                <Card card={pile[pile.length - 1]} />
              ) : (
                <div className="sol-card sol-empty-slot">{SUITS[fi]}</div>
              )}
            </div>
          ))}
        </div>

        {/* Tableau */}
        <div className="sol-tableau">
          {game.tableau.map((col, ci) => (
            <div key={ci} className="sol-column">
              {col.length === 0 ? (
                <div className="sol-card sol-empty-slot" onClick={() => handleEmptyTableauClick(ci)} />
              ) : (
                col.map((card, ri) => (
                  <div key={card.id} className="sol-stacked" style={{ top: ri * 22 }}>
                    <Card
                      card={card}
                      selected={isSelected('tableau', ci, ri)}
                      onClick={() => handleCardClick('tableau', ci, ri)}
                      onDoubleClick={() => {
                        if (card.faceUp && ri === col.length - 1) {
                          tryAutoFoundation(card, 'tableau', ci, ri);
                        }
                      }}
                    />
                  </div>
                ))
              )}
            </div>
          ))}
        </div>

        {/* Status bar */}
        <div className="sol-status">
          <span>Moves: {game.moves}</span>
          {won && <span className="sol-win">🎉 You Win!</span>}
          <button onClick={handleNewGame}>New Game</button>
        </div>
      </div>
    </Window>
  );
}

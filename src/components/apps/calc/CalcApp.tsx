import React, { useState, useEffect } from 'react';
import { Delete, Sparkles } from 'lucide-react';

export const CalcApp: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [isScientific, setIsScientific] = useState(false);
  const [hasEvaluated, setHasEvaluated] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDigit = (digit: string) => {
    setErrorMessage(null);
    if (hasEvaluated) {
      setDisplay(digit);
      setHasEvaluated(false);
      return;
    }
    setDisplay((prev) => (prev === '0' ? digit : prev + digit));
  };

  const handleDecimal = () => {
    setErrorMessage(null);
    if (hasEvaluated) {
      setDisplay('0.');
      setHasEvaluated(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay((prev) => prev + '.');
    }
  };

  const handleOperator = (op: string) => {
    setErrorMessage(null);
    if (hasEvaluated) {
      setEquation(`${display} ${op} `);
      setDisplay('0');
      setHasEvaluated(false);
      return;
    }
    setEquation(`${equation}${display} ${op} `);
    setDisplay('0');
  };

  const handlePercentage = () => {
    setErrorMessage(null);
    try {
      const val = parseFloat(display);
      if (!isNaN(val)) {
        const percentVal = val / 100;
        setDisplay(String(percentVal));
      }
    } catch {
      setErrorMessage('Invalid operation');
    }
  };

  const handleSciFunction = (fn: string) => {
    setErrorMessage(null);
    try {
      const val = parseFloat(display);
      if (isNaN(val)) return;

      let result = 0;
      switch (fn) {
        case 'sin':
          result = Math.sin((val * Math.PI) / 180);
          break;
        case 'cos':
          result = Math.cos((val * Math.PI) / 180);
          break;
        case 'tan':
          result = Math.tan((val * Math.PI) / 180);
          break;
        case 'sqrt':
          if (val < 0) {
            setErrorMessage('Invalid input');
            return;
          }
          result = Math.sqrt(val);
          break;
        case 'sqr':
          result = Math.pow(val, 2);
          break;
        case 'log':
          if (val <= 0) {
            setErrorMessage('Invalid input');
            return;
          }
          result = Math.log10(val);
          break;
        case 'ln':
          if (val <= 0) {
            setErrorMessage('Invalid input');
            return;
          }
          result = Math.log(val);
          break;
        case 'pi':
          result = Math.PI;
          break;
        case 'e':
          result = Math.E;
          break;
      }
      setDisplay(String(Number(result.toFixed(8))));
      setHasEvaluated(true);
    } catch {
      setErrorMessage('Math Error');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
    setErrorMessage(null);
    setHasEvaluated(false);
  };

  const handleBackspace = () => {
    setErrorMessage(null);
    if (hasEvaluated) {
      handleClear();
      return;
    }
    setDisplay((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
  };

  const handleEquals = () => {
    if (!equation && !display) return;
    try {
      const fullExpr = equation + display;
      // Check for division by zero
      if (/\/\s*0(?![0-9.])/.test(fullExpr.replace(/÷/g, '/'))) {
        setErrorMessage('Cannot divide by zero');
        setDisplay('0');
        setEquation('');
        setHasEvaluated(true);
        return;
      }

      // Safe sanitized evaluation
      const sanitized = fullExpr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/[^0-9+\-*/(). ]/g, '');

      const result = Function(`'use strict'; return (${sanitized})`)();
      if (!isFinite(result)) {
        setErrorMessage('Cannot divide by zero');
        setDisplay('0');
      } else {
        setDisplay(String(Number(result.toFixed(8))));
        setEquation('');
      }
      setHasEvaluated(true);
    } catch {
      setErrorMessage('Calculation error');
    }
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === '.') {
        e.preventDefault();
        handleDecimal();
      } else if (e.key === '+') {
        e.preventDefault();
        handleOperator('+');
      } else if (e.key === '-') {
        e.preventDefault();
        handleOperator('-');
      } else if (e.key === '*' || e.key === 'x') {
        e.preventDefault();
        handleOperator('×');
      } else if (e.key === '/') {
        e.preventDefault();
        handleOperator('÷');
      } else if (e.key === '%') {
        e.preventDefault();
        handlePercentage();
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [display, equation, hasEvaluated]);

  return (
    <div className="flex flex-col h-full w-full bg-[#080d19] text-slate-100 select-none p-4">
      {/* Top Bar with Mode Toggle */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {isScientific ? 'Scientific Mode' : 'Standard Mode'}
        </span>
        <button
          onClick={() => setIsScientific(!isScientific)}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${
            isScientific
              ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
              : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>{isScientific ? 'Standard' : 'Scientific'}</span>
        </button>
      </div>

      {/* Display Screen */}
      <div className="bg-slate-950/80 border border-white/5 rounded-2xl p-4 mb-3 text-right shadow-inner flex flex-col justify-end min-h-[85px]">
        <div className="h-5 text-xs font-mono text-slate-400 truncate tracking-wide">
          {equation}
        </div>
        {errorMessage ? (
          <div className="text-sm font-semibold text-rose-400 mt-1 truncate">
            {errorMessage}
          </div>
        ) : (
          <div className="text-3xl font-mono font-bold tracking-tight text-cyan-300 truncate mt-1">
            {display}
          </div>
        )}
      </div>

      {/* Scientific Functions Drawer */}
      {isScientific && (
        <div className="grid grid-cols-4 gap-1.5 mb-2.5 p-2 bg-slate-950/50 rounded-xl border border-white/5">
          <button
            onClick={() => handleSciFunction('sin')}
            className="py-1.5 bg-slate-900/80 hover:bg-slate-800 text-xs font-mono text-purple-300 rounded-lg border border-white/5"
          >
            sin
          </button>
          <button
            onClick={() => handleSciFunction('cos')}
            className="py-1.5 bg-slate-900/80 hover:bg-slate-800 text-xs font-mono text-purple-300 rounded-lg border border-white/5"
          >
            cos
          </button>
          <button
            onClick={() => handleSciFunction('tan')}
            className="py-1.5 bg-slate-900/80 hover:bg-slate-800 text-xs font-mono text-purple-300 rounded-lg border border-white/5"
          >
            tan
          </button>
          <button
            onClick={() => handleSciFunction('sqrt')}
            className="py-1.5 bg-slate-900/80 hover:bg-slate-800 text-xs font-mono text-purple-300 rounded-lg border border-white/5"
          >
            √x
          </button>
          <button
            onClick={() => handleSciFunction('sqr')}
            className="py-1.5 bg-slate-900/80 hover:bg-slate-800 text-xs font-mono text-purple-300 rounded-lg border border-white/5"
          >
            x²
          </button>
          <button
            onClick={() => handleSciFunction('ln')}
            className="py-1.5 bg-slate-900/80 hover:bg-slate-800 text-xs font-mono text-purple-300 rounded-lg border border-white/5"
          >
            ln
          </button>
          <button
            onClick={() => handleSciFunction('log')}
            className="py-1.5 bg-slate-900/80 hover:bg-slate-800 text-xs font-mono text-purple-300 rounded-lg border border-white/5"
          >
            log
          </button>
          <button
            onClick={() => handleSciFunction('pi')}
            className="py-1.5 bg-slate-900/80 hover:bg-slate-800 text-xs font-mono text-purple-300 rounded-lg border border-white/5"
          >
            π
          </button>
        </div>
      )}

      {/* Calculator Keypad Grid */}
      <div className="grid grid-cols-4 gap-2 flex-1">
        {/* Row 1 */}
        <button
          onClick={handleClear}
          className="py-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold rounded-xl border border-rose-500/20 text-xs transition-colors"
          title="Clear (Esc)"
        >
          AC
        </button>
        <button
          onClick={handleBackspace}
          className="py-3 bg-slate-900/80 hover:bg-slate-800 text-slate-300 flex items-center justify-center rounded-xl border border-white/5 transition-colors"
          title="Backspace"
        >
          <Delete className="w-4 h-4" />
        </button>
        <button
          onClick={handlePercentage}
          className="py-3 bg-slate-900/80 hover:bg-slate-800 text-purple-300 flex items-center justify-center rounded-xl border border-white/5 text-xs font-bold transition-colors"
          title="Percent"
        >
          %
        </button>
        <button
          onClick={() => handleOperator('÷')}
          className="py-3 bg-cyan-600/30 hover:bg-cyan-600/40 text-cyan-300 font-bold rounded-xl border border-cyan-500/20 text-sm transition-colors"
          title="Divide"
        >
          ÷
        </button>

        {/* Row 2 */}
        {['7', '8', '9'].map((d) => (
          <button
            key={d}
            onClick={() => handleDigit(d)}
            className="py-3 bg-slate-900/80 hover:bg-slate-800 font-mono text-base font-semibold rounded-xl border border-white/5 transition-colors active:scale-95"
          >
            {d}
          </button>
        ))}
        <button
          onClick={() => handleOperator('×')}
          className="py-3 bg-cyan-600/30 hover:bg-cyan-600/40 text-cyan-300 font-bold rounded-xl border border-cyan-500/20 text-sm transition-colors"
          title="Multiply"
        >
          ×
        </button>

        {/* Row 3 */}
        {['4', '5', '6'].map((d) => (
          <button
            key={d}
            onClick={() => handleDigit(d)}
            className="py-3 bg-slate-900/80 hover:bg-slate-800 font-mono text-base font-semibold rounded-xl border border-white/5 transition-colors active:scale-95"
          >
            {d}
          </button>
        ))}
        <button
          onClick={() => handleOperator('-')}
          className="py-3 bg-cyan-600/30 hover:bg-cyan-600/40 text-cyan-300 font-bold rounded-xl border border-cyan-500/20 text-sm transition-colors"
          title="Subtract"
        >
          -
        </button>

        {/* Row 4 */}
        {['1', '2', '3'].map((d) => (
          <button
            key={d}
            onClick={() => handleDigit(d)}
            className="py-3 bg-slate-900/80 hover:bg-slate-800 font-mono text-base font-semibold rounded-xl border border-white/5 transition-colors active:scale-95"
          >
            {d}
          </button>
        ))}
        <button
          onClick={() => handleOperator('+')}
          className="py-3 bg-cyan-600/30 hover:bg-cyan-600/40 text-cyan-300 font-bold rounded-xl border border-cyan-500/20 text-sm transition-colors"
          title="Add"
        >
          +
        </button>

        {/* Row 5 */}
        <button
          onClick={() => handleDigit('0')}
          className="col-span-2 py-3 bg-slate-900/80 hover:bg-slate-800 font-mono text-base font-semibold rounded-xl border border-white/5 transition-colors active:scale-95"
        >
          0
        </button>
        <button
          onClick={handleDecimal}
          className="py-3 bg-slate-900/80 hover:bg-slate-800 font-mono text-base font-semibold rounded-xl border border-white/5 transition-colors"
        >
          .
        </button>
        <button
          onClick={handleEquals}
          className="py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl font-mono text-base transition-transform active:scale-95 shadow-md shadow-cyan-500/20"
          title="Equals (Enter)"
        >
          =
        </button>
      </div>
    </div>
  );
};

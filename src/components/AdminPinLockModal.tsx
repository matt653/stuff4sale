import React, { useState, useEffect, useRef } from "react";
import { Lock, Shield, KeyRound, ArrowRight, Eye, AlertCircle, CheckCircle, ShoppingBag, X } from "lucide-react";

interface AdminPinLockModalProps {
  onSuccess: () => void;
  onGoToCatalog: () => void;
  isChangePinMode?: boolean;
  onCloseChangePin?: () => void;
}

export default function AdminPinLockModal({
  onSuccess,
  onGoToCatalog,
  isChangePinMode = false,
  onCloseChangePin,
}: AdminPinLockModalProps) {
  // Get stored master PIN or default to "8191" (clears any legacy "1234")
  const getStoredPin = () => {
    const stored = localStorage.getItem("stuff4sale_admin_pin");
    if (!stored || stored === "1234") {
      localStorage.setItem("stuff4sale_admin_pin", "8191");
      return "8191";
    }
    return stored;
  };

  const [pin, setPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleVerifyPin = (enteredPin: string) => {
    const currentCorrectPin = getStoredPin();
    if (enteredPin === currentCorrectPin) {
      sessionStorage.setItem("stuff4sale_admin_auth", "true");
      setErrorMsg(null);
      onSuccess();
    } else {
      setShake(true);
      setErrorMsg("Incorrect PIN. Access denied.");
      setPin("");
      setTimeout(() => setShake(false), 500);
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isChangePinMode) {
      handleChangePinSubmit();
    } else {
      handleVerifyPin(pin);
    }
  };

  const handleChangePinSubmit = () => {
    const currentCorrectPin = getStoredPin();
    if (pin !== currentCorrectPin) {
      setErrorMsg("Current PIN is incorrect.");
      return;
    }
    if (newPin.length < 4) {
      setErrorMsg("New PIN must be at least 4 digits.");
      return;
    }
    if (newPin !== confirmPin) {
      setErrorMsg("New PIN and confirmation do not match.");
      return;
    }

    localStorage.setItem("stuff4sale_admin_pin", newPin);
    setSuccessMsg("PIN changed successfully!");
    setErrorMsg(null);
    setTimeout(() => {
      if (onCloseChangePin) onCloseChangePin();
    }, 1200);
  };

  // Change PIN mode layout
  if (isChangePinMode) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 space-y-4 relative">
          {onCloseChangePin && (
            <button
              onClick={onCloseChangePin}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
            >
              <X size={18} />
            </button>
          )}

          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100 shadow-xs">
              <KeyRound size={24} />
            </div>
            <h3 className="font-extrabold text-base text-slate-900">Change Admin PIN</h3>
            <p className="text-xs text-slate-400">Set a custom passcode for your seller backend.</p>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-2.5 rounded-xl flex items-center gap-1.5">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs p-2.5 rounded-xl flex items-center gap-1.5">
              <CheckCircle size={14} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handlePinSubmit} className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Current PIN</label>
              <input
                type="password"
                required
                maxLength={8}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter current PIN..."
                className="w-full text-center tracking-widest text-lg font-black border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">New PIN (4-8 digits)</label>
              <input
                type="password"
                required
                maxLength={8}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                placeholder="Enter new PIN..."
                className="w-full text-center tracking-widest text-lg font-black border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Confirm New PIN</label>
              <input
                type="password"
                required
                maxLength={8}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Re-enter new PIN..."
                className="w-full text-center tracking-widest text-lg font-black border border-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer mt-2"
            >
              Save New PIN
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Full Screen Authentication Lock
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative select-none">
      {/* Background decorative glow */}
      <div className="absolute w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute w-72 h-72 bg-emerald-600/10 rounded-full blur-3xl bottom-10 right-10 pointer-events-none" />

      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl space-y-6 text-center">
        {/* Lock Icon Header */}
        <div className="space-y-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-violet-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/30 border border-indigo-400/30">
            <Lock size={26} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Seller Portal Protected</h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your seller PIN passcode to access inventory management, costs, and profit metrics.
            </p>
          </div>
        </div>

        {/* Error Feedback */}
        {errorMsg && (
          <div className="bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs p-3 rounded-xl flex items-center justify-center gap-1.5 animate-shake">
            <AlertCircle size={15} className="shrink-0 text-rose-400" />
            <span className="font-bold">{errorMsg}</span>
          </div>
        )}

        {/* PIN Input Form */}
        <form onSubmit={handlePinSubmit} className="space-y-4">
          <div className={`relative ${shake ? "animate-shake" : ""}`}>
            <input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              maxLength={8}
              autoComplete="current-password"
              placeholder="••••"
              value={pin}
              onChange={(e) => {
                const val = e.target.value;
                setPin(val);
                setErrorMsg(null);
                if (val.length === 4) {
                  handleVerifyPin(val);
                }
              }}
              className="w-full text-center text-3xl font-mono tracking-[0.5em] bg-slate-950 border-2 border-slate-700 focus:border-indigo-500 text-white rounded-2xl py-3 px-4 outline-none transition shadow-inner placeholder-slate-600"
              id="admin-pin-input-field"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onGoToCatalog}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
            >
              <ShoppingBag size={14} className="text-slate-400" />
              <span>Public Catalog</span>
            </button>

            <button
              type="submit"
              className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Unlock</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

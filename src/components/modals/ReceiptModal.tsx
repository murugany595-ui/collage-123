import React, { useEffect } from "react";
import { X, Printer, Download, CheckCircle2, Building2, ShieldCheck, QrCode } from "lucide-react";

export interface ReceiptModalProps {
  isOpen?: boolean;
  receipt: {
    id: string;
    student_name: string;
    student_id?: string;
    roll?: string;
    grade?: string;
    amount: string | number;
    date: string;
    payment_method?: string;
    fee_type?: string;
    reference_note?: string;
    invoice_id?: string;
  } | null;
  onClose?: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen = true,
  receipt,
  onClose = () => {},
}) => {
  // Escape key and scroll lock
  useEffect(() => {
    if (!isOpen || !receipt) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, receipt, onClose]);

  if (!receipt || isOpen === false) return null;

  const handlePrint = () => {
    window.print();
  };

  const amountNum = typeof receipt.amount === "number"
    ? receipt.amount
    : parseFloat(String(receipt.amount).replace(/[^0-9.]/g, "")) || 0;
  const formattedAmount = `₹${amountNum.toFixed(2)}`;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto transition-opacity duration-200"
    >
      <div
        id="receipt-modal"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] my-4 transform-gpu transition-all duration-200 scale-100"
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-emerald-950 text-white">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg">
              <Building2 className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-black text-white text-base">Fee Payment Receipt</h3>
              <p className="text-[11px] text-emerald-200">Official Educational Verification</p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/15 active:scale-90 active:bg-white/25 rounded-lg transition-all duration-150 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
            aria-label="Close modal"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Canvas */}
        <div id="printable-receipt" className="p-6 sm:p-8 space-y-6 overflow-y-auto bg-white">
          {/* Header with College Brand & Status Badge */}
          <div className="flex items-start justify-between border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2 font-black text-slate-900 text-lg tracking-tight">
                <span className="w-7 h-7 bg-emerald-600 text-white rounded-lg flex items-center justify-center text-xs font-black">
                  CC
                </span>
                City College of Higher Education
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">Bursar & Accounts Administrative Wing</p>
              <p className="text-[11px] text-slate-400">104 University Boulevard, North Campus</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" /> Cleared
              </span>
              <p className="text-xs font-mono font-bold text-slate-800 mt-2">#{receipt.id}</p>
              <p className="text-[11px] text-slate-400">{receipt.date}</p>
            </div>
          </div>

          {/* Student & Payment Metadata Card */}
          <div className="grid grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-xl text-xs border border-slate-200/80">
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Student Name</span>
              <span className="font-bold text-slate-900 text-xs sm:text-sm">{receipt.student_name}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Student ID / Roll</span>
              <span className="font-bold text-slate-800 font-mono">
                {receipt.student_id || "STU-1042"} {receipt.roll ? `• ${receipt.roll}` : ""}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Department / Class</span>
              <span className="font-bold text-blue-600">{receipt.grade || "B.Tech CSE - Sem 5"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Payment Instrument</span>
              <span className="font-bold text-slate-800">{receipt.payment_method || "Card POS Terminal"}</span>
            </div>
          </div>

          {/* Itemized Fee Breakdown Table */}
          <div className="space-y-2.5">
            <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200 pb-2">
              <span>Item / Description</span>
              <span>Amount</span>
            </div>
            <div className="flex justify-between text-xs py-1 text-slate-700">
              <span className="font-medium">
                {receipt.fee_type || "Semester Tuition & Lab Academic Term Fee"}
              </span>
              <span className="font-bold text-slate-900">{formattedAmount}</span>
            </div>
            {receipt.reference_note && (
              <div className="flex justify-between text-[11px] py-0.5 text-slate-500 italic">
                <span>Reference: {receipt.reference_note}</span>
                <span>-</span>
              </div>
            )}
            <div className="flex justify-between text-xs py-1 border-t border-slate-100 text-slate-500">
              <span>Administrative Processing Fee</span>
              <span>₹0.00</span>
            </div>
            <div className="flex justify-between text-base font-black pt-3 border-t-2 border-slate-900 text-slate-900">
              <span>Total Settled Amount</span>
              <span className="text-emerald-600">{formattedAmount}</span>
            </div>
          </div>

          {/* Security Stamp & Signature Section */}
          <div className="flex items-center justify-between pt-4 border-t border-dashed border-slate-200">
            <div className="flex items-center gap-2 text-slate-500 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Digitally Authenticated by Bursar Terminal</span>
            </div>
            <div className="text-right">
              <div className="font-serif italic font-bold text-slate-700 text-xs">Rita Álvarez</div>
              <p className="text-[10px] text-slate-400">Authorized Bursar Officer</p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition"
          >
            <Printer className="w-4 h-4" /> Print / Save Official PDF
          </button>
        </div>
      </div>
    </div>
  );
};

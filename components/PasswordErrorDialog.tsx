"use client";

interface PasswordErrorDialogProps {
  message: string | null;
  onClose: () => void;
}

export default function PasswordErrorDialog({
  message,
  onClose,
}: PasswordErrorDialogProps) {
  if (!message) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-6">
      <div className="w-full max-w-[320px] rounded-[8px] bg-white p-5 text-center shadow-apple-lg">
        <h2 className="text-lg font-black text-[#111827]">密码错误</h2>
        <p className="mt-2 text-sm font-bold text-apple-gray-400">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 h-11 w-full rounded-[8px] bg-[#0E1320] text-sm font-black text-white"
        >
          确定
        </button>
      </div>
    </div>
  );
}

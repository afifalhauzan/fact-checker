import { Modal } from "./ui/modal";

// Logout confirmation modal
interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export function LogoutModal({
  isOpen,
  onClose,
  onLogout,
}: LogoutModalProps) {
  const handleLogout = () => {
    onLogout();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keluar dari Akun" description="Apakah Anda yakin ingin keluar dari akun Anda?">
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
        <button
          onClick={onClose}
          className="mt-3 inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-0"
        >
          Batal
        </button>
        <button
          onClick={handleLogout}
          className="inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive"
        >
          Keluar
        </button>
      </div>
    </Modal>
  );
}
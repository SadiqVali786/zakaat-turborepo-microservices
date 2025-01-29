import { type ReactNode } from "react";

export default function Button({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button onClick={onClick} className="px-4 rounded-lg border py-2">
      {children}
    </button>
  );
}

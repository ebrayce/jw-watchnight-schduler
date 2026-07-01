"use client";

import { useEffect, useState } from "react";
import { createPortal, useFormStatus } from "react-dom";
import { dayLabels } from "@/lib/dates";

type CreateCongregationModalProps = {
  action: (formData: FormData) => Promise<void>;
  draft: {
    name: string;
    overseer: string;
    contactPrimary: string;
    contactAlternate: string;
    meetingDays: number[];
    isActive: boolean;
  };
  startOpen?: boolean;
};

const weekdays = [0, 1, 2, 3, 4, 5, 6] as const;

// Isolated Submit Button to handle structural form-status tracking natively
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="ui-btn px-5 py-2 text-sm font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[var(--primary)]/10"
    >
      {pending ? "Adding Unit..." : "Add Congregation"}
    </button>
  );
}

export function CreateCongregationModal({ action, draft, startOpen = false }: CreateCongregationModalProps) {
  const [isOpen, setIsOpen] = useState(startOpen);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="ui-btn w-full py-2.5 text-sm font-semibold cursor-pointer shadow-md shadow-[var(--primary)]/10"
      >
        Add New Congregation
      </button>

      {typeof document !== "undefined" && isOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-black/20 dark:bg-black/40 transition-all"
              onMouseDown={() => setIsOpen(false)}
            >
              <div className="ui-card w-full max-w-2xl p-6 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>

            {/* Modal Navigation Header */}
            <div className="mb-6 flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h2 className="text-base font-bold ui-title">Add New Congregation</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="ui-btn-secondary px-2.5 py-1 text-xs font-bold hover:bg-[var(--background)] cursor-pointer transition-colors"
              >
                Dismiss
              </button>
            </div>

            <form
              action={async (formData) => {
                await action(formData);
                setIsOpen(false);
              }}
              className="space-y-5"
            >
              {/* Core Attributes Input Matrix */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider ui-subtle pl-1">Unit Name</span>
                  <input name="name" required placeholder="Congregation Name" className="ui-input text-sm" defaultValue={draft.name} />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider ui-subtle pl-1">Overseer Name</span>
                  <input name="overseer" required placeholder="Overseer Name" className="ui-input text-sm" defaultValue={draft.overseer} />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider ui-subtle pl-1">Primary Contact Phone</span>
                  <input name="contactPrimary" required placeholder="Primary Phone Number" className="ui-input text-sm" defaultValue={draft.contactPrimary} />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider ui-subtle pl-1">Alternative Contact</span>
                  <input name="contactAlternate" placeholder="Optional Extension Link" className="ui-input text-sm" defaultValue={draft.contactAlternate} />
                </div>
              </div>

              {/* Rotational Selection Segment */}
              <div className="space-y-1.5">
                <p className="text-[10px] uppercase font-bold tracking-wider ui-subtle pl-1">Meeting Days</p>
                <div className="grid grid-cols-4 gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-strong)] p-1.5">
                  {weekdays.map((day) => (
                    <label
                      key={`create-modal-day-${day}`}
                      className="flex flex-col items-center justify-center rounded-lg border border-transparent p-2 text-center transition-all has-[:checked]:border-[var(--primary)]/30 has-[:checked]:bg-[var(--background)] cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        name="meetingDays"
                        value={day}
                        defaultChecked={draft.meetingDays.includes(day)}
                        className="sr-only"
                      />
                      <span className="text-[10px] uppercase font-bold tracking-wider ui-subtle">
                        {dayLabels[day].substring(0, 3)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Toggle Activation Configuration */}
              <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer py-1 ui-title w-fit">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={draft.isActive}
                  className="rounded border-[var(--border)] bg-[var(--surface-strong)] text-[var(--primary)] focus:ring-[var(--primary)]/10"
                />
                Active Directory Listing
              </label>

              {/* Modal Control Action Block */}
              <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="ui-btn-secondary px-4 py-2 text-sm font-semibold hover:bg-[var(--background)] cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <SubmitButton />
              </div>
            </form>

              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
"use client";

import { useState } from "react";
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

export function CreateCongregationModal({ action, draft, startOpen = false }: CreateCongregationModalProps) {
  const [isOpen, setIsOpen] = useState(startOpen);

  return (
    <>
      <button type="button" onClick={() => setIsOpen(true)} className="ui-btn w-full py-2.5 text-sm font-semibold">
        Add New Congregation
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
          <div className="ui-card w-full max-w-2xl p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold ui-title">Add New Congregation</h2>
              <button type="button" onClick={() => setIsOpen(false)} className="ui-btn-secondary px-3 py-1 text-xs">
                X
              </button>
            </div>

            <form action={action} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <input name="name" required placeholder="Congregation Name" className="ui-input text-sm" defaultValue={draft.name} />
                <input name="overseer" required placeholder="Overseer Name" className="ui-input text-sm" defaultValue={draft.overseer} />
                <input
                  name="contactPrimary"
                  required
                  placeholder="Primary Contact Phone"
                  className="ui-input text-sm"
                  defaultValue={draft.contactPrimary}
                />
                <input
                  name="contactAlternate"
                  placeholder="Alternative Contact (Optional)"
                  className="ui-input text-sm"
                  defaultValue={draft.contactAlternate}
                />
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider ui-subtle pl-0.5">Meeting Days</p>
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

              <label className="flex items-center gap-2 text-sm font-medium cursor-pointer py-1 ui-title">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={draft.isActive}
                  className="rounded border-[var(--border)] bg-[var(--surface-strong)] text-[var(--primary)]"
                />
                Active Listing
              </label>

              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={() => setIsOpen(false)} className="ui-btn-secondary px-4 py-2 text-sm">
                  Cancel
                </button>
                <button type="submit" className="ui-btn px-4 py-2 text-sm font-semibold">
                  Add Congregation
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}


import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { listenContacts, saveContact, removeContact } from "../lib/db";
import type { Contact } from "../types";

/** Contacts: name list only — no customer/supplier. */
export default function ContactsPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [query, setQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    return listenContacts(user.uid, setContacts);
  }, [user]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone || "").includes(q) ||
        (c.note || "").toLowerCase().includes(q)
    );
  }, [contacts, query]);

  const resetForm = () => {
    setEditId(null);
    setName("");
    setPhone("");
    setNote("");
    setShowForm(false);
  };

  const openAdd = () => {
    setEditId(null);
    setName("");
    setPhone("");
    setNote("");
    setShowForm(true);
  };

  const openEdit = (c: Contact) => {
    setEditId(c.id);
    setName(c.name);
    setPhone(c.phone || "");
    setNote(c.note || "");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setSaving(true);
    try {
      await saveContact(user.uid, {
        id: editId || undefined,
        name,
        phone,
        note,
      });
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !confirm("Delete this contact?")) return;
    await removeContact(user.uid, id);
  };

  return (
    <div className="min-h-dvh bg-[var(--background)]">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--card)] px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold">Contacts</h1>
            <p className="text-xs text-[var(--muted-foreground)]">
              Add, edit, delete — you know who to pay or collect from
            </p>
          </div>
          <button
            onClick={openAdd}
            className="rounded-lg bg-[var(--primary)] px-3 py-1.5 text-sm font-medium text-white"
          >
            + Add
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search contacts..."
          className="mb-4 w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-sm outline-none focus:border-[var(--primary)]"
        />

        {showForm && (
          <form
            onSubmit={handleSave}
            className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4"
          >
            <p className="mb-3 text-sm font-medium">
              {editId ? "Edit contact" : "New contact"}
            </p>

            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
                Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                placeholder="e.g. Vinod"
                required
                autoFocus
              />
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
                Phone (optional)
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                inputMode="tel"
              />
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
                Note (optional)
              </label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                placeholder="e.g. village supplier"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 rounded-lg border border-[var(--border)] py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-lg bg-[var(--primary)] py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {saving ? "Saving..." : editId ? "Update" : "Save"}
              </button>
            </div>
          </form>
        )}

        {contacts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--card)] p-8 text-center">
            <p className="text-sm text-[var(--muted-foreground)]">No contacts yet</p>
            <button
              onClick={openAdd}
              className="mt-3 text-sm font-medium text-[var(--primary)]"
            >
              Add first contact
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-[var(--muted-foreground)]">No match for search</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {c.phone || "No phone"}
                    {c.note ? ` · ${c.note}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(c)}
                    className="rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-medium"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

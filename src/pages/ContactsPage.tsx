import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { listenContacts, saveContact, removeContact } from "../lib/db";
import type { Contact, ContactKind } from "../types";
import { KIND_LABELS } from "../types";

export default function ContactsPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [kind, setKind] = useState<ContactKind>("customer");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    return listenContacts(user.uid, setContacts);
  }, [user]);

  const resetForm = () => {
    setEditId(null);
    setName("");
    setPhone("");
    setNote("");
    setKind("customer");
    setShowForm(false);
  };

  const openAdd = () => {
    setEditId(null);
    setName("");
    setPhone("");
    setNote("");
    setKind("customer");
    setShowForm(true);
  };

  const openEdit = (e: React.MouseEvent, c: Contact) => {
    e.preventDefault();
    e.stopPropagation();
    setEditId(c.id);
    setName(c.name);
    setPhone(c.phone || "");
    setNote(c.note || "");
    setKind(c.kind);
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
        kind,
        note,
      });
      resetForm();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !confirm("Delete this contact?")) return;
    await removeContact(user.uid, id);
  };

  return (
    <div className="min-h-dvh bg-[var(--background)]">
      <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-[var(--card)] px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="text-sm text-[var(--muted-foreground)]">
              Back
            </Link>
            <h1 className="text-lg font-semibold">Contacts</h1>
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
                placeholder="e.g. Ramesh Village"
                required
                autoFocus
              />
            </div>

            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-[var(--muted-foreground)]">
                Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["customer", "supplier"] as const).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setKind(k)}
                    className={`rounded-lg py-2 text-sm font-medium ${
                      kind === k
                        ? "bg-[var(--primary)] text-white"
                        : "bg-[var(--muted)] text-[var(--foreground)]"
                    }`}
                  >
                    {KIND_LABELS[k]}
                  </button>
                ))}
              </div>
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
        ) : (
          <div className="space-y-2">
            {contacts.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3"
              >
                <Link to={`/contacts/${c.id}`} className="min-w-0 flex-1">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {KIND_LABELS[c.kind]}
                    {c.phone ? ` · ${c.phone}` : ""}
                  </p>
                </Link>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={(e) => openEdit(e, c)}
                    className="rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-medium"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, c.id)}
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

"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

type Client = {
  id?: string;
  name: string;
  phone: string;
  email: string;
  address: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  client?: Client | null;
};

export default function AddClientModal({
  open,
  onClose,
  onSuccess,
  client,
}: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (client) {
      setName(client.name || "");
      setPhone(client.phone || "");
      setEmail(client.email || "");
      setAddress(client.address || "");
    } else {
      setName("");
      setPhone("");
      setEmail("");
      setAddress("");
    }
  }, [client]);

  async function handleSave() {
    setLoading(true);

    if (client?.id) {
      // EDIT
      const { error } = await supabase
        .from("clients")
        .update({
          name,
          phone,
          email,
          address,
        })
        .eq("id", client.id);

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }
    } else {
      // CREATE
      const { error } = await supabase.from("clients").insert([
        {
          name,
          phone,
          email,
          address,
        },
      ]);

      if (error) {
        alert(error.message);
        setLoading(false);
        return;
      }
    }

    setLoading(false);
    onSuccess();
    onClose();
  }

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "white",
          padding: 20,
          borderRadius: 10,
          width: 400,
        }}
      >
        <h2>{client ? "Edit Client" : "Add Client"}</h2>

        <input
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: "100%", marginBottom: 10, padding: 8 }}
        />

        <input
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{ width: "100%", marginBottom: 10, padding: 8 }}
        />

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: "100%", marginBottom: 10, padding: 8 }}
        />

        <input
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          style={{ width: "100%", marginBottom: 10, padding: 8 }}
        />

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
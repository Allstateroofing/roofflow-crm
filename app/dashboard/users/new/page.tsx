"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import RoleGuard from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FormActions,
  FormGrid,
  FormPage,
  NativeSelect,
} from "@/components/ui/form-shell";

const ROLES = [
  { value: "admin", label: "Admin", hint: "Full access to everything" },
  { value: "manager", label: "Manager", hint: "Manages jobs and crews" },
  { value: "secretary", label: "Secretary", hint: "Office and paperwork" },
  { value: "salesman", label: "Salesman", hint: "Sees only their own clients and jobs" },
  { value: "worker", label: "Worker", hint: "Assigned jobs only" },
];

export default function NewUserPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("salesman");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function createUser() {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Full name is required";
    if (!email.trim()) next.email = "Email is required";
    if (password.length < 6) next.password = "At least 6 characters";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);

    const response = await fetch("/api/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        role,
      }),
    });

    const result = await response.json();
    setSaving(false);

    if (!response.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("User created");
    router.push("/dashboard/users");
  }

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <FormPage
        title="Create User"
        description="Give someone access to the CRM."
        backHref="/dashboard/users"
      >
        <FormGrid>
          <Field
            label="Full Name"
            htmlFor="name"
            required
            error={errors.name}
          >
            <Input
              id="name"
              className="h-9"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          <Field label="Email" htmlFor="email" required error={errors.email}>
            <Input
              id="email"
              type="email"
              autoComplete="off"
              className="h-9"
              placeholder="jane@allstateroofing.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>

          <Field
            label="Password"
            htmlFor="password"
            required
            error={errors.password}
            hint="Share it with them — they can change it later."
          >
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              className="h-9"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>

          <Field
            label="Role"
            htmlFor="role"
            hint={ROLES.find((r) => r.value === role)?.hint}
          >
            <NativeSelect
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </NativeSelect>
          </Field>


        </FormGrid>

        <FormActions>
          <Button
            variant="outline"
            size="lg"
            onClick={() => router.push("/dashboard/users")}
          >
            Cancel
          </Button>
          <Button size="lg" onClick={createUser} disabled={saving}>
            {saving ? "Creating…" : "Create User"}
          </Button>
        </FormActions>
      </FormPage>
    </RoleGuard>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";
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
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "secretary", label: "Secretary" },
  { value: "salesman", label: "Salesman" },
  { value: "worker", label: "Worker" },
];

export default function EditUserPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadUser = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    setName(data.full_name || "");
    setRole(data.role);
    setActive(data.active);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    if (id) loadUser();
  }, [id, loadUser]);

  async function updateUser() {
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: name,
        role,
        active,
        // Kartela e shitesit/punetorit e ndjek vete emrin dhe rolin
        // permes trigger-it fn_profile_role_record.
      })
      .eq("id", id);

    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("User updated");
    router.push("/dashboard/users");
  }

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <FormPage
        title="Edit User"
        description="Change a teammate's role or revoke their access."
        backHref="/dashboard/users"
      >
        {loading ? (
          <div className="space-y-5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                <div className="h-9 w-full animate-pulse rounded-lg bg-muted" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <FormGrid>
              <Field label="Full Name" htmlFor="name" required>
                <Input
                  id="name"
                  className="h-9"
                  placeholder="Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>

              <Field label="Role" htmlFor="role">
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



              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/50">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="mt-0.5 size-4 accent-primary"
                />
                <span className="grid gap-0.5">
                  <span className="text-sm font-medium">Active</span>
                  <span className="text-xs text-muted-foreground">
                    Inactive users keep their account but lose access.
                  </span>
                </span>
              </label>
            </FormGrid>

            <FormActions>
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push("/dashboard/users")}
              >
                Cancel
              </Button>
              <Button size="lg" onClick={updateUser} disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            </FormActions>
          </>
        )}
      </FormPage>
    </RoleGuard>
  );
}

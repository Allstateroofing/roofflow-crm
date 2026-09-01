"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Plus, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import RoleGuard from "@/components/auth/RoleGuard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/form-shell";
import {
  Column,
  DataTable,
  EmptyState,
  PageHeader,
  StatusBadge,
  Toolbar,
} from "@/components/ui/list-page";

const ROLE_FILTERS = [
  { value: "all", label: "All Roles" },
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "secretary", label: "Secretary" },
  { value: "salesman", label: "Salesman" },
  { value: "worker", label: "Worker" },
];

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("full_name");

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setUsers(data || []);
  }

  async function toggleStatus(id: string, current: boolean) {
    const { error } = await supabase
      .from("profiles")
      .update({ active: !current })
      .eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(current ? "User disabled" : "User enabled");
    loadUsers();
  }

  const filtered = users.filter((user) => {
    const matchName = (user.full_name || "")
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchRole = role === "all" ? true : user.role === role;
    return matchName && matchRole;
  });

  const columns: Column<any>[] = [
    {
      key: "name",
      header: "Name",
      primary: true,
      cell: (u) => (
        <span className="font-medium">{u.full_name || "No name"}</span>
      ),
    },
    {
      key: "role",
      header: "Role",
      cell: (u) => <span className="capitalize">{u.role}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (u) => <StatusBadge value={u.active ? "Active" : "Disabled"} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      actions: true,
      cell: (u) => (
        <span className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            render={<Link href={`/dashboard/users/${u.id}`} />}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleStatus(u.id, u.active)}
          >
            {u.active ? "Disable" : "Enable"}
          </Button>
        </span>
      ),
    },
  ];

  return (
    <RoleGuard allowedRoles={["admin"]}>
      <PageHeader
        title="Users"
        description="Who can sign in, and what they can reach."
        action={
          <Button render={<Link href="/dashboard/users/new" />} size="lg">
            <Plus data-icon="inline-start" />
            Add User
          </Button>
        }
      />

      <Toolbar>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-9 pl-8"
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="w-full sm:w-40">
          <NativeSelect
            value={role}
            onChange={(e) => setRole(e.target.value)}
            aria-label="Filter by role"
          >
            {ROLE_FILTERS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </NativeSelect>
        </div>
      </Toolbar>

      {loading ? (
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          getKey={(u) => u.id}
          empty={
            <EmptyState
              title="No users match"
              hint="Try clearing the search or role filter."
            />
          }
        />
      )}
    </RoleGuard>
  );
}

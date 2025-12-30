"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MoreHorizontal, PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { api } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useAbility } from "@/lib/ability";
import type { Contact } from "@/lib/types";

type PageMeta = {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
};

function mapContact(doc: any): Contact {
  return {
    id: String(doc?.contactId ?? doc?.id ?? ""),
    name: String(doc?.name ?? ""),
    title: doc?.title ? String(doc.title) : undefined,
    email: doc?.email ? String(doc.email) : undefined,
    phone: doc?.phone ? String(doc.phone) : undefined,
    notes: doc?.notes ? String(doc.notes) : undefined,
    companyId: doc?.companyId ? String(doc.companyId) : undefined,
    companyName: doc?.companyName ? String(doc.companyName) : undefined,
  };
}

export function CrmContactsClientPage({ companyId }: { companyId?: string }) {
  const { toast } = useToast();
  const ability = useAbility();

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const [companyLabel, setCompanyLabel] = useState<string | null>(null);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCompany = useCallback(async () => {
    const id = (companyId ?? "").trim();
    if (!id) {
      setCompanyLabel(null);
      return;
    }
    try {
      const res: any = await api.get("/companies/" + encodeURIComponent(id));
      const name = String(res?.name ?? res?.data?.name ?? "");
      setCompanyLabel(name || id);
    } catch {
      setCompanyLabel(id);
    }
  }, [companyId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      const qq = q.trim();
      if (qq) params.set("q", qq);
      if (companyId) params.set("companyId", companyId);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const url = "/contacts?" + params.toString();
      const res: any = await api.get(url);

      const items = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res)
            ? res
            : [];

      setContacts(items.map(mapContact));

      const m = res?.meta;
      if (m && typeof m === "object") {
        setMeta({
          page: Number(m.page ?? page),
          limit: Number(m.limit ?? limit),
          total: Number(m.total ?? items.length),
          hasNext: Boolean(m.hasNext ?? false),
        });
      } else {
        setMeta(null);
      }
    } catch (e: any) {
      setError(e?.message ? String(e.message) : "Failed to load contacts");
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [q, page, companyId]);

  useEffect(() => {
    loadCompany();
  }, [loadCompany]);

  useEffect(() => {
    load();
  }, [load]);

  const canCreate = ability.can("create", "Contact");
  const canUpdate = ability.can("update", "Contact");
  const canDelete = ability.can("delete", "Contact");
  const canViewDeals = ability.can("view", "Opportunity");

  const handleCreate = async () => {
    if (!canCreate) {
      toast({
        title: "Not allowed",
        description: "You do not have permission to create contacts.",
        variant: "destructive",
      });
      return;
    }

    const name = window.prompt("Contact name?");
    if (!name) return;

    const title = window.prompt("Job title (optional)?") ?? "";
    const email = window.prompt("Email (optional)?") ?? "";
    const phone = window.prompt("Phone (optional)?") ?? "";

    const cid = companyId ? companyId : (window.prompt("CompanyId (optional, ex: CO-000001)") ?? "");

    try {
      await api.post("/contacts", {
        name: String(name).trim(),
        title: title ? String(title).trim() : undefined,
        email: email ? String(email).trim() : undefined,
        phone: phone ? String(phone).trim() : undefined,
        companyId: cid ? String(cid).trim() : undefined,
      });
      toast({ title: "Created", description: "Contact created successfully." });
      await load();
    } catch (e: any) {
      toast({
        title: "Create failed",
        description: e?.message ? String(e.message) : "Could not create contact.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (c: Contact) => {
    if (!canUpdate) {
      toast({
        title: "Not allowed",
        description: "You do not have permission to edit contacts.",
        variant: "destructive",
      });
      return;
    }

    const nextName = window.prompt("Name", c.name);
    if (!nextName) return;

    const nextTitle = window.prompt("Job title", c.title ?? "") ?? "";
    const nextEmail = window.prompt("Email", c.email ?? "") ?? "";
    const nextPhone = window.prompt("Phone", c.phone ?? "") ?? "";
    const nextCompany = window.prompt("CompanyId", c.companyId ?? companyId ?? "") ?? "";

    try {
      await api.patch("/contacts/" + encodeURIComponent(c.id), {
        name: String(nextName).trim(),
        title: nextTitle ? String(nextTitle).trim() : undefined,
        email: nextEmail ? String(nextEmail).trim() : undefined,
        phone: nextPhone ? String(nextPhone).trim() : undefined,
        companyId: nextCompany ? String(nextCompany).trim() : undefined,
      });
      toast({ title: "Updated", description: "Contact updated." });
      await load();
    } catch (e: any) {
      toast({
        title: "Update failed",
        description: e?.message ? String(e.message) : "Could not update contact.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (c: Contact) => {
    if (!canDelete) {
      toast({
        title: "Not allowed",
        description: "You do not have permission to delete contacts.",
        variant: "destructive",
      });
      return;
    }
    const ok = window.confirm("Delete contact: " + c.name + "?");
    if (!ok) return;

    try {
      await api.delete("/contacts/" + encodeURIComponent(c.id));
      toast({ title: "Deleted", description: "Contact deleted." });
      await load();
    } catch (e: any) {
      toast({
        title: "Delete failed",
        description: e?.message ? String(e.message) : "Could not delete contact.",
        variant: "destructive",
      });
    }
  };

  const title = useMemo(() => {
    const total = meta?.total ?? contacts.length;
    return "Contacts" + (total ? " (" + String(total) + ")" : "");
  }, [meta?.total, contacts.length]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-headline text-3xl font-bold text-primary">CRM • Contacts</h1>
          <p className="mt-1 text-sm text-muted-foreground">Step 2: contacts CRUD + company linkage</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/crm?mode=data">Back to CRM</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/crm/companies">Companies</Link>
          </Button>
          <Button onClick={handleCreate} variant="accent" disabled={!canCreate}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Contact
          </Button>
        </div>
      </div>

      {companyId ? (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Company filter</Badge>
          <span className="text-sm text-muted-foreground">
            {companyLabel ? companyLabel : companyId}
          </span>
          <Button asChild variant="ghost" size="sm">
            <Link href="/crm/contacts">Clear</Link>
          </Button>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="max-w-md">
          <Input
            placeholder="Search contacts (name, email, phone…)"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={loading || (meta?.page ?? page) <= 1}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={loading || meta?.hasNext === false}
          >
            Next
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">{title}</CardTitle>
          <CardDescription>Contacts belong to companies. Next step: link contacts to deals (opportunities).</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          ) : null}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-sm text-muted-foreground">Loading…</TableCell>
                </TableRow>
              ) : contacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-sm text-muted-foreground">No contacts.</TableCell>
                </TableRow>
              ) : (
                contacts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      <div>{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.title || ""}</div>
                    </TableCell>
                    <TableCell>{c.companyName || c.companyId || "—"}</TableCell>
                    <TableCell>{c.email || "—"}</TableCell>
                    <TableCell>{c.phone || "—"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canViewDeals ? (
                            <DropdownMenuItem asChild>
                              <Link href={`/opportunities?mode=data&contact=${encodeURIComponent(c.id)}`}>
                                Deals
                              </Link>
                            </DropdownMenuItem>
                          ) : null}
                          {canUpdate ? <DropdownMenuItem onClick={() => handleEdit(c)}>Edit</DropdownMenuItem> : null}
                          {canDelete ? <DropdownMenuItem onClick={() => handleDelete(c)} className="text-destructive">Delete</DropdownMenuItem> : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

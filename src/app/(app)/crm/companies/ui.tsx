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

import { api } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useAbility } from "@/lib/ability";
import type { Company } from "@/lib/types";

type PageMeta = {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
};

function mapCompany(doc: any): Company {
  return {
    id: String(doc?.companyId ?? doc?.id ?? ""),
    name: String(doc?.name ?? ""),
    industry: doc?.industry ? String(doc.industry) : undefined,
    website: doc?.website ? String(doc.website) : undefined,
    email: doc?.email ? String(doc.email) : undefined,
    phone: doc?.phone ? String(doc.phone) : undefined,
    address: doc?.address ? String(doc.address) : undefined,
  };
}

export function CrmCompaniesClientPage() {
  const { toast } = useToast();
  const ability = useAbility();

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const [companies, setCompanies] = useState<Company[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      const qq = q.trim();
      if (qq) params.set("q", qq);
      params.set("page", String(page));
      params.set("limit", String(limit));

      const url = "/companies?" + params.toString();
      const res: any = await api.get(url);

      const items = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res)
            ? res
            : [];

      setCompanies(items.map(mapCompany));

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
      setError(e?.message ? String(e.message) : "Failed to load companies");
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [q, page]);

  useEffect(() => {
    load();
  }, [load]);

  const canCreate = ability.can("create", "Company");
  const canUpdate = ability.can("update", "Company");
  const canDelete = ability.can("delete", "Company");
  const canViewContacts = ability.can("view", "Contact");
  const canViewDeals = ability.can("view", "Opportunity");

  const handleCreate = async () => {
    if (!canCreate) {
      toast({ title: "Not allowed", description: "You do not have permission to create companies.", variant: "destructive" });
      return;
    }
    const name = window.prompt("Company name?");
    if (!name) return;

    try {
      await api.post("/companies", { name: String(name).trim() });
      toast({ title: "Created", description: "Company created successfully." });
      await load();
    } catch (e: any) {
      toast({ title: "Create failed", description: e?.message ? String(e.message) : "Could not create company.", variant: "destructive" });
    }
  };

  const handleEdit = async (c: Company) => {
    if (!canUpdate) {
      toast({ title: "Not allowed", description: "You do not have permission to edit companies.", variant: "destructive" });
      return;
    }
    const nextName = window.prompt("New name", c.name);
    if (!nextName) return;

    try {
      await api.patch("/companies/" + encodeURIComponent(c.id), { name: String(nextName).trim() });
      toast({ title: "Updated", description: "Company updated." });
      await load();
    } catch (e: any) {
      toast({ title: "Update failed", description: e?.message ? String(e.message) : "Could not update company.", variant: "destructive" });
    }
  };

  const handleDelete = async (c: Company) => {
    if (!canDelete) {
      toast({ title: "Not allowed", description: "You do not have permission to delete companies.", variant: "destructive" });
      return;
    }
    const ok = window.confirm("Delete company: " + c.name + "?");
    if (!ok) return;

    try {
      await api.delete("/companies/" + encodeURIComponent(c.id));
      toast({ title: "Deleted", description: "Company deleted." });
      await load();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message ? String(e.message) : "Could not delete company.", variant: "destructive" });
    }
  };

  const title = useMemo(() => {
    const total = meta?.total ?? companies.length;
    return "Companies" + (total ? " (" + String(total) + ")" : "");
  }, [meta?.total, companies.length]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-headline text-3xl font-bold text-primary">CRM • Companies</h1>
          <p className="mt-1 text-sm text-muted-foreground">Step 1: companies CRUD (basic UI)</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/crm?mode=data">Back to CRM</Link>
          </Button>
          <Button onClick={handleCreate} variant="accent" disabled={!canCreate}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Company
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="max-w-md">
          <Input
            placeholder="Search companies (name, industry, website…)"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={loading || (meta?.page ?? page) <= 1}>
            Prev
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={loading || meta?.hasNext === false}>
            Next
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">{title}</CardTitle>
          <CardDescription>Companies are a CRM entity. Next step: contacts + link to deals.</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          ) : null}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Website</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-sm text-muted-foreground">Loading…</TableCell>
                </TableRow>
              ) : companies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-sm text-muted-foreground">No companies.</TableCell>
                </TableRow>
              ) : (
                companies.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.industry || "—"}</TableCell>
                    <TableCell>{c.website || "—"}</TableCell>
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
                              <Link href={`/opportunities?mode=data&company=${encodeURIComponent(c.id)}`}>
                                Deals
                              </Link>
                            </DropdownMenuItem>
                          ) : null}
                          {canViewContacts ? (
                            <DropdownMenuItem asChild>
                              <Link href={`/crm/contacts?companyId=${encodeURIComponent(c.id)}`}>
                                Contacts
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

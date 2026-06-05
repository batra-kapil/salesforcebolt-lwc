import { useState } from 'react';
import { AlertCircleIcon, PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { useCases, type CaseNode } from '@/hooks/useCases';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const STATUS_OPTIONS = ['New', 'Working', 'Escalated', 'Closed'] as const;
const PRIORITY_OPTIONS = ['High', 'Medium', 'Low'] as const;

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

function statusVariant(status: string | null | undefined): BadgeVariant {
  switch (status) {
    case 'New':
      return 'default';
    case 'Working':
      return 'secondary';
    case 'Escalated':
      return 'destructive';
    case 'Closed':
      return 'outline';
    default:
      return 'secondary';
  }
}

function priorityVariant(priority: string | null | undefined): BadgeVariant {
  switch (priority) {
    case 'High':
      return 'destructive';
    case 'Medium':
      return 'default';
    case 'Low':
      return 'secondary';
    default:
      return 'outline';
  }
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function Cases() {
  const { cases, isLoading, error, refetch, createCase, updateCaseStatus, deleteCase } =
    useCases();

  // New Case dialog
  const [newOpen, setNewOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [newStatus, setNewStatus] = useState<string>('New');
  const [priority, setPriority] = useState<string>('Medium');
  const [isCreating, setIsCreating] = useState(false);

  // Update Status dialog
  const [editCase, setEditCase] = useState<CaseNode | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Per-row delete tracking
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!subject.trim()) return;
    setIsCreating(true);
    await createCase(subject.trim(), newStatus, priority);
    setIsCreating(false);
    setNewOpen(false);
    setSubject('');
    setNewStatus('New');
    setPriority('Medium');
  };

  const handleUpdateStatus = async () => {
    if (!editCase || !editStatus) return;
    setIsUpdating(true);
    await updateCaseStatus(editCase.Id, editStatus);
    setIsUpdating(false);
    setEditCase(null);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteCase(id);
    setDeletingId(null);
  };

  const openEditDialog = (c: CaseNode) => {
    setEditCase(c);
    setEditStatus(c.Status?.value ?? 'New');
  };

  // Full-page loading (first fetch, no data yet)
  if (isLoading && cases.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner className="size-8 text-muted-foreground" />
      </div>
    );
  }

  // Full-page error (no data to show)
  if (error && cases.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
          <AlertCircleIcon className="size-5 shrink-0" />
          <p className="text-sm">{error.message}</p>
        </div>
        <Button variant="outline" onClick={refetch}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Cases</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {cases.length} case{cases.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* New Case dialog */}
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon />
              New Case
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Case</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-subject">Subject</Label>
                <Input
                  id="new-subject"
                  placeholder="Describe the issue"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(s => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map(p => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={!subject.trim() || isCreating}>
                {isCreating && <Spinner />}
                Create Case
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Inline error banner when stale data is still visible */}
      {error && cases.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-destructive mb-4 text-sm">
          <AlertCircleIcon className="size-4 shrink-0" />
          {error.message}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && cases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-muted/30">
          <p className="text-muted-foreground text-sm mb-3">No cases yet.</p>
          <Button variant="outline" onClick={() => setNewOpen(true)}>
            <PlusIcon />
            Create your first case
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case #</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Skeleton rows while re-fetching over existing data */}
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 rounded bg-muted animate-pulse w-20" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : cases.map(c => (
                    <TableRow key={c.Id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {c.CaseNumber?.value ?? '—'}
                      </TableCell>
                      <TableCell className="max-w-64 truncate">
                        {c.Subject?.value ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(c.Status?.value)}>
                          {c.Status?.value ?? '—'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={priorityVariant(c.Priority?.value)}>
                          {c.Priority?.value ?? '—'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {formatDate(c.CreatedDate?.value)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEditDialog(c)}
                            aria-label="Update status"
                          >
                            <PencilIcon />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(c.Id)}
                            disabled={deletingId === c.Id}
                            aria-label="Delete case"
                          >
                            {deletingId === c.Id ? <Spinner /> : <Trash2Icon />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Update Status dialog */}
      <Dialog open={!!editCase} onOpenChange={open => { if (!open) setEditCase(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-1.5 py-2">
            <Label>Status</Label>
            <Select value={editStatus} onValueChange={setEditStatus}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(s => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateStatus} disabled={!editStatus || isUpdating}>
              {isUpdating && <Spinner />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

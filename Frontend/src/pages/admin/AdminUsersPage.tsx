import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Search, CheckCircle2, XCircle, Eye, X, AlertCircle, FileText, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { adminService } from "@/services/api";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import ConfirmModal from "@/components/ConfirmModal";

interface UserItem {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    created_at?: string;
    last_login?: string;
}

interface Report {
    id: string;
    reporter_id: string;
    reported_id: string;
    reporter_role: string;
    reported_role: string;
    reporter_name?: string;
    reported_name?: string;
    reason: string;
    description: string;
    context_type: string;
    context_id?: string;
    status: string;
    admin_notes?: string;
    created_at?: string;
    updated_at?: string;
}

interface ConfirmAction {
    type: "suspend" | "ban" | "delete";
    user: UserItem;
    status?: "suspended" | "banned";
}

const ROLE_FILTERS = [
    { value: "all", label: "Semua" },
    { value: "patient", label: "Pasien" },
    { value: "doctor", label: "Dokter" },
    { value: "ambulance", label: "Ambulance" },
    { value: "admin", label: "Admin" },
];

const STATUS_LABELS: Record<string, string> = {
    active: "Active",
    suspended: "Suspended",
    banned: "Banned",
    pending: "Pending",
};

const ROLE_LABELS: Record<string, string> = {
    patient: "Pasien",
    doctor: "Dokter",
    ambulance: "Ambulance",
    admin: "Admin",
};

const REPORT_STATUS_LABELS: Record<string, string> = {
    pending: "Pending",
    reviewed: "Reviewed",
    resolved: "Resolved",
    dismissed: "Dismissed",
};

const REPORT_REASON_LABELS: Record<string, string> = {
    inappropriate_behavior: "Perilaku Tidak Pantas",
    unprofessional: "Tidak Profesional",
    harassment: "Pelecehan / Harassment",
    fraud: "Penipuan / Fraud",
    other: "Lainnya",
};

const REPORT_CONTEXT_LABELS: Record<string, string> = {
    consultation: "Consultation",
    emergency: "Emergency",
};

const formatDate = (value?: string) =>
    value
        ? new Date(value).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
        })
        : "-";

export default function AdminUsersPage() {
    const [roleFilter, setRoleFilter] = useState("all");
    const [searchText, setSearchText] = useState("");
    const [isUpdating, setIsUpdating] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
    const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

    // Mengambil isFetching dari useQuery agar proses refetch di latar belakang dapat dideteksi
    const { data, isLoading, isFetching, error, refetch } = useQuery<{ users: UserItem[] }, Error>({
        queryKey: ["adminUsers", roleFilter],
        queryFn: async () => {
            const response = await adminService.getUsers(
                roleFilter === "all" ? undefined : { role: roleFilter }
            );
            return response.data;
        },
    });

    const { data: reportsData, isLoading: reportsLoading } = useQuery<{ reports: Report[] }, Error>({
        queryKey: ["adminUserReports", selectedUser?.id],
        queryFn: async () => {
            if (!selectedUser?.id) return { reports: [] };
            try {
                const response = await adminService.getUserReports(selectedUser.id);
                return response.data;
            } catch {
                return { reports: [] };
            }
        },
        enabled: !!selectedUser?.id,
    });

    const users: UserItem[] = useMemo(() => data?.users ?? [], [data]);

    const filteredUsers = useMemo(
        () =>
            users.filter((user) => {
                const keyword = searchText.toLowerCase();
                return (
                    user.name?.toLowerCase().includes(keyword) ||
                    user.email?.toLowerCase().includes(keyword) ||
                    user.role?.toLowerCase().includes(keyword)
                );
            }),
        [searchText, users]
    );

    const handleUpdateStatus = async (user: UserItem, status: string) => {
        setIsUpdating(true);
        try {
            await adminService.updateUserStatus(user.id, status);
            toast.success(
                `Status akun ${user.name} berhasil diubah menjadi ${STATUS_LABELS[status] || status}`
            );
            await refetch();
        } catch (error) {
            const err = error as { response?: { data?: { detail?: string } } };
            toast.error(err?.response?.data?.detail || "Gagal mengubah status pengguna.");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteUser = async (user: UserItem) => {
        setIsUpdating(true);
        try {
            await adminService.deleteUser(user.id);
            toast.success(`Akun ${user.name} berhasil dihapus.`);
            await refetch();
            setSelectedUser((current) => (current?.id === user.id ? null : current));
        } catch (error) {
            const err = error as { response?: { data?: { detail?: string } } };
            toast.error(err?.response?.data?.detail || "Gagal menghapus pengguna.");
        } finally {
            setIsUpdating(false);
            setConfirmAction(null);
        }
    };

    const handleConfirmAction = async () => {
        if (!confirmAction) {
            return;
        }

        if (confirmAction.type === "delete") {
            await handleDeleteUser(confirmAction.user);
            return;
        }

        if (confirmAction.status) {
            await handleUpdateStatus(confirmAction.user, confirmAction.status);
        }
        setConfirmAction(null);
    };

    const handleRefreshAll = () => {
        setSearchText("");
        if (roleFilter !== "all") {
            setRoleFilter("all");
        } else {
            refetch();
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Users className="h-6 w-6 text-primary" />
                        Pengelolaan Akun Pengguna
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Sebagai admin, Anda dapat melihat, menyaring, dan bertindak terhadap akun yang terdaftar.
                    </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari nama atau email..."
                            value={searchText}
                            onChange={(event) => setSearchText(event.target.value)}
                            className="min-w-[220px]"
                        />
                    </div>
                    <div className="w-full sm:w-48">
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Filter peran" />
                            </SelectTrigger>
                            <SelectContent>
                                {ROLE_FILTERS.map((role) => (
                                    <SelectItem key={role.value} value={role.value}>
                                        {role.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleRefreshAll}
                        disabled={isLoading || isFetching}
                        title="Segarkan data"
                        className="shrink-0"
                    >
                        <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            <Card className="shadow-card">
                <CardHeader>
                    <CardTitle>Daftar Pengguna</CardTitle>
                </CardHeader>
                <CardContent>
                    {(isLoading || (isFetching && !data)) ? (
                        <div className="grid gap-4">
                            {[...Array(4)].map((_, idx) => (
                                <div key={idx} className="h-12 rounded-lg bg-muted/40 animate-pulse" />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="text-red-500">Gagal memuat daftar pengguna.</div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground flex flex-col items-center justify-center gap-4">
                            <p>Tidak ada pengguna yang cocok dengan filter saat ini.</p>
                            <Button 
                                variant="outline" 
                                onClick={handleRefreshAll}
                                className="gap-2"
                                disabled={isFetching}
                            >
                                <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                                Segarkan & Reset Filter
                            </Button>
                        </div>
                    ) : (
                        <Table className="min-w-full table-auto">
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Peran</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Terdaftar</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map((user) => {
                                    const normalizedStatus = user.status?.toLowerCase() || "pending";
                                    const isActive = normalizedStatus === "active";
                                    return (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {ROLE_LABELS[user.role] || user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={
                                                        isActive
                                                            ? "bg-success/10 text-success border-success/20"
                                                            : "bg-destructive/10 text-destructive border-destructive/20"
                                                    }
                                                >
                                                    {STATUS_LABELS[normalizedStatus] || user.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {formatDate(user.created_at)}
                                            </TableCell>
                                            <TableCell className="text-right space-x-2 whitespace-nowrap">
                                                <div className="inline-flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setSelectedUser(user)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    {normalizedStatus === "active" && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => setConfirmAction({ type: "suspend", user, status: "suspended" })}
                                                                disabled={isUpdating}
                                                            >
                                                                <XCircle className="h-4 w-4 mr-1" /> Suspend
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => setConfirmAction({ type: "ban", user, status: "banned" })}
                                                                disabled={isUpdating}
                                                            >
                                                                <AlertCircle className="h-4 w-4 mr-1" /> Ban
                                                            </Button>
                                                        </>
                                                    )}
                                                    {normalizedStatus === "suspended" && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="secondary"
                                                                onClick={() => handleUpdateStatus(user, "active")}
                                                                disabled={isUpdating}
                                                            >
                                                                <CheckCircle2 className="h-4 w-4 mr-1" /> Aktifkan
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => setConfirmAction({ type: "ban", user, status: "banned" })}
                                                                disabled={isUpdating}
                                                            >
                                                                <AlertCircle className="h-4 w-4 mr-1" /> Ban
                                                            </Button>
                                                        </>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => setConfirmAction({ type: "delete", user })}
                                                        disabled={isUpdating}
                                                    >
                                                        <X className="h-4 w-4 mr-1" /> Delete
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <ConfirmModal
                open={confirmAction !== null}
                onOpenChange={(open) => !open && setConfirmAction(null)}
                title={
                    confirmAction?.type === "delete"
                        ? "Hapus Akun"
                        : confirmAction?.type === "ban"
                            ? "Ban Akun"
                            : "Suspend Akun"
                }
                description={
                    confirmAction?.type === "delete"
                        ? "Apakah Anda yakin ingin menghapus akun ini secara permanen?"
                        : confirmAction?.type === "ban"
                            ? "Apakah Anda yakin ingin memblokir akun ini? Data pengguna akan tetap tersimpan tetapi akses akan diblokir."
                            : "Apakah Anda yakin ingin menangguhkan akun ini sementara? Pengguna tidak bisa login sampai akun diaktifkan kembali oleh admin."
                }
                onConfirm={handleConfirmAction}
                confirmText={
                    confirmAction?.type === "delete"
                        ? "Hapus"
                        : confirmAction?.type === "ban"
                            ? "Ban"
                            : "Suspend"
                }
                variant={confirmAction?.type === "delete" || confirmAction?.type === "ban" ? "destructive" : "default"}
            />

            {/* Dialog untuk menampilkan detail pengguna */}
            <Dialog open={selectedUser !== null} onOpenChange={(open) => !open && setSelectedUser(null)}>
                <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Detail Pengguna: {selectedUser?.name || "-"}</DialogTitle>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="space-y-6">
                            <div className="border rounded-2xl bg-surface shadow-sm p-5">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-muted-foreground">Informasi Pengguna</p>
                                        <h2 className="text-xl font-semibold text-foreground mt-1">{selectedUser.name || "-"}</h2>
                                        <p className="text-sm text-muted-foreground">{selectedUser.email || "-"}</p>
                                    </div>
                                    <Badge className="capitalize">
                                        {ROLE_LABELS[selectedUser.role] || selectedUser.role || "-"}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                                    <div className="rounded-2xl bg-background/80 p-4 border border-border">
                                        <p className="text-xs text-muted-foreground">Status Akun</p>
                                        <p className="mt-1 font-medium text-sm">
                                            {STATUS_LABELS[selectedUser.status?.toLowerCase() || "pending"] || selectedUser.status || "-"}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-background/80 p-4 border border-border">
                                        <p className="text-xs text-muted-foreground">Terdaftar</p>
                                        <p className="mt-1 font-medium text-sm">{formatDate(selectedUser.created_at)}</p>
                                    </div>
                                    <div className="rounded-2xl bg-background/80 p-4 border border-border">
                                        <p className="text-xs text-muted-foreground">ID Pengguna</p>
                                        <p className="mt-1 font-mono text-xs break-all">{selectedUser.id || "-"}</p>
                                    </div>
                                    <div className="rounded-2xl bg-background/80 p-4 border border-border">
                                        <p className="text-xs text-muted-foreground">Email</p>
                                        <p className="mt-1 font-medium text-sm">{selectedUser.email || "-"}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Laporan ({reportsData?.reports?.length || 0})
                                </h3>
                                {reportsLoading ? (
                                    <div className="space-y-2">
                                        {[...Array(2)].map((_, idx) => (
                                            <div key={idx} className="h-24 rounded-lg bg-muted/40 animate-pulse" />
                                        ))}
                                    </div>
                                ) : reportsData?.reports && reportsData.reports.length > 0 ? (
                                    <div className="space-y-3">
                                        {reportsData.reports.map((report) => (
                                            <div key={report.id} className="border rounded-lg p-3 space-y-2 bg-muted/30">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs text-muted-foreground mb-1">
                                                            Dari: {report.reporter_name || "-"} ({ROLE_LABELS[report.reporter_role] || report.reporter_role || "-"})
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mb-1">
                                                            Dilaporkan: {report.reported_name || "-"} ({ROLE_LABELS[report.reported_role] || report.reported_role || "-"})
                                                        </p>
                                                        <p className="text-sm font-medium break-words">Alasan: {REPORT_REASON_LABELS[report.reason] || report.reason || "-"}</p>
                                                    </div>
                                                    <Badge
                                                        className={`${report.status === "resolved"
                                                            ? "bg-success/10 text-success border-success/20 whitespace-nowrap"
                                                            : report.status === "dismissed"
                                                                ? "bg-destructive/10 text-destructive border-destructive/20 whitespace-nowrap"
                                                                : "bg-muted/10 text-muted-foreground border-muted/20 whitespace-nowrap"
                                                            }`}
                                                    >
                                                        {REPORT_STATUS_LABELS[report.status] || report.status || "-"}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{report.description || "-"}</p>
                                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground pt-2 border-t">
                                                    <span>Konteks: {REPORT_CONTEXT_LABELS[report.context_type] || report.context_type || "-"}</span>
                                                    <span>{formatDate(report.created_at)}</span>
                                                </div>
                                                {report.admin_notes && (
                                                    <div className="bg-yellow-500/10 rounded p-2 mt-2 border border-yellow-500/20">
                                                        <p className="text-xs font-medium text-yellow-700 mb-1">Catatan Admin:</p>
                                                        <p className="text-xs text-yellow-700">{report.admin_notes}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-muted-foreground border rounded-lg bg-muted/30">
                                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">Tidak ada laporan terkait pengguna ini</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                        <Button variant="outline" onClick={() => setSelectedUser(null)}>
                            Tutup
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
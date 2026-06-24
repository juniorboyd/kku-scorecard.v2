import type { Request, Response } from "express";
import prisma from "../lib/prisma.ts";
import { writeAuditLog } from "../services/logService.ts";

const USER_SORT_MAP: Record<string, any> = {
  email:     { email: "asc" },
  name:      { firstName: "asc" },
  status:    { status: "asc" },
  createdAt: { createdAt: "asc" },
};

// GET /api/admin/users
export async function listUsers(req: Request, res: Response) {
  const { search = "", role = "", status = "", limit = "20", offset = "0", sortBy = "createdAt", sortOrder = "desc" } = req.query as Record<string, string>;

  const where: any = {};
  if (search) {
    where.OR = [
      { email: { contains: search, mode: "insensitive" } },
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
    ];
  }
  if (role) where.role = role;
  if (status) where.status = status;

  const dir: "asc" | "desc" = sortOrder === "asc" ? "asc" : "desc";
  const baseOrder = USER_SORT_MAP[sortBy] ?? { createdAt: "asc" };
  const orderBy = JSON.parse(JSON.stringify(baseOrder).replace(/"asc"/g, `"${dir}"`));

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy,
      take: Number(limit),
      skip: Number(offset),
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        facultyName: true,
        createdAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  // KPI counts (always total, no filter)
  const [totalUsers, activeCount, pendingCount, bannedCount] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { status: "PENDING" } }),
    prisma.user.count({ where: { status: "BANNED" } }),
  ]);

  return res.json({ items, total, kpi: { totalUsers, activeCount, pendingCount, bannedCount } });
}

// POST /api/admin/users — pre-register a user
export async function createUser(req: Request, res: Response) {
  const { email, role = "VIEWER", note } = req.body as { email: string; role?: string; note?: string };
  if (!email) return res.status(400).json({ error: "email is required" });

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) return res.status(409).json({ error: "User already exists" });

  const user = await prisma.user.create({
    data: { email: normalizedEmail, role: role as any, status: "PENDING" },
  });

  await writeAuditLog(req.user?.id, `ADMIN_CREATE_USER:${normalizedEmail}${note ? ` (${note})` : ""}`);
  return res.status(201).json({ success: true, user });
}

// PATCH /api/admin/users/:id/role
export async function updateUserRole(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { role } = req.body as { role: string };
  if (!["ADMIN", "ANALYST", "VIEWER"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  const user = await prisma.user.update({ where: { id }, data: { role: role as any } });
  await writeAuditLog(req.user?.id, `ADMIN_UPDATE_ROLE:${user.email}→${role}`);
  return res.json({ success: true, user });
}

// PATCH /api/admin/users/:id/status
export async function updateUserStatus(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { status } = req.body as { status: string };
  if (!["ACTIVE", "BANNED", "PENDING"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const user = await prisma.user.update({ where: { id }, data: { status: status as any } });
  await writeAuditLog(req.user?.id, `ADMIN_UPDATE_STATUS:${user.email}→${status}`);
  return res.json({ success: true, user });
}

// DELETE /api/admin/users/:id
export async function deleteUser(req: Request, res: Response) {
  const id = Number(req.params.id);
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ error: "User not found" });

  // Nullify FK references before deleting
  await prisma.auditLog.updateMany({ where: { userId: id }, data: { userId: null } });
  await prisma.import.updateMany({ where: { uploadedById: id }, data: { uploadedById: null } });
  await prisma.user.delete({ where: { id } });

  await writeAuditLog(req.user?.id, `ADMIN_DELETE_USER:${user.email}`);
  return res.json({ success: true });
}

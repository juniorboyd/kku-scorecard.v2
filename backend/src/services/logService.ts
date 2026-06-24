import prisma from "../lib/prisma.ts";
import { AuditStatus } from "@prisma/client";

export async function writeAuditLog(userId: number | null | undefined, action: string, status: AuditStatus = "SUCCESS") {
  try {
    return await prisma.auditLog.create({
      data: { userId: userId ?? null, action, status },
    });
  } catch {
    return prisma.auditLog.create({ data: { userId: null, action, status } });
  }
}

const LOG_SORT_MAP: Record<string, any> = {
  user:      { user: { email: "asc" } },
  role:      { user: { role: "asc" } },
  action:    { action: "asc" },
  status:    { status: "asc" },
  createdAt: { createdAt: "asc" },
};

export async function getAuditLogs(options?: {
  limit?: number; offset?: number; userId?: number;
  status?: AuditStatus; sortBy?: string; sortOrder?: string;
}) {
  const { limit = 50, offset = 0, userId, status, sortBy = "createdAt", sortOrder = "desc" } = options ?? {};
  const where: any = {};
  if (userId) where.userId = userId;
  if (status) where.status = status;

  const dir: "asc" | "desc" = sortOrder === "asc" ? "asc" : "desc";
  const baseOrder = LOG_SORT_MAP[sortBy] ?? { createdAt: "asc" };
  const orderBy = JSON.parse(JSON.stringify(baseOrder).replace(/"asc"/g, `"${dir}"`));

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { id: true, firstName: true, lastName: true, email: true, role: true } } },
      orderBy,
      take: limit,
      skip: offset,
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { items, total };
}

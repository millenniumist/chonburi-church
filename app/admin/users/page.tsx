import { asc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { requireRole } from '@/lib/auth';
import { getLocale } from '@/lib/locale';
import { pick } from '@/lib/i18n';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { OrderingToggle, RoleSelect } from '@/components/admin/user-row-controls';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  await requireRole('admin');
  const locale = await getLocale();

  // Select only what we render — NEVER expose passwordHash to the client.
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      orderingEnabled: users.orderingEnabled,
    })
    .from(users)
    .orderBy(asc(users.createdAt));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={pick('ผู้ใช้', 'Users', locale)}
        description={pick(
          'จัดการบทบาทและสิทธิ์การสั่งกาแฟ',
          'Manage roles and the coffee-ordering gate.',
          locale,
        )}
      />

      <div className="rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{pick('ชื่อ', 'Name', locale)}</TableHead>
              <TableHead>{pick('อีเมล', 'Email', locale)}</TableHead>
              <TableHead>{pick('บทบาท', 'Role', locale)}</TableHead>
              <TableHead>{pick('สิทธิ์สั่งซื้อ', 'Ordering', locale)}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  {pick('ยังไม่มีผู้ใช้', 'No users yet.', locale)}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-muted-foreground">{row.email}</TableCell>
                  <TableCell>
                    <RoleSelect userId={row.id} role={row.role} locale={locale} />
                  </TableCell>
                  <TableCell>
                    <OrderingToggle
                      userId={row.id}
                      orderingEnabled={row.orderingEnabled}
                      locale={locale}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

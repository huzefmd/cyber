import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const listReports = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("security_reports")
      .select("id, report_name, storage_path, file_size, scan_id, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error("Could not load reports.");
    return data ?? [];
  });

export const recordReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        reportName: z.string().trim().min(1).max(160),
        storagePath: z.string().trim().min(1).max(400),
        fileSize: z.number().int().nonnegative(),
        scanId: z.string().uuid().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("security_reports").insert({
      user_id: context.userId,
      report_name: data.reportName,
      storage_path: data.storagePath,
      file_size: data.fileSize,
      scan_id: data.scanId ?? null,
    });
    if (error) throw new Error("Could not save the report record.");
    return { ok: true };
  });

export const deleteReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("security_reports")
      .select("storage_path")
      .eq("id", data.id)
      .maybeSingle();
    if (row?.storage_path) {
      await context.supabase.storage.from("security-reports").remove([row.storage_path]);
    }
    const { error } = await context.supabase
      .from("security_reports")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error("Could not delete the report.");
    return { ok: true };
  });

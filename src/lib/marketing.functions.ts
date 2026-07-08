import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((raw) => z.object({ email: z.string().email() }).parse(raw))
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { error } = await supabase.from("newsletter_subscribers").insert({ email: data.email });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    return { ok: true };
  });

export const sendContact = createServerFn({ method: "POST" })
  .inputValidator((raw) =>
    z
      .object({
        name: z.string().min(1).max(200),
        email: z.string().email(),
        message: z.string().min(1).max(4000),
      })
      .parse(raw),
  )
  .handler(async ({ data }) => {
    const supabase = publicClient();
    const { error } = await supabase.from("contact_messages").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve((_req: Request) => {
  return new Response("Hello World", {});
});

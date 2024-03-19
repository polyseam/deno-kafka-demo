import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// roll dice
const rollDice = () => {
  return Math.floor(Math.random() * 6) + 1;
};

serve((_req: Request) => {
  
  return new Response(`you rolled ${rollDice()}`, {});
});

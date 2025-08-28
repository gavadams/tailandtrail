import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Check if Stripe secret key is available
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
if (!stripeSecretKey) {
  console.error("STRIPE_SECRET_KEY environment variable is not set");
}

const stripe = new Stripe(stripeSecretKey || "", {
  httpClient: Stripe.createFetchHttpClient()
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log("Request method:", req.method);
    console.log("Request headers:", Object.fromEntries(req.headers.entries()));

    // Check content type
    const contentType = req.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("Invalid content type:", contentType);
      return new Response(JSON.stringify({
        error: "Content-Type must be application/json"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Read and parse request body
    const bodyText = await req.text();
    console.log("Received body:", bodyText);

    if (!bodyText || bodyText.trim() === "") {
      console.error("Empty request body");
      return new Response(JSON.stringify({
        error: "Request body is empty"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    let requestData;
    try {
      requestData = JSON.parse(bodyText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return new Response(JSON.stringify({
        error: "Invalid JSON in request body"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log("Parsed request data:", requestData);

    // Extract required fields
    const { amount, game_id, email, currency = "usd" } = requestData;

    if (!amount || !game_id || !email) {
      console.error("Missing required fields:", { amount, game_id, email });
      return new Response(JSON.stringify({
        error: "Missing required fields: amount, game_id, and email are required"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Validate amount is a positive number
    if (typeof amount !== "number" || amount <= 0) {
      console.error("Invalid amount:", amount);
      return new Response(JSON.stringify({
        error: "Amount must be a positive number"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log("Creating payment intent with:", { amount, currency, game_id, email });

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Ensure it's an integer
      currency: currency.toLowerCase(),
      metadata: {
        game_id,
        email
      },
      automatic_payment_methods: {
        enabled: true
      }
    });

    console.log("Payment intent created successfully:", paymentIntent.id);

    return new Response(JSON.stringify({
      client_secret: paymentIntent.client_secret
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error creating payment intent:", error);
    return new Response(JSON.stringify({
      error: error.message || "Internal server error"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
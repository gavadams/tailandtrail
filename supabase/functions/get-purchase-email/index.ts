import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get access_code_id from request body
    const { access_code_id } = await req.json()

    if (!access_code_id) {
      return new Response(
        JSON.stringify({ error: 'access_code_id is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Query purchases table to get email and id
    const { data: purchaseData, error: purchaseError } = await supabaseClient
      .from('purchases')
      .select('id,email')
      .eq('access_code_id', access_code_id)
      .single()

    if (purchaseError) {
      console.error('Error fetching purchase data:', purchaseError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch purchase data' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!purchaseData) {
      return new Response(
        JSON.stringify({ error: 'No purchase found for this access code' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Return the email and purchase_id
    return new Response(
      JSON.stringify({ email: purchaseData.email, purchase_id: purchaseData.id }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

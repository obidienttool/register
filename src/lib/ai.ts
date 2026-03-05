import { createClient } from '@/utils/supabase/server'

// Prevent client-side leaks and ensure it strictly runs on edge/server.
export async function analyzeNetworkMetrics(metrics: any) {
    const supabase = await createClient()

    // Fetch dynamic config from DB
    const { data: settings } = await supabase.from('app_settings').select('id, value')
    const config = Object.fromEntries(settings?.map(s => [s.id, s.value]) || [])

    const provider = (config.ai_provider || process.env.AI_PROVIDER || 'openai').toLowerCase()
    const apiKey = provider === 'grok'
        ? (config.xai_api_key || process.env.XAI_API_KEY)
        : (config.openai_api_key || process.env.OPENAI_API_KEY)

    const baseURL = provider === 'grok' ? 'https://api.x.ai/v1' : undefined
    const model = provider === 'grok'
        ? (config.grok_model || 'grok-beta')
        : (config.openai_model || 'gpt-4o-mini')

    if (!apiKey) {
        console.warn(`${provider.toUpperCase()} API key not found. Implementing mocked intelligence layer.`)
        return {
            strengths: ["Local data suggests increasing verified rates across 3 major LGAs.", "Primary ward structures remain active."],
            weaknesses: ["Missing API key to generate deep algorithmic correlations.", "Several LGAs remain beneath 20% verification density."],
            risk_alerts: ["Unauthenticated coordinators risk network spam."],
            recommended_actions: [`Install ${provider.toUpperCase()} API key inside dashboard environment or Admin Settings.`, "Dispatch mobilization SMS to weak LGAs."],
            suggested_sms_copy: "URGENT: Ensure all regional team members finalize verification today. Log into your dashboard."
        }
    }

    const openai = new OpenAI({ apiKey, baseURL })

    const systemPrompt = config.ai_system_instructions || `You are a High-Level Strategic Intelligence Advisor for a regional political mobilization network.
You will be provided with aggregated structural metrics mapping member verifications, geographic densities, polling unit structures, and SMS activity.
Please analyze the data and return an intelligent operational report in strictly valid JSON format exactly matching the following schema:

{
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "risk_alerts": ["...", "..."],
  "recommended_actions": ["...", "..."],
  "suggested_sms_copy": "..."
}`

    try {
        const response = await openai.chat.completions.create({
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: JSON.stringify(metrics, null, 2) }
            ],
            response_format: { type: 'json_object' }
        })

        const content = response.choices[0]?.message?.content
        if (!content) throw new Error('Empty AI Response')

        return JSON.parse(content)
    } catch (e: any) {
        console.error(`${provider.toUpperCase()} Initialization Error:`, e.message)
        throw new Error(`Intelligence Engine (${provider}) failed to analyze metrics: ` + e.message)
    }
}

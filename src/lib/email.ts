import { getInternalSetting } from '@/app/actions/config'

export async function sendEmail({ to, subject, html }: { to: string[], subject: string, html: string }) {
    const dbApiKey = await getInternalSetting('resend_api_key')
    const dbFromEmail = await getInternalSetting('resend_from_email')

    const apiKey = dbApiKey || process.env.RESEND_API_KEY
    const fromEmail = dbFromEmail || process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

    // Basic mock output for local environment without API KEY
    if (!apiKey) {
        console.warn("RESEND_API_KEY is not configured. Simulating email broadcast to", to.length, "recipients.")
        return {
            success: true,
            id: 'simulated_email_batch_' + Date.now(),
            message: 'Simulated response successfully queued',
            recipients: to.length
        }
    }

    try {
        // Resend API Batch sending
        // Note: Resend allows up to 100 emails in a single batch request via the batch endpoint
        // For simplicity, we implement it as a loop of batch requests or direct single if only one

        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                from: fromEmail,
                to: to, // Resend accepts string or string[]
                subject: subject,
                html: html,
            })
        })

        const data = await response.json()
        return { success: response.ok, ...data }
    } catch (error: any) {
        console.error("Email Broadcast Error:", error)
        return { success: false, error: error.message }
    }
}

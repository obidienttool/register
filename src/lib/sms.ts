import { getInternalSetting } from '@/app/actions/config'

export async function sendSMS({ to, message }: { to: string[], message: string }) {
    const dbApiKey = await getInternalSetting('sms_api_key')
    const dbSenderId = await getInternalSetting('sms_sender_id')

    const apiKey = dbApiKey || process.env.SMS_API_KEY
    const senderId = dbSenderId || process.env.SMS_SENDER_ID || 'OBIDIENT'

    // Format numbers to remove leading zero and add +234 if it's Nigerian
    const formattedNumbers = to.map(phone => {
        let clean = phone.replace(/[^0-9]/g, '')
        if (clean.startsWith('0')) {
            clean = '234' + clean.slice(1)
        }
        return clean
    })

    // Basic mock output for local environment without API KEY
    if (!apiKey) {
        console.warn("SMS_API_KEY is not configured. Simulating broadcast to", formattedNumbers.length, "recipients.")
        return {
            success: true,
            message_id: 'simulated_batch_' + Date.now(),
            message: 'Simulated response successfully queued',
            recipients: formattedNumbers.length
        }
    }

    // Termii API Implementation
    const payload = {
        to: formattedNumbers,
        from: senderId,
        sms: message,
        type: "plain",
        channel: "generic",
        api_key: apiKey
    }

    try {
        const response = await fetch("https://api.ng.termii.com/api/sms/send/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })

        const data = await response.json()
        return { success: response.ok, ...data }
    } catch (error: any) {
        console.error("SMS Broadcast Error:", error)
        return { success: false, error: error.message }
    }
}

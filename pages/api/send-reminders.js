import { createClient } from '@supabase/supabase-js'
import nodemailer from 'nodemailer'
import { buildEmailHTML, buildEmailText, getTomorrowKey } from '../../lib/email'

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Protect endpoint
  const cronSecret = process.env.CRON_SECRET
  const auth = req.headers.authorization
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const timezone = process.env.TIMEZONE || 'UTC'
    const tomorrow = getTomorrowKey(timezone)

    // Get tomorrow's posts
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('date', tomorrow)
      .order('created_at', { ascending: true })

    if (postsError) throw postsError

    if (!posts || posts.length === 0) {
      return res.status(200).json({
        success: true,
        message: `No posts for ${tomorrow}. No emails sent.`,
        sent: 0,
      })
    }

    // Get staff emails
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('*')

    if (staffError) throw staffError
    if (!staff || staff.length === 0) {
      return res.status(200).json({ success: true, message: 'No staff configured.', sent: 0 })
    }

    // Set up Gmail transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password (not your real password)
      },
    })

    const subject = `📅 Upload Schedule for Tomorrow — ${tomorrow}`
    const html = buildEmailHTML(tomorrow, posts)
    const text = buildEmailText(tomorrow, posts)

    // Send to all staff
    const results = await Promise.allSettled(
      staff.map(member =>
        transporter.sendMail({
          from: `"Upload Scheduler" <${process.env.GMAIL_USER}>`,
          to: member.email,
          subject,
          html,
          text,
        })
      )
    )

    const sent = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected')
    if (failed.length) console.error('Failed:', failed.map(f => f.reason?.message))

    return res.status(200).json({
      success: true,
      date: tomorrow,
      postsCount: posts.length,
      staffCount: staff.length,
      sent,
      failed: failed.length,
    })

  } catch (err) {
    console.error('send-reminders error:', err)
    return res.status(500).json({ error: err.message })
  }
}

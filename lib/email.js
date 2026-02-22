export function buildEmailHTML(dateKey, posts) {
  const date = new Date(dateKey + 'T00:00:00')
  const readable = date.toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const postsHTML = posts.map((post, i) => `
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;padding:20px 24px;margin-bottom:14px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
        <span style="background:#FEF3C7;color:#92400E;font-weight:700;font-size:13px;padding:3px 10px;border-radius:20px;font-family:monospace;">#${i + 1}</span>
        <h3 style="margin:0;font-size:17px;color:#111827;font-weight:700;">${post.title}</h3>
      </div>
      ${post.clients && post.clients.length > 0 ? `
        <div style="margin-bottom:10px;">
          ${post.clients.map(c => `<span style="display:inline-block;background:#EDE9FE;color:#5B21B6;font-size:12px;font-weight:600;padding:2px 10px;border-radius:20px;margin-right:6px;">${c}</span>`).join('')}
        </div>
      ` : ''}
      ${post.link ? `
        <div style="margin-bottom:10px;padding:10px 14px;background:#F0FDF4;border:1px solid #BBF7D0;border-radius:7px;">
          <span style="font-size:11px;font-weight:700;color:#166534;letter-spacing:1px;text-transform:uppercase;display:block;margin-bottom:4px;">🔗 LINK</span>
          <a href="${post.link}" style="color:#15803D;font-size:14px;word-break:break-all;text-decoration:none;font-weight:600;">${post.link}</a>
        </div>
      ` : '<div style="margin-bottom:10px;padding:10px 14px;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:7px;font-size:13px;color:#9CA3AF;">No link — upload original content</div>'}
      ${post.caption ? `
        <div style="padding:10px 14px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:7px;">
          <span style="font-size:11px;font-weight:700;color:#1E40AF;letter-spacing:1px;text-transform:uppercase;display:block;margin-bottom:4px;">💬 CAPTION SUGGESTION</span>
          <p style="margin:0;font-size:14px;color:#1E3A5F;line-height:1.6;">${post.caption}</p>
        </div>
      ` : ''}
    </div>
  `).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
    <body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:620px;margin:32px auto;padding:0 16px;">

        <!-- Header -->
        <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:14px 14px 0 0;padding:32px 36px;">
          <div style="font-size:11px;letter-spacing:3px;color:#FFE66D;margin-bottom:8px;text-transform:uppercase;">Upload Scheduler</div>
          <h1 style="margin:0;font-size:26px;color:#ffffff;font-weight:800;">Tomorrow's Upload Schedule</h1>
          <p style="margin:10px 0 0;color:#94A3B8;font-size:15px;">${readable}</p>
          <div style="margin-top:18px;display:inline-block;background:#FFE66D;color:#111;font-size:13px;font-weight:700;padding:6px 16px;border-radius:20px;">${posts.length} upload${posts.length !== 1 ? 's' : ''} to go live</div>
        </div>

        <!-- Body -->
        <div style="background:#F9FAFB;padding:28px 28px 8px;border:1px solid #E5E7EB;border-top:none;">
          <p style="margin:0 0 20px;font-size:14px;color:#6B7280;">Here is tomorrow's content schedule. Please ensure all uploads go live on time.</p>
          ${postsHTML}
        </div>

        <!-- Footer -->
        <div style="background:#F3F4F6;border:1px solid #E5E7EB;border-top:none;border-radius:0 0 14px 14px;padding:20px 28px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9CA3AF;">Sent automatically by Upload Scheduler · Do not reply to this email</p>
        </div>

      </div>
    </body>
    </html>
  `
}

export function buildEmailText(dateKey, posts) {
  const date = new Date(dateKey + 'T00:00:00')
  const readable = date.toLocaleDateString('en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  let text = `UPLOAD SCHEDULE — ${readable}\n`
  text += `${posts.length} upload${posts.length !== 1 ? 's' : ''} scheduled for tomorrow\n`
  text += '='.repeat(50) + '\n\n'

  posts.forEach((post, i) => {
    text += `${i + 1}. ${post.title}\n`
    if (post.clients?.length) text += `   Clients: ${post.clients.join(', ')}\n`
    if (post.link) text += `   Link: ${post.link}\n`
    if (post.caption) text += `   Caption: ${post.caption}\n`
    text += '\n'
  })

  text += '\nSent automatically by Upload Scheduler'
  return text
}

export function getTomorrowKey(timezone = 'UTC') {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(tomorrow)
  const y = parts.find(p => p.type === 'year').value
  const m = parts.find(p => p.type === 'month').value
  const d = parts.find(p => p.type === 'day').value
  return `${y}-${m}-${d}`
}

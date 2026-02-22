import { createClient } from '@supabase/supabase-js'
const sb = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export default async function handler(req, res) {
  const supabase = sb()
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('clients').select('*').order('name')
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }
  if (req.method === 'POST') {
    const { data, error } = await supabase.from('clients').insert(req.body).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }
  if (req.method === 'PUT') {
    const { id, ...rest } = req.body
    const { data, error } = await supabase.from('clients').update(rest).eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }
  if (req.method === 'DELETE') {
    const { error } = await supabase.from('clients').delete().eq('id', req.query.id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }
  res.status(405).json({ error: 'Method not allowed' })
}

import { useState, useEffect, useCallback } from 'react'

const COLORS = ['#FF6B6B','#4ECDC4','#FFE66D','#A78BFA','#6BCB77','#FF9F43','#54A0FF','#FF6B9D']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function toKey(y,m,d) {
  return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
}
function daysIn(y,m) { return new Date(y,m+1,0).getDate() }
function firstDay(y,m) { return new Date(y,m,1).getDay() }
function fmtDate(dk) {
  if (!dk) return ''
  const [y,m,d] = dk.split('-')
  return new Date(+y,+m-1,+d).toLocaleDateString('en-GB',{weekday:'long',year:'numeric',month:'long',day:'numeric'})
}
function fmtShort(dk) {
  if (!dk) return ''
  const [y,m,d] = dk.split('-')
  return new Date(+y,+m-1,+d).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})
}

export default function App() {
  const today = todayKey()
  const [view, setView] = useState('today')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth())
  const [posts, setPosts] = useState([])
  const [clients, setClients] = useState([])
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [selDate, setSelDate] = useState(today)
  const [modal, setModal] = useState(false)
  const [settings, setSettings] = useState(false)
  const [editPost, setEditPost] = useState(null)
  const [form, setForm] = useState({ title:'', link:'', caption:'', clients:[] })
  const [staffForm, setStaffForm] = useState({ name:'', email:'' })
  const [clientForm, setClientForm] = useState({ name:'', color: COLORS[0] })
  const [toast, setToast] = useState(null)
  const [sending, setSending] = useState(false)
  const [linksCopied, setLinksCopied] = useState(false)
  const [allCopied, setAllCopied] = useState(false)

  const showToast = (msg, type='ok') => {
    setToast({msg,type})
    setTimeout(()=>setToast(null), 3000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [p,c,s] = await Promise.all([
        fetch('/api/posts').then(r=>r.json()),
        fetch('/api/clients').then(r=>r.json()),
        fetch('/api/staff').then(r=>r.json()),
      ])
      setPosts(Array.isArray(p)?p:[])
      setClients(Array.isArray(c)?c:[])
      setStaff(Array.isArray(s)?s:[])
    } catch { showToast('Failed to load','err') }
    setLoading(false)
  }, [])

  useEffect(()=>{ load() },[load])

  const forDate = (dk) => posts.filter(p=>p.date===dk)
  const color = (name) => clients.find(c=>c.name===name)?.color || '#888'

  // ── POSTS ─────────────────────────────────────────────────
  const openModal = (dk, post=null) => {
    setSelDate(dk)
    if (post) { setEditPost(post); setForm({title:post.title,link:post.link||'',caption:post.caption||'',clients:post.clients||[]}) }
    else { setEditPost(null); setForm({title:'',link:'',caption:'',clients:[]}) }
    setModal(true)
  }

  const savePost = async () => {
    if (!form.title.trim()) return
    try {
      if (editPost) {
        const r = await fetch('/api/posts',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:editPost.id,...form})})
        const u = await r.json()
        setPosts(p=>p.map(x=>x.id===u.id?u:x))
      } else {
        const r = await fetch('/api/posts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({date:selDate,...form})})
        const u = await r.json()
        setPosts(p=>[...p,u])
      }
      setModal(false)
      showToast('Post saved!')
    } catch { showToast('Save failed','err') }
  }

  const delPost = async (id) => {
    await fetch(`/api/posts?id=${id}`,{method:'DELETE'})
    setPosts(p=>p.filter(x=>x.id!==id))
    showToast('Deleted.')
  }

  const toggleCl = (name) => setForm(f=>({...f,clients:f.clients.includes(name)?f.clients.filter(c=>c!==name):[...f.clients,name]}))

  // ── STAFF ─────────────────────────────────────────────────
  const addStaff = async () => {
    if (!staffForm.name||!staffForm.email) return
    const r = await fetch('/api/staff',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(staffForm)})
    const u = await r.json()
    setStaff(s=>[...s,u])
    setStaffForm({name:'',email:''})
    showToast('Staff added!')
  }
  const delStaff = async (id) => {
    await fetch(`/api/staff?id=${id}`,{method:'DELETE'})
    setStaff(s=>s.filter(x=>x.id!==id))
  }

  // ── CLIENTS ───────────────────────────────────────────────
  const addClient = async () => {
    if (!clientForm.name) return
    const r = await fetch('/api/clients',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(clientForm)})
    const u = await r.json()
    setClients(c=>[...c,u])
    setClientForm({name:'',color:COLORS[Math.floor(Math.random()*COLORS.length)]})
    showToast('Client added!')
  }
  const delClient = async (id) => {
    await fetch(`/api/clients?id=${id}`,{method:'DELETE'})
    setClients(c=>c.filter(x=>x.id!==id))
  }

  // ── EMAIL ─────────────────────────────────────────────────
  const sendNow = async () => {
    setSending(true)
    try {
      const r = await fetch('/api/send-reminders',{method:'POST',headers:{'Content-Type':'application/json'}})
      const d = await r.json()
      if (d.sent>0) showToast(`✅ Email sent to ${d.sent} staff member${d.sent>1?'s':''}!`)
      else showToast(d.message||'No emails sent','err')
    } catch { showToast('Send failed','err') }
    setSending(false)
  }

  // ── COPY HELPERS ──────────────────────────────────────────
  const copyLinks = (dayPosts) => {
    const links = dayPosts.filter(p=>p.link).map(p=>`${p.title}\n${p.link}`).join('\n\n')
    if (!links) { showToast('No links to copy','err'); return }
    navigator.clipboard.writeText(links)
    setLinksCopied(true)
    setTimeout(()=>setLinksCopied(false),2500)
    showToast('All links copied!')
  }

  const copyAll = (dayPosts) => {
    const text = dayPosts.map((p,i) => {
      let s = `${i+1}. ${p.title}`
      if (p.clients?.length) s += `\nClients: ${p.clients.join(', ')}`
      if (p.link) s += `\nLink: ${p.link}`
      if (p.caption) s += `\nCaption: ${p.caption}`
      return s
    }).join('\n\n')
    navigator.clipboard.writeText(text)
    setAllCopied(true)
    setTimeout(()=>setAllCopied(false),2500)
    showToast('Full schedule copied!')
  }

  // ── CALENDAR ──────────────────────────────────────────────
  const cells = []
  for(let i=0;i<firstDay(year,month);i++) cells.push(null)
  for(let d=1;d<=daysIn(year,month);d++) cells.push(d)
  const prevM = ()=>month===0?(setMonth(11),setYear(y=>y-1)):setMonth(m=>m-1)
  const nextM = ()=>month===11?(setMonth(0),setYear(y=>y+1)):setMonth(m=>m+1)

  // ── TOMORROW ──────────────────────────────────────────────
  const tm = new Date(); tm.setDate(tm.getDate()+1)
  const tmKey = toKey(tm.getFullYear(),tm.getMonth(),tm.getDate())
  const tmPosts = forDate(tmKey)
  const todayPosts = forDate(today)
  const selPosts = forDate(selDate)

  if (loading) return (
    <div style={S.root}>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'100vh',gap:16}}>
        <div style={{fontSize:48,color:'#FFE66D'}}>⬡</div>
        <p style={{color:'#555',fontSize:18}}>Loading…</p>
      </div>
    </div>
  )

  return (
    <div style={S.root}>
      {toast && <div style={{...S.toast,...(toast.type==='err'?{background:'#FF6B6B',color:'#fff'}:{})}}>{toast.msg}</div>}

      {/* HEADER */}
      <header style={S.header}>
        <div style={S.logo}>
          <span style={{fontSize:22,color:'#FFE66D'}}>⬡</span>
          <span style={S.logoText}>SCHED<em>ULE</em></span>
        </div>
        <nav style={S.nav}>
          {[
            {id:'today', label:'🌅 Today\'s Uploads'},
            {id:'calendar', label:'📆 Calendar'},
            {id:'schedule', label:'📋 Day View'},
            {id:'email', label:'📧 Email Automation'},
          ].map(({id,label})=>(
            <button key={id} style={{...S.navBtn,...(view===id?S.navActive:{})}} onClick={()=>setView(id)}>
              {label}
              {id==='today'&&todayPosts.length>0&&<span style={{...S.badge,...(view===id?{background:'#111'}:{})}}>{todayPosts.length}</span>}
            </button>
          ))}
          <button style={S.settingsBtn} onClick={()=>setSettings(true)} title="Settings">⚙️</button>
        </nav>
      </header>

      <main style={S.main}>

        {/* ══ TODAY'S UPLOADS ══════════════════════════════ */}
        {view==='today' && (
          <div>
            {/* Banner */}
            <div style={S.todayBanner}>
              <div>
                <div style={S.todayTag}>TODAY</div>
                <h2 style={S.todayTitle}>{fmtDate(today)}</h2>
                <p style={S.todaySub}>
                  {todayPosts.length===0
                    ? 'Nothing scheduled for today'
                    : `${todayPosts.length} upload${todayPosts.length!==1?'s':''} to go live today`}
                </p>
              </div>
              <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                {todayPosts.length>0 && <>
                  <button style={S.copyLinksBtn} onClick={()=>copyLinks(todayPosts)}>
                    {linksCopied ? '✅ Copied!' : '🔗 Copy All Links'}
                  </button>
                  <button style={S.copyAllBtn} onClick={()=>copyAll(todayPosts)}>
                    {allCopied ? '✅ Copied!' : '📋 Copy Full Schedule'}
                  </button>
                </>}
                <button style={S.primaryBtn} onClick={()=>openModal(today)}>+ Add Post</button>
              </div>
            </div>

            {/* Links quick-view strip */}
            {todayPosts.filter(p=>p.link).length>0 && (
              <div style={S.linksStrip}>
                <div style={S.linksStripLabel}>🔗 Today's links — click to open, or copy all above</div>
                <div style={S.linksStripList}>
                  {todayPosts.filter(p=>p.link).map(p=>(
                    <a key={p.id} href={p.link} target="_blank" rel="noreferrer" style={S.linkChip}>
                      <span style={{...S.linkChipDot,background:color(p.clients?.[0])}}/>
                      <span style={S.linkChipTitle}>{p.title}</span>
                      <span style={S.linkChipArrow}>↗</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Posts */}
            {todayPosts.length===0
              ? (
                <div style={S.empty}>
                  <div style={{fontSize:52,marginBottom:16}}>📭</div>
                  <p style={{color:'#555',fontSize:16,marginBottom:20}}>Nothing scheduled for today.</p>
                  <button style={S.primaryBtn} onClick={()=>openModal(today)}>+ Schedule a post</button>
                </div>
              )
              : (
                <div style={S.cardGrid}>
                  {todayPosts.map((post,i)=>(
                    <PostCard key={post.id} post={post} index={i}
                      color={color} onEdit={()=>openModal(today,post)}
                      onDelete={()=>delPost(post.id)}
                      onCopy={()=>{navigator.clipboard.writeText(post.caption||'');showToast('Caption copied!')}}
                      onCopyLink={()=>{navigator.clipboard.writeText(post.link||'');showToast('Link copied!')}}
                    />
                  ))}
                </div>
              )}
          </div>
        )}

        {/* ══ CALENDAR ══════════════════════════════════════ */}
        {view==='calendar' && (
          <div>
            <div style={S.calHeader}>
              <button style={S.arrow} onClick={prevM}>‹</button>
              <h2 style={S.monthTitle}>{MONTHS[month]} {year}</h2>
              <button style={S.arrow} onClick={nextM}>›</button>
            </div>
            <div style={S.calGrid}>
              {DAYS.map(d=><div key={d} style={S.dayLabel}>{d}</div>)}
              {cells.map((day,i)=>{
                if(!day) return <div key={`e${i}`} style={{minHeight:100}}/>
                const dk=toKey(year,month,day)
                const dp=forDate(dk)
                const isToday=dk===today
                return (
                  <div key={dk} style={{...S.cell,...(isToday?S.todayCell:{})}}
                    onClick={()=>{setSelDate(dk);setView('schedule')}}>
                    <span style={{...S.cellNum,...(isToday?{color:'#FFE66D',fontWeight:'bold'}:{})}}>{day}</span>
                    <div style={{display:'flex',flexWrap:'wrap',gap:3,marginTop:4}}>
                      {dp.slice(0,4).map((p,pi)=>(
                        <span key={pi} style={{width:7,height:7,borderRadius:'50%',background:color(p.clients?.[0]),display:'inline-block'}} title={p.title}/>
                      ))}
                      {dp.length>4&&<span style={{fontSize:9,color:'#555'}}>+{dp.length-4}</span>}
                    </div>
                    {dp.slice(0,2).map((p,pi)=>(
                      <div key={pi} style={{display:'flex',alignItems:'center',gap:4,marginTop:3}}>
                        <span style={{width:5,height:5,borderRadius:'50%',background:color(p.clients?.[0]),flexShrink:0}}/>
                        <span style={{fontSize:9,color:'#777',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.title}</span>
                      </div>
                    ))}
                    <button style={S.addBtn} onClick={e=>{e.stopPropagation();openModal(dk)}}>+</button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ══ DAY VIEW ══════════════════════════════════════ */}
        {view==='schedule' && (
          <div>
            <div style={S.dayHeader}>
              <div>
                <h2 style={S.dayTitle}>{fmtDate(selDate)}</h2>
                <p style={{color:'#666',fontSize:14,marginTop:4}}>{selPosts.length} post(s) scheduled</p>
              </div>
              <div style={{display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
                <input type="date" style={S.dateInput} value={selDate} onChange={e=>setSelDate(e.target.value)}/>
                {selPosts.length>0&&<>
                  <button style={S.copyLinksBtn} onClick={()=>copyLinks(selPosts)}>🔗 Copy Links</button>
                  <button style={S.copyAllBtn} onClick={()=>copyAll(selPosts)}>📋 Copy All</button>
                </>}
                <button style={S.primaryBtn} onClick={()=>openModal(selDate)}>+ Add Post</button>
              </div>
            </div>

            {selPosts.filter(p=>p.link).length>0&&(
              <div style={S.linksStrip}>
                <div style={S.linksStripLabel}>🔗 Links for this day</div>
                <div style={S.linksStripList}>
                  {selPosts.filter(p=>p.link).map(p=>(
                    <a key={p.id} href={p.link} target="_blank" rel="noreferrer" style={S.linkChip}>
                      <span style={{...S.linkChipDot,background:color(p.clients?.[0])}}/>
                      <span style={S.linkChipTitle}>{p.title}</span>
                      <span style={S.linkChipArrow}>↗</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {selPosts.length===0
              ?<div style={S.empty}><p style={{color:'#555'}}>No posts for this date.</p><button style={{...S.primaryBtn,marginTop:16}} onClick={()=>openModal(selDate)}>+ Add one</button></div>
              :<div style={S.postList}>{selPosts.map((post,i)=><PostCard key={post.id} post={post} index={i} color={color} onEdit={()=>openModal(selDate,post)} onDelete={()=>delPost(post.id)} onCopy={()=>{navigator.clipboard.writeText(post.caption||'');showToast('Caption copied!')}} onCopyLink={()=>{navigator.clipboard.writeText(post.link||'');showToast('Link copied!')}}/>)}</div>
            }
          </div>
        )}

        {/* ══ EMAIL AUTOMATION ══════════════════════════════ */}
        {view==='email' && (
          <div style={{maxWidth:780}}>
            <h2 style={{fontSize:26,color:'#FFE66D',margin:'0 0 8px',fontFamily:'Georgia,serif'}}>📧 Email Automation</h2>
            <p style={{color:'#888',fontSize:15,marginBottom:28,lineHeight:1.7}}>Every evening at <strong style={{color:'#e8e4dc'}}>6:00 PM</strong> your app automatically emails all staff with the next day's full upload schedule. No action needed.</p>

            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))',gap:18,marginBottom:18}}>

              {/* Status */}
              <div style={S.autoCard}>
                <div style={{fontSize:32,marginBottom:12}}>🤖</div>
                <h3 style={S.autoCardTitle}>Auto-Send Status</h3>
                <div style={{display:'inline-block',background:'#6BCB7722',color:'#6BCB77',border:'1px solid #6BCB7744',padding:'6px 16px',borderRadius:20,fontSize:13,fontWeight:'bold',marginBottom:12}}>
                  ● Active — emails at 6:00 PM daily
                </div>
                <p style={{color:'#666',fontSize:13,marginBottom:4}}>Sending to <strong style={{color:'#e8e4dc'}}>{staff.length}</strong> staff member{staff.length!==1?'s':''}.</p>
                <p style={{color:'#666',fontSize:13,marginBottom:16}}>Tomorrow: <strong style={{color:'#e8e4dc'}}>{tmPosts.length}</strong> post{tmPosts.length!==1?'s':''} scheduled ({tmKey})</p>
                <button style={{...S.primaryBtn,width:'100%',opacity:sending?.6:1,fontSize:14,padding:'12px'}}
                  onClick={sendNow} disabled={sending}>
                  {sending?'⏳ Sending…':'📤 Send Tomorrow\'s Email Now'}
                </button>
              </div>

              {/* Preview */}
              <div style={S.autoCard}>
                <div style={{fontSize:32,marginBottom:12}}>👁️</div>
                <h3 style={S.autoCardTitle}>Tomorrow's Email Preview</h3>
                {tmPosts.length===0
                  ?<p style={{color:'#555',fontSize:13}}>No posts scheduled for tomorrow yet. Add some on the calendar!</p>
                  :<div style={{background:'#0d1a0e',border:'1px solid #1a3a1e',borderRadius:8,padding:14}}>
                    <p style={{fontSize:11,letterSpacing:2,color:'#6BCB77',marginBottom:8,textTransform:'uppercase',fontFamily:'monospace'}}>Email Preview</p>
                    <p style={{fontWeight:'bold',color:'#a0c9a3',fontSize:13,marginBottom:6}}>📅 {fmtDate(tmKey)}</p>
                    <p style={{color:'#6BCB77',fontSize:12,marginBottom:10}}>{tmPosts.length} upload{tmPosts.length!==1?'s':''} scheduled for tomorrow</p>
                    {tmPosts.map((p,i)=>(
                      <div key={p.id} style={{borderTop:'1px solid #1a3a1e',paddingTop:8,marginTop:8}}>
                        <p style={{fontWeight:'bold',color:'#c0d9c3',fontSize:12}}>{i+1}. {p.title}</p>
                        {p.clients?.length>0&&<p style={{color:'#7a9a7e',fontSize:11}}>Clients: {p.clients.join(', ')}</p>}
                        {p.link&&<p style={{color:'#4ECDC4',fontSize:11,wordBreak:'break-all'}}>🔗 {p.link}</p>}
                        {p.caption&&<p style={{color:'#7a9a7e',fontSize:11}}>💬 {p.caption}</p>}
                      </div>
                    ))}
                  </div>
                }
              </div>
            </div>

            {/* Staff list */}
            <div style={S.autoCard}>
              <h3 style={{...S.autoCardTitle,marginBottom:14}}>👥 Staff Receiving Emails</h3>
              {staff.length===0
                ?<p style={{color:'#555',fontSize:13}}>No staff added yet. Click ⚙️ Settings to add team members.</p>
                :staff.map(s=>(
                  <div key={s.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid #1e1e1e'}}>
                    <div style={{width:36,height:36,borderRadius:'50%',background:'#FFE66D22',color:'#FFE66D',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'bold',fontSize:15,flexShrink:0}}>{s.name[0].toUpperCase()}</div>
                    <div style={{flex:1}}>
                      <div style={{color:'#e8e4dc',fontSize:14,fontWeight:'bold'}}>{s.name}</div>
                      <div style={{color:'#666',fontSize:12,fontFamily:'monospace'}}>{s.email}</div>
                    </div>
                    <button style={{background:'none',border:'none',cursor:'pointer',fontSize:15}} onClick={()=>delStaff(s.id)}>🗑️</button>
                  </div>
                ))
              }
              <button style={{...S.ghostBtn,marginTop:14}} onClick={()=>setSettings(true)}>+ Manage Staff</button>
            </div>
          </div>
        )}
      </main>

      {/* ══ POST MODAL ═══════════════════════════════════════ */}
      {modal&&(
        <div style={S.overlay} onClick={()=>setModal(false)}>
          <div style={S.modal} onClick={e=>e.stopPropagation()}>
            <div style={S.modalHeader}>
              <h3 style={{margin:0,fontSize:18,color:'#FFE66D',fontFamily:'Georgia,serif'}}>{editPost?'Edit Post':'Add Post'}</h3>
              <span style={{fontSize:12,color:'#555',fontFamily:'monospace'}}>{selDate} · {fmtShort(selDate)}</span>
            </div>
            <div style={S.fg}>
              <label style={S.lbl}>Title <span style={{color:'#FF6B6B'}}>*</span></label>
              <input style={S.inp} placeholder="Post title…" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>
            </div>
            <div style={S.fg}>
              <label style={S.lbl}>Link <span style={{color:'#555',fontSize:11}}>(optional — leave blank if no link)</span></label>
              <input style={S.inp} placeholder="https://…" value={form.link} onChange={e=>setForm(f=>({...f,link:e.target.value}))}/>
            </div>
            <div style={S.fg}>
              <label style={S.lbl}>Caption Suggestion <span style={{color:'#555',fontSize:11}}>(optional)</span></label>
              <textarea style={S.ta} rows={4} placeholder="Write caption here…" value={form.caption} onChange={e=>setForm(f=>({...f,caption:e.target.value}))}/>
            </div>
            <div style={S.fg}>
              <label style={S.lbl}>Client Tags</label>
              <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                {clients.map(c=>(
                  <button key={c.id} style={{padding:'5px 14px',borderRadius:20,border:`1.5px solid ${c.color}`,cursor:'pointer',fontSize:12,fontWeight:'bold',
                    background:form.clients.includes(c.name)?c.color:'transparent',
                    color:form.clients.includes(c.name)?'#111':'#ccc',
                  }} onClick={()=>toggleCl(c.name)}>{c.name}</button>
                ))}
                {clients.length===0&&<p style={{color:'#555',fontSize:12}}>No clients yet — add in ⚙️ Settings</p>}
              </div>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:10,paddingTop:6}}>
              <button style={S.ghostBtn} onClick={()=>setModal(false)}>Cancel</button>
              <button style={S.primaryBtn} onClick={savePost}>{editPost?'Save Changes':'Add Post'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ SETTINGS MODAL ═══════════════════════════════════ */}
      {settings&&(
        <div style={S.overlay} onClick={()=>setSettings(false)}>
          <div style={{...S.modal,maxWidth:580}} onClick={e=>e.stopPropagation()}>
            <div style={S.modalHeader}>
              <h3 style={{margin:0,fontSize:18,color:'#FFE66D',fontFamily:'Georgia,serif'}}>⚙️ Settings</h3>
              <button style={{background:'none',border:'none',color:'#666',fontSize:18,cursor:'pointer'}} onClick={()=>setSettings(false)}>✕</button>
            </div>

            {/* Staff */}
            <div style={{borderBottom:'1px solid #1e1e1e',paddingBottom:20,marginBottom:20}}>
              <h4 style={{fontSize:14,color:'#FFE66D',marginBottom:12}}>👥 Staff Members</h4>
              {staff.map(s=>(
                <div key={s.id} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'1px solid #111'}}>
                  <div style={{width:32,height:32,borderRadius:'50%',background:'#FFE66D22',color:'#FFE66D',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'bold',fontSize:13,flexShrink:0}}>{s.name[0].toUpperCase()}</div>
                  <div style={{flex:1}}>
                    <div style={{color:'#e8e4dc',fontSize:13,fontWeight:'bold'}}>{s.name}</div>
                    <div style={{color:'#666',fontSize:11,fontFamily:'monospace'}}>{s.email}</div>
                  </div>
                  <button style={{background:'none',border:'none',cursor:'pointer',fontSize:14}} onClick={()=>delStaff(s.id)}>🗑️</button>
                </div>
              ))}
              <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap'}}>
                <input style={{...S.inp,flex:1,minWidth:120}} placeholder="Name" value={staffForm.name} onChange={e=>setStaffForm(f=>({...f,name:e.target.value}))}/>
                <input style={{...S.inp,flex:2,minWidth:180}} placeholder="email@example.com" type="email" value={staffForm.email} onChange={e=>setStaffForm(f=>({...f,email:e.target.value}))}/>
                <button style={S.primaryBtn} onClick={addStaff}>Add</button>
              </div>
            </div>

            {/* Clients */}
            <div>
              <h4 style={{fontSize:14,color:'#FFE66D',marginBottom:12}}>🏷️ Clients</h4>
              {clients.map(c=>(
                <div key={c.id} style={{display:'flex',alignItems:'center',gap:10,padding:'7px 0',borderBottom:'1px solid #111'}}>
                  <span style={{width:14,height:14,borderRadius:'50%',background:c.color,flexShrink:0}}/>
                  <span style={{flex:1,color:'#e8e4dc',fontSize:13}}>{c.name}</span>
                  <button style={{background:'none',border:'none',cursor:'pointer',fontSize:14}} onClick={()=>delClient(c.id)}>🗑️</button>
                </div>
              ))}
              <div style={{display:'flex',gap:8,marginTop:12,flexWrap:'wrap',alignItems:'center'}}>
                <input style={{...S.inp,flex:1}} placeholder="Client name" value={clientForm.name} onChange={e=>setClientForm(f=>({...f,name:e.target.value}))}/>
                <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                  {COLORS.map(col=>(
                    <button key={col} onClick={()=>setClientForm(f=>({...f,color:col}))}
                      style={{width:22,height:22,borderRadius:'50%',background:col,border:'none',cursor:'pointer',outline:clientForm.color===col?'2px solid #fff':'none',outlineOffset:2}}/>
                  ))}
                </div>
                <button style={S.primaryBtn} onClick={addClient}>Add</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PostCard({ post, index, color, onEdit, onDelete, onCopy, onCopyLink }) {
  const c = color(post.clients?.[0])
  return (
    <div style={{background:'#16161a',border:'1px solid #1e1e1e',borderRadius:12,padding:18,display:'flex',flexDirection:'column',gap:10,borderTop:`3px solid ${c}`}}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <span style={{fontSize:22,fontWeight:'bold',color:c,lineHeight:1,fontFamily:'Georgia,serif'}}>{String(index+1).padStart(2,'0')}</span>
        <h3 style={{flex:1,margin:0,fontSize:16,color:'#e8e4dc'}}>{post.title}</h3>
        <button style={{background:'none',border:'none',cursor:'pointer',fontSize:14}} onClick={onEdit}>✏️</button>
        <button style={{background:'none',border:'none',cursor:'pointer',fontSize:14}} onClick={onDelete}>🗑️</button>
      </div>

      {post.clients?.length>0&&(
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {post.clients.map(cl=><span key={cl} style={{padding:'2px 10px',borderRadius:20,fontSize:11,fontWeight:'bold',color:'#111',background:color(cl)}}>{cl}</span>)}
        </div>
      )}

      {post.link
        ? <div style={{background:'#0d1a0d',border:'1px solid #1a3a1e',borderRadius:8,padding:'10px 14px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8}}>
              <div style={{flex:1}}>
                <span style={{fontSize:10,letterSpacing:1.5,color:'#6BCB77',textTransform:'uppercase',display:'block',marginBottom:4}}>🔗 Link</span>
                <a href={post.link} target="_blank" rel="noreferrer" style={{color:'#4ECDC4',fontSize:13,wordBreak:'break-all',textDecoration:'none'}}>{post.link}</a>
              </div>
              <button onClick={onCopyLink} style={{background:'#1a3a1e',border:'1px solid #2a5a2e',color:'#6BCB77',padding:'4px 10px',borderRadius:5,fontSize:11,cursor:'pointer',flexShrink:0,fontWeight:'bold'}}>Copy</button>
            </div>
          </div>
        : <div style={{background:'#111',border:'1px solid #1e1e1e',borderRadius:8,padding:'10px 14px',fontSize:12,color:'#555',fontStyle:'italic'}}>No link — upload original content</div>
      }

      {post.caption&&(
        <div style={{background:'#111',borderRadius:8,padding:12,position:'relative'}}>
          <span style={{fontSize:10,letterSpacing:1.5,color:'#555',textTransform:'uppercase',display:'block',marginBottom:4}}>💬 Caption Suggestion</span>
          <p style={{margin:0,color:'#aaa',fontSize:13,lineHeight:1.6,paddingRight:54}}>{post.caption}</p>
          <button onClick={onCopy} style={{position:'absolute',top:12,right:12,background:'#222',border:'1px solid #333',color:'#FFE66D',padding:'3px 8px',borderRadius:4,fontSize:11,cursor:'pointer'}}>Copy</button>
        </div>
      )}
    </div>
  )
}

const S = {
  root:{ minHeight:'100vh', background:'#0d0d0f', color:'#e8e4dc', fontFamily:'Georgia,serif' },
  toast:{ position:'fixed', bottom:28, left:'50%', transform:'translateX(-50%)', background:'#25D366', color:'#000', padding:'10px 24px', borderRadius:30, fontWeight:'bold', fontSize:14, zIndex:9999, boxShadow:'0 4px 20px rgba(0,0,0,0.4)', whiteSpace:'nowrap' },
  header:{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 28px', borderBottom:'1px solid #1a1a1a', background:'#111113', position:'sticky', top:0, zIndex:100, flexWrap:'wrap', gap:10 },
  logo:{ display:'flex', alignItems:'center', gap:10 },
  logoText:{ fontSize:17, fontWeight:'bold', letterSpacing:4, color:'#e8e4dc' },
  nav:{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' },
  navBtn:{ padding:'7px 15px', borderRadius:6, border:'1px solid #2a2a2a', background:'transparent', color:'#777', cursor:'pointer', fontSize:13, display:'flex', alignItems:'center', gap:6 },
  navActive:{ background:'#FFE66D', color:'#111', border:'1px solid #FFE66D', fontWeight:'bold' },
  settingsBtn:{ padding:'7px 11px', borderRadius:6, border:'1px solid #2a2a2a', background:'transparent', color:'#777', cursor:'pointer', fontSize:16 },
  badge:{ background:'#FF6B6B', color:'#fff', borderRadius:20, fontSize:11, fontWeight:'bold', padding:'1px 7px' },
  main:{ maxWidth:1100, margin:'0 auto', padding:'28px 20px' },

  // Today
  todayBanner:{ background:'linear-gradient(120deg,#1c1c10,#16161a)', border:'1px solid #FFE66D22', borderRadius:14, padding:'26px 30px', marginBottom:20, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:14 },
  todayTag:{ fontSize:10, letterSpacing:4, color:'#FFE66D', fontFamily:'monospace', marginBottom:6 },
  todayTitle:{ fontSize:24, margin:0, color:'#e8e4dc', fontWeight:'bold' },
  todaySub:{ margin:'5px 0 0', color:'#666', fontSize:14 },
  copyLinksBtn:{ background:'#0d2a1a', border:'1px solid #2a6a3a', color:'#6BCB77', padding:'8px 16px', borderRadius:7, fontSize:13, fontWeight:'bold', cursor:'pointer' },
  copyAllBtn:{ background:'#1a1a2a', border:'1px solid #3a3a6a', color:'#A78BFA', padding:'8px 16px', borderRadius:7, fontSize:13, fontWeight:'bold', cursor:'pointer' },

  // Links strip
  linksStrip:{ background:'#111', border:'1px solid #1e1e1e', borderRadius:10, padding:'14px 18px', marginBottom:20 },
  linksStripLabel:{ fontSize:11, letterSpacing:1.5, color:'#555', textTransform:'uppercase', fontFamily:'monospace', marginBottom:10 },
  linksStripList:{ display:'flex', flexWrap:'wrap', gap:8 },
  linkChip:{ display:'flex', alignItems:'center', gap:7, background:'#1a1a1a', border:'1px solid #2a2a2a', borderRadius:20, padding:'5px 12px', textDecoration:'none', cursor:'pointer', transition:'border-color 0.15s' },
  linkChipDot:{ width:8, height:8, borderRadius:'50%', flexShrink:0 },
  linkChipTitle:{ color:'#ccc', fontSize:12 },
  linkChipArrow:{ color:'#555', fontSize:12 },

  // Calendar
  calHeader:{ display:'flex', alignItems:'center', justifyContent:'center', gap:24, marginBottom:20 },
  monthTitle:{ fontSize:24, fontWeight:'bold', letterSpacing:2, color:'#FFE66D', minWidth:220, textAlign:'center', margin:0 },
  arrow:{ background:'none', border:'1px solid #333', color:'#FFE66D', fontSize:24, width:38, height:38, borderRadius:6, cursor:'pointer' },
  calGrid:{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:3 },
  dayLabel:{ textAlign:'center', padding:'8px 0', fontSize:11, letterSpacing:2, color:'#444', fontFamily:'monospace', textTransform:'uppercase' },
  cell:{ background:'#16161a', border:'1px solid #1e1e1e', borderRadius:7, minHeight:100, padding:7, cursor:'pointer', position:'relative' },
  todayCell:{ border:'1.5px solid #FFE66D', background:'#1b1b0f' },
  cellNum:{ fontSize:12, color:'#555', fontFamily:'monospace' },
  addBtn:{ position:'absolute', bottom:5, right:5, width:20, height:20, borderRadius:'50%', background:'#222', border:'1px solid #333', color:'#FFE66D', fontSize:14, cursor:'pointer', padding:0, lineHeight:1, display:'flex', alignItems:'center', justifyContent:'center' },

  // Day view
  dayHeader:{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20, flexWrap:'wrap', gap:12 },
  dayTitle:{ fontSize:24, color:'#FFE66D', margin:0 },
  dateInput:{ background:'#1a1a1e', border:'1px solid #2a2a2a', color:'#e8e4dc', padding:'8px 12px', borderRadius:6, fontSize:14, fontFamily:'monospace' },

  // Cards
  cardGrid:{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16 },
  postList:{ display:'flex', flexDirection:'column', gap:14 },

  // Automation
  autoCard:{ background:'#16161a', border:'1px solid #1e1e1e', borderRadius:14, padding:22 },
  autoCardTitle:{ fontSize:16, color:'#e8e4dc', margin:'0 0 10px', fontWeight:'bold' },

  // Empty
  empty:{ textAlign:'center', padding:'60px 20px', border:'1px dashed #1e1e1e', borderRadius:12, display:'flex', flexDirection:'column', alignItems:'center' },

  // Modal
  overlay:{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 },
  modal:{ background:'#16161a', border:'1px solid #222', borderRadius:16, padding:26, width:'100%', maxWidth:500, maxHeight:'90vh', overflowY:'auto', display:'flex', flexDirection:'column', gap:16 },
  modalHeader:{ display:'flex', justifyContent:'space-between', alignItems:'baseline', borderBottom:'1px solid #1e1e1e', paddingBottom:14 },
  fg:{ display:'flex', flexDirection:'column', gap:6 },
  lbl:{ fontSize:13, color:'#aaa' },
  inp:{ background:'#111', border:'1px solid #222', color:'#e8e4dc', padding:'9px 13px', borderRadius:7, fontSize:14, outline:'none', fontFamily:'Georgia,serif' },
  ta:{ background:'#111', border:'1px solid #222', color:'#e8e4dc', padding:'9px 13px', borderRadius:7, fontSize:14, outline:'none', resize:'vertical', fontFamily:'Georgia,serif' },
  primaryBtn:{ background:'#FFE66D', color:'#111', border:'none', padding:'9px 20px', borderRadius:7, fontSize:13, fontWeight:'bold', cursor:'pointer' },
  ghostBtn:{ background:'transparent', color:'#aaa', border:'1px solid #2a2a2a', padding:'9px 16px', borderRadius:7, fontSize:13, cursor:'pointer' },
}

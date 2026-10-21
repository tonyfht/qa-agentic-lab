// "Agentes de QA en este flujo" (QA-039): the flow line with its stops, one lane per agent and a card for the chosen
// one. Plain SVG and JS from window.QAL_REPORT.agentsFlow: no network, works from disk, local server or GitHub Pages.
;(function () {
  const data = window.QAL_REPORT
  const $ = (id) => document.getElementById(id)
  const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
  const NS = 'http://www.w3.org/2000/svg'
  const REPO = 'https://github.com/tonyfht/qa-agentic-lab/blob/main/'
  const FAMILY = {
    diseno: 'Requisitos y diseño',
    automatizacion: 'Automatización',
    auditoria: 'Auditoría',
    operacion: 'Operación',
    salida: 'Salida',
  }
  const STATUS = { passed: ['✔', 'superada'], failed: ['✖', 'fallida'], skipped: ['○', 'omitida'], not_run: ['○', 'no ejecutada'] }
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

  if (!data || !data.agentsFlow) {
    document.querySelector('.wrap').innerHTML = '<p class="empty">No hay datos: ejecuta <code>npm run qa</code> primero.</p>'
    return
  }
  const { stops, agents } = data.agentsFlow
  const stopIndex = Object.fromEntries(stops.map((s, i) => [s.id, i]))
  const color = (a) => `var(--fam-${a.family})`
  const actionsText = (n) => `${n} ${n === 1 ? 'actuación' : 'actuaciones'}`
  let selected = null

  $('run-meta').innerHTML =
    `<a href="index.html">← Volver al informe</a> · ejecución <b>${esc(data.run.label)}</b> · ${esc(data.run.origin)}<br>` +
    '<button class="toggle" id="theme" type="button">Cambiar tema</button>'
  $('footer').textContent = `Datos del registro de agentes y de la ejecución ${data.run.label} · QA Agentic Lab`

  // Chips: "Todos" plus one per agent, buttons with aria-pressed.
  $('chips').innerHTML =
    `<button type="button" class="chip" data-agent="">Todos</button>` +
    agents
      .map((a, i) => `<button type="button" class="chip" data-agent="${a.id}"><span class="dot" style="background:${color(a)}"></span><span class="num">${i + 1}</span>${esc(a.name)}</button>`)
      .join('')
  $('chips').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-agent]')
    if (b) select(b.dataset.agent || null)
  })

  $('legend').innerHTML = Object.entries(FAMILY)
    .map(([k, label]) => `<li><span class="dot" style="background:var(--fam-${k})"></span>${label}</li>`)
    .join('')

  // Grid of agent presentations.
  $('agent-grid').innerHTML = agents
    .map(
      (a, i) =>
        `<li class="agent-item" style="--c:${color(a)}"><button type="button" class="agent-head" data-agent="${a.id}">` +
        `<span class="num">${i + 1}</span><span><b>${esc(a.name)}</b><span class="fam">${FAMILY[a.family]}</span></span></button>` +
        `<p>${esc(a.summary)}</p>` +
        `<p class="where">Interviene en: ${a.stops.map((s) => esc(stops[stopIndex[s]].name)).join(' · ')}</p>` +
        `<p class="links"><a href="${REPO}${esc(a.definition)}">Definición</a> · <a href="${REPO}${esc(a.sample)}">Muestra de su trabajo</a> · ${actionsText(a.actions)}</p></li>`,
    )
    .join('')
  $('agent-grid').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-agent]')
    if (b) {
      select(b.dataset.agent)
      $('flow').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' })
    }
  })

  // Accessible alternative: agent × stop.
  $('flow-table').innerHTML =
    `<table><thead><tr><th>Agente</th>${stops.map((s) => `<th>${esc(s.name)}</th>`).join('')}</tr></thead><tbody>` +
    agents
      .map((a) => `<tr><td>${esc(a.name)}</td>${stops.map((s) => `<td>${a.stops.includes(s.id) ? '●<span class="sr-only"> interviene</span>' : ''}</td>`).join('')}</tr>`)
      .join('') +
    '</tbody></table>'

  // SVG: horizontal from 760 px wide, vertical below.
  const svg = $('flow')
  const el = (tag, attrs, parent = svg) => {
    const e = document.createElementNS(NS, tag)
    for (const k in attrs) e.setAttribute(k, attrs[k])
    parent.appendChild(e)
    return e
  }
  let lanes = []
  let stopNodes = []

  function draw() {
    for (const n of [...svg.childNodes]) if (n.nodeName !== 'title' && n.nodeName !== 'desc') n.remove()
    const wide = svg.parentElement.clientWidth >= 760
    lanes = []
    stopNodes = []
    const statusClass = (s) => (s.status ? `st-${s.status}` : s.inPipeline ? 'st-none' : 'st-phase')

    if (wide) {
      const W = 1000
      const X0 = 230
      const dx = (W - 60 - X0) / (stops.length - 1)
      const x = (i) => X0 + i * dx
      const Y = 64
      const LY = 170
      const LH = 40
      svg.setAttribute('viewBox', `0 0 ${W} ${LY + agents.length * LH}`)
      const first = stops.findIndex((s) => s.inPipeline)
      const last = stops.length - 1 - [...stops].reverse().findIndex((s) => s.inPipeline)
      el('rect', { x: x(first) - 34, y: 8, width: x(last) - x(first) + 68, height: 124, rx: 12, class: 'pipeline-frame' })
      el('text', { x: (x(first) + x(last)) / 2, y: 26, 'text-anchor': 'middle', class: 'frame-label' }).textContent = 'Pipeline en GitHub Actions'
      el('line', { x1: x(0), y1: Y, x2: x(stops.length - 1), y2: Y, class: 'flow-line' })
      stops.forEach((s, i) => {
        const g = el('g', { class: `stop ${statusClass(s)}`, 'data-stop': s.id })
        el('circle', { cx: x(i), cy: Y, r: 15 }, g)
        el('text', { x: x(i), y: Y + 4, 'text-anchor': 'middle', class: 'stop-short' }, g).textContent = s.short
        // Staggered labels so neighbouring names never overlap.
        const label = el('text', { x: x(i), y: Y + (i % 2 ? 50 : 34), 'text-anchor': 'middle', class: 'stop-name' }, g)
        label.textContent = s.name + (s.status ? ` ${STATUS[s.status][0]}` : '')
        stopNodes.push(g)
      })
      agents.forEach((a, k) => {
        const y = LY + k * LH
        const g = el('g', { class: 'lane', tabindex: 0, role: 'button', 'aria-label': `${k + 1}. ${a.name}: ver su flujo`, 'data-agent': a.id, style: `--c:${color(a)}` })
        el('rect', { x: 0, y: y - LH / 2, width: W, height: LH, class: 'lane-hit' }, g)
        el('line', { x1: X0 - 20, y1: y, x2: W - 10, y2: y, class: 'lane-track' }, g)
        el('text', { x: 8, y: y + 4, class: 'lane-label' }, g).textContent = `${k + 1}. ${a.name}`
        const pts = a.stops.map((s) => stopIndex[s]).sort((p, q) => p - q)
        for (const p of pts) el('line', { x1: x(p), y1: Y + (p % 2 ? 58 : 42), x2: x(p), y2: y - 8, class: 'drop' }, g)
        el('path', { d: pts.map((p, n) => `${n ? 'L' : 'M'}${x(p)} ${y}`).join(' ') + (pts.length === 1 ? ` L${x(pts[0]) + 0.1} ${y}` : ''), class: 'trail' }, g)
        for (const p of pts) el('circle', { cx: x(p), cy: y, r: 8, class: 'lane-dot' }, g)
        lanes.push(g)
      })
    } else {
      const W = 360
      const XL = 112
      const Y0 = 70
      const dy = 52
      const y = (i) => Y0 + i * dy
      const cx = (k) => 146 + k * ((W - 156) / (agents.length - 1))
      svg.setAttribute('viewBox', `0 0 ${W} ${Y0 + (stops.length - 1) * dy + 30}`)
      el('line', { x1: XL, y1: y(0), x2: XL, y2: y(stops.length - 1), class: 'flow-line' })
      stops.forEach((s, i) => {
        const g = el('g', { class: `stop ${statusClass(s)}`, 'data-stop': s.id })
        el('circle', { cx: XL, cy: y(i), r: 13 }, g)
        el('text', { x: XL, y: y(i) + 4, 'text-anchor': 'middle', class: 'stop-short' }, g).textContent = s.short
        el('text', { x: XL - 20, y: y(i) + 4, 'text-anchor': 'end', class: 'stop-name' }, g).textContent = s.name + (s.status ? ` ${STATUS[s.status][0]}` : '')
        stopNodes.push(g)
      })
      agents.forEach((a, k) => {
        const g = el('g', { class: 'lane', tabindex: 0, role: 'button', 'aria-label': `${k + 1}. ${a.name}: ver su flujo`, 'data-agent': a.id, style: `--c:${color(a)}` })
        el('rect', { x: cx(k) - 8, y: 0, width: 16, height: y(stops.length - 1) + 30, class: 'lane-hit' }, g)
        el('text', { x: cx(k), y: 30, 'text-anchor': 'middle', class: 'lane-num' }, g).textContent = String(k + 1)
        el('line', { x1: cx(k), y1: 42, x2: cx(k), y2: y(stops.length - 1) + 14, class: 'lane-track' }, g)
        const pts = a.stops.map((s) => stopIndex[s]).sort((p, q) => p - q)
        for (const p of pts) el('line', { x1: XL + 16, y1: y(p), x2: cx(k) - 7, y2: y(p), class: 'drop' }, g)
        el('path', { d: pts.map((p, n) => `${n ? 'L' : 'M'}${cx(k)} ${y(p)}`).join(' ') + (pts.length === 1 ? ` L${cx(k)} ${y(pts[0]) + 0.1}` : ''), class: 'trail' }, g)
        for (const p of pts) el('circle', { cx: cx(k), cy: y(p), r: 6, class: 'lane-dot' }, g)
        lanes.push(g)
      })
    }
    for (const g of lanes) {
      g.addEventListener('click', () => select(g.dataset.agent === selected ? null : g.dataset.agent))
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          select(g.dataset.agent === selected ? null : g.dataset.agent)
        }
      })
    }
    paint(false)
  }

  // Highlight the chosen agent: its lane and stops in its colour, the rest dimmed; the trail draws itself.
  function paint(animate) {
    const agent = agents.find((a) => a.id === selected) ?? null
    svg.classList.toggle('has-selection', Boolean(agent))
    for (const g of lanes) {
      const on = agent && g.dataset.agent === agent.id
      g.classList.toggle('on', Boolean(on))
      g.setAttribute('aria-pressed', on ? 'true' : 'false')
      const trail = g.querySelector('.trail')
      if (on && animate && !reduceMotion) {
        const len = trail.getTotalLength() || 1
        trail.style.transition = 'none'
        trail.style.strokeDasharray = `${len}`
        trail.style.strokeDashoffset = `${len}`
        trail.getBoundingClientRect()
        trail.style.transition = 'stroke-dashoffset .7s ease'
        trail.style.strokeDashoffset = '0'
      } else {
        trail.style.strokeDasharray = ''
        trail.style.strokeDashoffset = ''
      }
    }
    for (const g of stopNodes) {
      const mine = agent && agent.stops.includes(g.dataset.stop)
      g.classList.toggle('mine', Boolean(mine))
      g.style.setProperty('--c', agent ? color(agent) : '')
    }
    for (const b of document.querySelectorAll('#chips button')) {
      const on = (b.dataset.agent || null) === selected
      b.setAttribute('aria-pressed', on ? 'true' : 'false')
      b.style.setProperty('--c', on && agent ? color(agent) : '')
    }
    $('agent-card').innerHTML = agent ? card(agent) : intro()
    $('agent-card').style.borderLeftColor = agent ? color(agent) : ''
  }

  function intro() {
    const failed = stops.filter((s) => s.status === 'failed').map((s) => s.name)
    return (
      '<p class="card-title">Elige un agente</p>' +
      '<p>Cada calle es un agente y cada punto, una parada en la que interviene. Los colores agrupan a los agentes por familia.</p>' +
      `<p class="where">${failed.length ? `En esta ejecución ha fallado: ${failed.map(esc).join(', ')}.` : 'En esta ejecución, todas las etapas que se ejecutaron pasaron.'}</p>`
    )
  }

  function card(a) {
    const latest = a.latest
    return (
      `<p class="card-title" style="color:${color(a)}">${esc(a.name)}</p>` +
      `<p class="fam">${FAMILY[a.family]}</p>` +
      `<p>${esc(a.summary)}</p>` +
      `<dl class="facts"><dt>Interviene en</dt><dd>${a.stops.map((s) => esc(stops[stopIndex[s]].name)).join(' · ')}</dd>` +
      `<dt>No puede</dt><dd>${esc(a.forbidden)}</dd>` +
      `<dt>Actuaciones registradas</dt><dd>${actionsText(a.actions)}${latest ? ` · la última, ${esc(new Date(latest.date).toLocaleDateString('es-ES'))} (${esc(latest.change)}): ${esc(latest.summary)}` : ''}</dd></dl>` +
      `<p class="links"><a href="${REPO}${esc(a.definition)}">Su definición</a> · <a href="${REPO}${esc(a.sample)}">Una muestra de su trabajo</a></p>`
    )
  }

  function select(id, fromHash = false) {
    selected = id && agents.some((a) => a.id === id) ? id : null
    if (!fromHash) history.replaceState(null, '', selected ? `#agente=${selected}` : location.pathname + location.search)
    paint(true)
  }

  document.addEventListener('keydown', (e) => e.key === 'Escape' && selected && select(null))
  $('theme').addEventListener('click', () => {
    const root = document.documentElement
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches
    root.dataset.theme = dark ? 'light' : 'dark'
  })
  let resizeTimer
  let lastWide = null
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      const wide = svg.parentElement.clientWidth >= 760
      if (wide !== lastWide) {
        lastWide = wide
        draw()
      }
    }, 150)
  })

  lastWide = svg.parentElement.clientWidth >= 760
  draw()
  const fromHash = /agente=([\w-]+)/.exec(location.hash)?.[1]
  if (fromHash) select(fromHash, true)
})()

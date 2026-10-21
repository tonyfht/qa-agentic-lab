/* global echarts */
// Renders the quality report from window.QAL_REPORT (written by report/build.ts). No network, no server:
// the page works the same opened from disk, from `npm run report` or from GitHub Pages.
;(function () {
  const data = window.QAL_REPORT
  const $ = (id) => document.getElementById(id)
  const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim()

  const LABEL = {
    passed: '✔ Superado',
    failed: '✖ Fallido',
    flaky: '⚠ Inestable',
    skipped: '○ Omitido',
    untested: '○ Sin pruebas',
    not_run: '⛔ No ejecutada',
  }
  const STAGE_LABEL = { passed: '✔', failed: '✖', skipped: '○ Omitida', not_run: '⛔ No ejecutada' }
  const badge = (status, text) => `<span class="badge ${status}">${esc(text ?? LABEL[status])}</span>`
  const seconds = (ms) => (ms < 1000 ? `${ms} ms` : ms < 60000 ? `${Math.round(ms / 1000)} s` : `${Math.floor(ms / 60000)} min ${Math.round((ms % 60000) / 1000)} s`)
  const table = (head, rows) =>
    `<table><thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows
      .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`)
      .join('')}</tbody></table>`

  if (!data) {
    document.querySelector('.wrap').innerHTML = '<p class="empty">No hay datos: ejecuta <code>npm run qa</code> primero.</p>'
    return
  }

  // Header and status
  const run = data.run
  const when = new Date(run.finishedAt).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })
  $('run-meta').innerHTML =
    `Ejecución <b>${esc(run.label)}</b> · rama <code>${esc(run.branch)}</code> · commit <code>${esc(run.sha)}</code><br>` +
    `${run.workflowRunUrl ? `<a href="${esc(run.workflowRunUrl)}">${esc(run.origin)}</a>` : esc(run.origin)} · ${esc(when)} · ` +
    '<button class="toggle" id="theme" type="button">Cambiar tema</button>' +
    '<a class="toggle flow-link" href="agentes.html" target="_blank" rel="noopener" data-testid="agents-flow-link">Agentes de QA en este flujo ↗</a>'

  // Executive summary: release recommendation, comparison and the Reportero's reading (QA-036, QA-037)
  const exec = data.executive
  const VERDICT = { si: ['passed', '✔'], reservas: ['flaky', '⚠'], no: ['failed', '✖'] }
  const REASON_ICON = { blocker: '✖', reservation: '⚠', ok: '✔' }
  const [vClass, vIcon] = VERDICT[exec.verdict.verdict]
  $('verdict').innerHTML = badge(vClass, `${vIcon} ${exec.verdict.title}`)
  $('verdict-reasons').innerHTML = exec.verdict.reasons
    .map((r) => `<li class="${r.kind}"><span class="k" aria-hidden="true">${REASON_ICON[r.kind]}</span><span>${esc(r.text)}</span></li>`)
    .join('')
  $('exec-compare').innerHTML = table(
    ['', 'Ahora', 'Antes'],
    exec.compare.map((c) => [
      esc(c.label),
      `<b>${esc(c.current)}</b>${c.better === null ? '' : ` <span class="delta ${c.better ? 'better' : 'worse'}">${c.better ? '▲ mejor' : '▼ peor'}</span>`}`,
      esc(c.previous ?? '—'),
    ]),
  )
  const repo = 'https://github.com/tonyfht/qa-agentic-lab/blob/main/'
  $('exec-reporter').innerHTML = exec.reporter
    ? `<p>${esc(exec.reporter.summary)}</p><p class="nodetail">${esc(new Date(exec.reporter.date).toLocaleDateString('es-ES'))} · ${esc(exec.reporter.change)} · ${exec.reporter.artifacts
        .map((p) => `<a href="${repo}${esc(p)}">${esc(p)}</a>`)
        .join(' · ')}</p>`
    : '<p class="nodetail" data-testid="reporter-none">El Reportero todavía no ha escrito ninguna lectura.</p>'

  $('kpis').innerHTML = data.kpis
    .map(
      (k) =>
        `<div class="tile"><div class="label">${esc(k.label)}</div><div class="value">${esc(k.value)}</div>` +
        `<div class="delta ${k.trend ?? ''}">${esc(k.delta ?? 'Primera ejecución: sin comparación todavía')}</div></div>`,
    )
    .join('')

  $('pipeline').innerHTML = data.stages
    .map(
      (s, i) =>
        `<li class="stage ${s.status}"><div class="name">${i + 1} · ${esc(s.name)}</div>` +
        `<div class="dur">${esc(STAGE_LABEL[s.status])} ${s.status === 'passed' || s.status === 'failed' ? seconds(s.durationMs) : ''}${
          s.reason ? ` · ${esc(s.reason.split('\n')[0])}` : ''
        }</div></li>`,
    )
    .join('')

  // Traceability: tests grouped per requirement; the list opens by itself when something fails.
  function testsCell(r) {
    const kinds = {}
    r.tests.forEach((t) => (kinds[t.kind] = (kinds[t.kind] ?? 0) + 1))
    const summary = `${r.tests.length} prueba${r.tests.length > 1 ? 's' : ''} · ${Object.entries(kinds)
      .map(([k, n]) => `${k} ${n}`)
      .join(' · ')}`
    const items = r.tests
      .map(
        (t) =>
          `<li>${esc(t.title)} <span class="nodetail">(${esc(t.kind)})</span> ${t.status !== 'passed' ? badge(t.status) : ''} ${
            t.status === 'failed' || t.status === 'flaky'
              ? t.detailHref
                ? `<a href="${esc(t.detailHref)}" data-testid="detail-link">ver detalle técnico</a>`
                : '<span class="nodetail" data-testid="no-detail">sin detalle técnico disponible</span>'
              : ''
          }</li>`,
      )
      .join('')
    const open = r.status === 'failed' || r.status === 'flaky' ? ' open' : ''
    return `<details${open}><summary>${esc(summary)}</summary><ul>${items}</ul></details>`
  }

  $('trace').innerHTML =
    '<thead><tr><th>Requisito</th><th>Qué pide</th><th>Pruebas</th><th>Último resultado</th></tr></thead><tbody>' +
    data.traceability
      .map(
        (r) =>
          `<tr data-requirement="${esc(r.id)}"><td class="id">${esc(r.id)}</td><td>${esc(r.title)}<span class="cap">${esc(r.capability)}</span></td>` +
          `<td>${r.tests.length ? testsCell(r) : '—'}</td><td>${badge(r.status)}</td></tr>`,
      )
      .join('') +
    '</tbody>'
  $('untraced').innerHTML = data.untraced.length
    ? `<div class="card untraced"><b>Tests sin trazar (${data.untraced.length}):</b> no están ligados a ningún requisito.<ul>${data.untraced
        .map((t) => `<li>${esc(t.title)} <span class="nodetail">${esc(t.file)}</span></li>`)
        .join('')}</ul></div>`
    : ''

  // Tables behind every chart (accessible alternative)
  $('trend-table').innerHTML = table(
    ['Ejecución', 'Superados', 'Inestables', 'Fallidos', 'Omitidos'],
    data.trend.runs.map((r) => [esc(r.label), r.passed, r.flaky, r.failed, r.skipped]),
  )
  $('stages-table').innerHTML = table(
    ['Etapa', 'Estado', 'Duración'],
    data.stages.map((s) => [esc(s.name), esc(STAGE_LABEL[s.status]), seconds(s.durationMs)]),
  )
  $('coverage-table').innerHTML = table(
    ['Estado', 'Requisitos'],
    Object.entries(data.coverage).map(([k, v]) => [esc(LABEL[k]), v]),
  )
  // Gaps by capability (QA-038)
  const CAPABILITY = {
    account: 'Cuenta', cart: 'Carrito', catalog: 'Catálogo', checkout: 'Pago', compliance: 'Cumplimiento',
    experience: 'Experiencia', 'lab-guide': 'Guía', orders: 'Pedidos', promotions: 'Cupones', 'qa-agents': 'Agentes de QA',
    'quality-pipeline': 'Pipeline', 'quality-report': 'Informe', 'repo-governance': 'Gobierno', security: 'Seguridad',
  }
  const capName = (c) => CAPABILITY[c] ?? c
  const GAP_STATES = [['passed', '--good'], ['flaky', '--warning'], ['failed', '--critical'], ['untested', '--skipped']]
  $('gaps-table').innerHTML = table(
    ['Capacidad', ...GAP_STATES.map(([k]) => LABEL[k])],
    data.coverageByCapability.map((c) => [`${esc(capName(c.capability))} <span class="nodetail">${esc(c.capability)}</span>`, ...GAP_STATES.map(([k]) => c[k])]),
  )
  // Experience (QA-018)
  const PAGE_NAMES = { '/': 'Portada', '/catalogo': 'Catálogo', '/producto/mantel-antimanchas': 'Ficha' }
  const exp = data.experience
  const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null)
  const lcp = avg(exp.lighthouse.map((p) => p.lcpMs))
  const a11yOk = exp.a11y.filter((t) => t.status === 'passed').length
  const kpi = (label, value, ok, note) =>
    `<div class="tile"><div class="label">${esc(label)}</div><div class="value">${esc(value)}</div>` +
    `<div class="delta ${ok === null ? '' : ok ? 'better' : 'worse'}">${esc(note)}</div></div>`
  $('exp-kpis').innerHTML =
    kpi('LCP medio', lcp === null ? '—' : `${(lcp / 1000).toLocaleString('es-ES', { maximumFractionDigits: 2 })} s`, lcp === null ? null : lcp <= exp.budget.lcpMs, `presupuesto ≤ ${exp.budget.lcpMs / 1000} s`) +
    kpi('p95 con 20 usuarios', exp.load ? `${exp.load.p95Ms} ms` : '—', exp.load ? exp.load.p95Ms < exp.thresholds.p95Ms : null, exp.load ? `umbral < ${exp.thresholds.p95Ms} ms · ${exp.load.requests} peticiones` : 'Sin prueba de carga en esta ejecución') +
    kpi('Errores con carga', exp.load ? `${(exp.load.errorRate * 100).toLocaleString('es-ES', { maximumFractionDigits: 2 })} %` : '—', exp.load ? exp.load.errorRate < exp.thresholds.errorRate : null, `umbral < ${exp.thresholds.errorRate * 100} %`) +
    kpi('Páginas sin barreras', exp.a11y.length ? `${a11yOk} / ${exp.a11y.length}` : '—', exp.a11y.length ? a11yOk === exp.a11y.length : null, 'WCAG 2.1 AA, sin violaciones graves')
  $('exp-lighthouse-table').innerHTML = table(
    ['Página', 'Rendimiento', 'Accesibilidad', 'Buenas prácticas', 'SEO', 'LCP', 'CLS', 'TBT'],
    exp.lighthouse.map((p) => [esc(p.page), p.performance, p.accessibility, p.bestPractices, p.seo, `${p.lcpMs} ms`, p.cls, `${p.tbtMs} ms`]),
  )
  $('exp-trend-table').innerHTML = table(
    ['Ejecución', 'Rendimiento medio', 'p95 de carga'],
    exp.trend.map((r) => [esc(r.label), r.performance ?? '—', r.p95Ms === null ? '—' : `${r.p95Ms} ms`]),
  )
  $('exp-a11y').innerHTML = exp.a11y.length
    ? exp.a11y.map((t) => `<li>${badge(t.status)} ${esc(t.title)}</li>`).join('')
    : '<li>No hay comprobaciones de accesibilidad en esta ejecución.</li>'

  // Security and compliance (QA-026)
  const sec = data.security
  const SEV = [
    ['critical', '✖ Crítica', '--critical'],
    ['high', '▲ Alta', '--serious'],
    ['medium', '◆ Media', '--warning'],
    ['low', '● Baja', '--series-1'],
    ['info', '○ Informativa', '--skipped'],
  ]
  const SRC = { semgrep: 'SAST (Semgrep)', 'npm-audit': 'Dependencias', licenses: 'Licencias', zap: 'DAST (ZAP)' }
  const prodHigh = sec.production.critical + sec.production.high
  $('sec-kpis').innerHTML =
    kpi('Hallazgos que bloquean', String(sec.blocking), sec.ran ? sec.blocking === 0 : null, 'altos, críticos o medios de ZAP sin aceptar') +
    kpi('Altos o críticos en producción', String(prodHigh), sec.ran ? prodHigh === 0 : null, 'excluidas dependencias de desarrollo') +
    kpi('Excepciones aceptadas', String(sec.accepted.length), null, 'cada una con su motivo versionado') +
    kpi('Componentes en el SBOM', sec.sbomComponents === null ? '—' : String(sec.sbomComponents), null, 'CycloneDX, dependencias de producción')
  $('sec-table').innerHTML = table(
    ['Fuente', ...SEV.map((s) => s[1])],
    Object.entries(SRC).map(([k, label]) => [esc(label), ...SEV.map((s) => sec.bySource[k][s[0]])]),
  )
  $('sec-checks').innerHTML = sec.checks.length
    ? sec.checks.map((c) => `<li>${badge(c.status)} ${esc(c.title)}${c.status === 'skipped' && c.message ? ` <span class="nodetail">${esc(c.message)}</span>` : ''}</li>`).join('')
    : '<li>La etapa de seguridad no se ejecutó en esta ejecución.</li>'
  $('sec-accepted').innerHTML = sec.accepted.length
    ? table(['Hallazgo', 'Fuente', 'Motivo'], sec.accepted.map((a) => [esc(a.title), esc(SRC[a.source] ?? a.source), esc(a.reason)]))
    : '<p class="nodetail">Ninguna.</p>'

  // Agents (QA-017)
  const agents = data.agents
  const totalActions = agents.byAgent.reduce((n, a) => n + a.count, 0)
  $('agents-table').innerHTML = table(
    ['Agente', 'Fase', 'Actuaciones'],
    agents.byAgent.map((a) => [esc(a.name), esc(a.phase), a.count]),
  )
  $('agents-latest').innerHTML = agents.latest.length
    ? agents.latest
        .map(
          (x) =>
            `<li><div class="who">${esc(x.agent)} · ${esc(x.action)}</div>` +
            `<div class="when">${esc(new Date(x.date).toLocaleDateString('es-ES'))} · ${esc(x.change)}</div>` +
            `<div>${esc(x.summary)}</div>` +
            `<div class="when">${x.artifacts.map((p) => `<a href="${repo}${esc(p)}">${esc(p)}</a>`).join(' · ')}</div></li>`,
        )
        .join('')
    : '<li data-testid="agents-empty">Todavía no hay actuaciones de agentes registradas.</li>'

  // Stability (QA-053)
  const stab = data.stability
  const pctText = (n) => `${n.toLocaleString('es-ES', { maximumFractionDigits: 1 })} %`
  $('stab-table').innerHTML = table(
    ['Ejecución', 'Inestables', 'Ejecutados', '% inestables'],
    stab.runs.map((r) => [esc(r.label), r.flaky, r.executed, pctText(r.ratePct)]),
  )
  $('stab-unstable').innerHTML = stab.unstable.length
    ? table(
        ['Test', 'Inestable', 'Última vez'],
        stab.unstable.map((t) => [
          `${esc(t.title)} <span class="nodetail">${esc(t.file)}</span>`,
          `${t.flaky} de ${t.runs} (${pctText(t.ratePct)})`,
          esc(new Date(t.lastFlakyAt).toLocaleDateString('es-ES')),
        ]),
      )
    : `<p class="nodetail" data-testid="stability-none">Ningún test ha sido inestable en las últimas ${stab.window} ejecuciones.</p>`
  $('stab-quarantine').innerHTML = stab.quarantine.length
    ? table(
        ['Test', 'Motivo', 'Caduca'],
        stab.quarantine.map((q) => [`${esc(q.titulo)} <a href="${esc(q.issue)}">issue</a>`, esc(q.motivo), esc(q.hasta)]),
      )
    : '<p class="nodetail">Ningún test en cuarentena.</p>'

  // Operations: triage of this run and what the operation agents did (QA-054)
  const ops = data.operations
  if (ops.injectedDefect) {
    const demo = $('demo-banner')
    demo.hidden = false
    demo.innerHTML = `<span><b>⚠ Ejecución de demostración</b> con el defecto <code>${esc(ops.injectedDefect)}</code> inyectado a propósito. No entra en el histórico publicado.</span>`
  }
  const TRIAGE_ICON = { producto: '✖', test: '⚙', entorno: '☁', inestable: '⚠', desconocido: '?' }
  const triagedTotal = ops.byCategory.reduce((n, c) => n + c.count, 0)
  $('ops-kpis').innerHTML = ops.byCategory
    .map((c) => kpi(`${TRIAGE_ICON[c.category]} ${c.label}`, String(c.count), null, triagedTotal ? `${Math.round((c.count / triagedTotal) * 100)} % de los fallos` : 'sin fallos'))
    .join('')
  $('ops-failures').innerHTML = ops.failures.length
    ? table(
        ['Test', 'Requisitos', 'Categoría', 'Motivo'],
        ops.failures.map((x) => [esc(x.title), esc(x.requirements.join(', ') || '—'), `${TRIAGE_ICON[x.category]} ${esc(x.label)}`, esc(x.reason)]),
      )
    : '<p class="nodetail" data-testid="operations-none">Ningún test ha fallado ni ha sido inestable en esta ejecución.</p>'
  $('ops-actions').innerHTML = ops.actions.length
    ? ops.actions
        .map(
          (x) =>
            `<li><div class="who">${esc(x.agent)} · ${esc(x.action)}</div>` +
            `<div class="when">${esc(new Date(x.date).toLocaleDateString('es-ES'))} · ${esc(x.change)}</div>` +
            `<div>${esc(x.summary)}</div>` +
            `<div class="when">${x.artifacts.map((p) => `<a href="${repo}${esc(p)}">${esc(p)}</a>`).join(' · ')}</div></li>`,
        )
        .join('')
    : '<li>El Sanador, el Detector de inestables y el Triaje todavía no han registrado actuaciones.</li>'

  $('footer').textContent = `Informe generado el ${new Date(data.generatedAt).toLocaleString('es-ES')} · QA Agentic Lab`

  // Charts
  const charts = []
  function render() {
    charts.splice(0).forEach((c) => c.dispose())
    const textStyle = { color: css('--ink-2'), fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }
    const tooltip = { backgroundColor: css('--surface'), borderColor: css('--border'), textStyle: { color: css('--ink') } }
    const axis = {
      axisLine: { lineStyle: { color: css('--axis') } },
      axisTick: { show: false },
      axisLabel: { color: css('--muted') },
      splitLine: { lineStyle: { color: css('--grid') } },
    }

    const trendEl = $('trend')
    if (data.trend.runs.length < data.trend.minRuns) {
      trendEl.className = 'chart empty'
      trendEl.setAttribute('data-testid', 'trend-empty')
      trendEl.textContent = `La tendencia necesita al menos ${data.trend.minRuns} ejecuciones. De momento hay ${data.trend.runs.length}: vuelve tras la siguiente.`
    } else {
      const series = [
        ['✔ Superados', 'passed', '--good'],
        ['⚠ Inestables', 'flaky', '--warning'],
        ['✖ Fallidos', 'failed', '--critical'],
        ['○ Omitidos', 'skipped', '--skipped'],
      ].map(([name, key, color], i, all) => ({
        name,
        type: 'bar',
        stack: 'r',
        barMaxWidth: 36,
        data: data.trend.runs.map((r) => r[key]),
        itemStyle: {
          color: css(color),
          borderColor: css('--surface'),
          borderWidth: 1,
          borderRadius: i === all.length - 1 ? [4, 4, 0, 0] : 0,
        },
        emphasis: { focus: 'series' },
      }))
      const c = echarts.init(trendEl)
      c.setOption({
        textStyle,
        tooltip: { ...tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { top: 0, textStyle, icon: 'roundRect', itemWidth: 12, itemHeight: 12 },
        grid: { left: 44, right: 16, top: 64, bottom: 44 },
        xAxis: { type: 'category', data: data.trend.runs.map((r) => r.label), name: 'Ejecución', nameLocation: 'middle', nameGap: 30, nameTextStyle: { color: css('--muted') }, ...axis, splitLine: { show: false } },
        yAxis: { type: 'value', name: 'Tests', minInterval: 1, nameTextStyle: { color: css('--muted') }, ...axis },
        series,
      })
      charts.push(c)
    }

    const st = echarts.init($('stages'))
    st.setOption({
      textStyle,
      tooltip: { ...tooltip, trigger: 'item', formatter: (p) => `${p.name}: ${seconds(p.value)}` },
      grid: { left: 150, right: 56, top: 8, bottom: 24 },
      xAxis: { type: 'value', splitNumber: 3, ...axis, axisLabel: { color: css('--muted'), formatter: (v) => seconds(v) } },
      yAxis: { type: 'category', inverse: true, data: data.stages.map((s) => s.name), ...axis, axisLabel: { color: css('--ink-2') } },
      series: [{
        type: 'bar',
        barMaxWidth: 22,
        data: data.stages.map((s) => s.durationMs),
        itemStyle: { color: css('--brand'), borderRadius: [0, 4, 4, 0] },
        label: { show: true, position: 'right', color: css('--ink-2'), formatter: (p) => seconds(p.value) },
      }],
    })
    charts.push(st)

    const total = Object.values(data.coverage).reduce((a, b) => a + b, 0)
    const covered = total - data.coverage.untested
    const cv = echarts.init($('coverage'))
    cv.setOption({
      textStyle,
      tooltip: { ...tooltip, trigger: 'item', formatter: '{b}: {c} requisitos ({d} %)' },
      legend: { right: 0, top: 'middle', orient: 'vertical', textStyle },
      series: [{
        type: 'pie',
        radius: ['55%', '80%'],
        center: ['35%', '50%'],
        padAngle: 1,
        itemStyle: { borderColor: css('--surface'), borderWidth: 2, borderRadius: 4 },
        label: { show: true, position: 'center', formatter: () => `${covered} / ${total}`, fontSize: 22, fontWeight: 700, color: css('--ink') },
        labelLine: { show: false },
        data: [
          { name: LABEL.passed, value: data.coverage.passed, itemStyle: { color: css('--good') } },
          { name: LABEL.flaky, value: data.coverage.flaky, itemStyle: { color: css('--warning') } },
          { name: LABEL.failed, value: data.coverage.failed, itemStyle: { color: css('--critical') } },
          { name: LABEL.untested, value: data.coverage.untested, itemStyle: { color: css('--skipped') } },
        ],
      }],
    })
    charts.push(cv)

    const gp = echarts.init($('gaps'))
    gp.setOption({
      textStyle,
      tooltip: { ...tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { top: 0, textStyle, icon: 'roundRect', itemWidth: 10, itemHeight: 10 },
      grid: { left: 120, right: 16, top: 40, bottom: 24 },
      xAxis: { type: 'value', minInterval: 1, name: 'Requisitos', nameLocation: 'middle', nameGap: 26, nameTextStyle: { color: css('--muted') }, ...axis },
      yAxis: { type: 'category', inverse: true, data: data.coverageByCapability.map((c) => capName(c.capability)), ...axis, axisLabel: { color: css('--ink-2') } },
      series: GAP_STATES.map(([key, color]) => ({
        name: LABEL[key],
        type: 'bar',
        stack: 'g',
        barMaxWidth: 18,
        data: data.coverageByCapability.map((c) => c[key]),
        itemStyle: { color: css(color), borderColor: css('--surface'), borderWidth: 1 },
      })),
    })
    charts.push(gp)

    // Lighthouse: pages × categories, with the budget as a reference line (one axis, 0–100).
    const lhEl = $('exp-lighthouse')
    if (!exp.lighthouse.length) {
      lhEl.className = 'chart short empty'
      lhEl.setAttribute('data-testid', 'experience-empty')
      lhEl.textContent = 'No hay métricas de rendimiento en esta ejecución (la etapa "Rendimiento y carga" no se ejecutó).'
    } else {
      const cats = [
        ['Rendimiento', 'performance', '--series-1'],
        ['Accesibilidad', 'accessibility', '--series-2'],
        ['Buenas prácticas', 'bestPractices', '--series-3'],
        ['SEO', 'seo', '--series-4'],
      ]
      const lh = echarts.init(lhEl)
      lh.setOption({
        textStyle,
        tooltip: { ...tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { top: 0, textStyle, icon: 'roundRect', itemWidth: 10, itemHeight: 10 },
        grid: { left: 36, right: 12, top: 52, bottom: 28 },
        xAxis: { type: 'category', data: exp.lighthouse.map((p) => PAGE_NAMES[p.page] ?? p.page), ...axis, axisLabel: { color: css('--muted'), interval: 0 }, splitLine: { show: false } },
        yAxis: { type: 'value', min: 0, max: 100, ...axis },
        series: cats.map(([name, key, color], i) => ({
          name,
          type: 'bar',
          barMaxWidth: 14,
          data: exp.lighthouse.map((p) => p[key]),
          itemStyle: { color: css(color), borderRadius: [3, 3, 0, 0] },
          ...(i === 0 ? { markLine: { symbol: 'none', silent: true, lineStyle: { color: css('--muted'), type: 'dashed' }, label: { formatter: `presupuesto ${exp.budget.performance}`, color: css('--muted'), position: 'insideStartTop' }, data: [{ yAxis: exp.budget.performance }] } } : {}),
        })),
      })
      charts.push(lh)
    }

    const trEl = $('exp-trend')
    const points = exp.trend.filter((r) => r.performance !== null)
    if (points.length < 2) {
      trEl.className = 'chart short empty'
      trEl.textContent = 'La evolución del rendimiento necesita al menos 2 ejecuciones con métricas.'
    } else {
      const tr = echarts.init(trEl)
      tr.setOption({
        textStyle,
        tooltip: { ...tooltip, trigger: 'axis' },
        grid: { left: 36, right: 16, top: 24, bottom: 28 },
        xAxis: { type: 'category', data: exp.trend.map((r) => r.label), ...axis, splitLine: { show: false } },
        yAxis: { type: 'value', name: 'Rendimiento medio', min: 0, max: 100, nameTextStyle: { color: css('--muted') }, ...axis },
        series: [{ type: 'line', data: exp.trend.map((r) => r.performance), connectNulls: true, symbolSize: 8, lineStyle: { width: 2, color: css('--brand') }, itemStyle: { color: css('--brand') } }],
      })
      charts.push(tr)
    }

    const secEl = $('sec-chart')
    if (!sec.ran) {
      secEl.className = 'chart short empty'
      secEl.setAttribute('data-testid', 'security-empty')
      secEl.textContent = 'No hay resultados de seguridad en esta ejecución (la etapa "Seguridad y cumplimiento" no se ejecutó).'
    } else {
      const sc = echarts.init(secEl)
      sc.setOption({
        textStyle,
        tooltip: { ...tooltip, trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { top: 0, textStyle, icon: 'roundRect', itemWidth: 10, itemHeight: 10 },
        grid: { left: 110, right: 16, top: 52, bottom: 24 },
        xAxis: { type: 'value', minInterval: 1, ...axis },
        yAxis: { type: 'category', inverse: true, data: Object.values(SRC), ...axis, axisLabel: { color: css('--ink-2') } },
        series: SEV.map(([key, name, color]) => ({
          name,
          type: 'bar',
          stack: 's',
          barMaxWidth: 20,
          data: Object.keys(SRC).map((k) => sec.bySource[k][key]),
          itemStyle: { color: css(color), borderColor: css('--surface'), borderWidth: 1 },
        })),
      })
      charts.push(sc)
    }

    const stEl = $('stab-chart')
    if (stab.runs.every((r) => r.flaky === 0)) {
      stEl.className = 'chart short empty'
      stEl.setAttribute('data-testid', 'stability-empty')
      stEl.textContent = `Ningún test ha sido inestable en las últimas ${stab.window} ejecuciones.`
    } else {
      const sb = echarts.init(stEl)
      sb.setOption({
        textStyle,
        tooltip: { ...tooltip, trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (p) => `${p[0].name}: ${pctText(p[0].value)} (${stab.runs[p[0].dataIndex].flaky} de ${stab.runs[p[0].dataIndex].executed})` },
        grid: { left: 44, right: 16, top: 16, bottom: 28 },
        xAxis: { type: 'category', data: stab.runs.map((r) => r.label), ...axis, splitLine: { show: false } },
        yAxis: { type: 'value', name: '% inestables', min: 0, nameTextStyle: { color: css('--muted') }, ...axis, axisLabel: { color: css('--muted'), formatter: (v) => `${v} %` } },
        series: [{
          type: 'bar',
          barMaxWidth: 28,
          data: stab.runs.map((r) => r.ratePct),
          itemStyle: { color: css('--warning'), borderRadius: [4, 4, 0, 0] },
        }],
      })
      charts.push(sb)
    }

    const agEl = $('agents-chart')
    if (totalActions === 0) {
      agEl.className = 'chart short empty'
      agEl.setAttribute('data-testid', 'agents-chart-empty')
      agEl.textContent = 'Los agentes todavía no han registrado actuaciones.'
    } else {
      const ag = echarts.init(agEl)
      ag.setOption({
        textStyle,
        tooltip: { ...tooltip, trigger: 'item', formatter: (p) => `${p.name}: ${p.value} actuaciones` },
        grid: { left: 140, right: 40, top: 8, bottom: 24 },
        xAxis: { type: 'value', minInterval: 1, ...axis },
        yAxis: { type: 'category', inverse: true, data: agents.byAgent.map((a) => a.name), ...axis, axisLabel: { color: css('--ink-2') } },
        series: [{
          type: 'bar',
          barMaxWidth: 22,
          data: agents.byAgent.map((a) => a.count),
          itemStyle: { color: css('--accent'), borderRadius: [0, 4, 4, 0] },
          label: { show: true, position: 'right', color: css('--ink-2') },
        }],
      })
      charts.push(ag)
    }
  }

  render()
  window.addEventListener('resize', () => charts.forEach((c) => c.resize()))
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', render)
  $('theme').addEventListener('click', () => {
    const root = document.documentElement
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches
    root.dataset.theme = dark ? 'light' : 'dark'
    render()
  })
})()

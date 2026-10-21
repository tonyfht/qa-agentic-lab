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
    '<button class="toggle" id="theme" type="button">Cambiar tema</button>'

  const flaky = data.stages.length && data.traceability.flatMap((r) => r.tests).filter((t) => t.status === 'flaky').length
  const notRun = data.stages.filter((s) => s.status === 'not_run' || s.status === 'skipped').length
  $('banner').innerHTML =
    (run.status === 'passed' ? badge('passed', '✔ Superada') : badge('failed', '✖ Fallida')) +
    `<span>${
      run.status === 'passed' ? 'Todas las etapas bloqueantes en verde.' : 'Al menos una etapa bloqueante ha fallado.'
    }${flaky ? ` <b>${flaky} test${flaky > 1 ? 's' : ''} inestable${flaky > 1 ? 's' : ''}</b> que conviene revisar.` : ''}${
      notRun ? ` ${notRun} etapa${notRun > 1 ? 's' : ''} sin ejecutar.` : ''
    }</span>`

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

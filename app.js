// LAR GROUP Dashboard - lógica principal
const PROJECTS = ['Holley','Bellet','IMU'];
const VIEWS = ['Todos','Leads','Ocupación','Vencimientos','Salidas Anticipadas'];
const PERIODS = [{k:'7m',l:'Últimos 7 meses'},{k:'ytd',l:'YTD 2026'},{k:'all',l:'Todo'}];
const state = { proy: 'Todos', view: 'Todos', per: '7m' };
let charts = {};

const fmt = {
  n: v => v == null ? '–' : (typeof v === 'string' ? v : Number(v).toLocaleString('es-CL')),
  p: v => v == null ? '–' : (typeof v === 'string' ? v : (v*100).toFixed(1)+'%'),
  u: v => v == null ? '–' : (typeof v === 'string' ? v : Number(v).toFixed(2)),
  u3: v => v == null ? '–' : (typeof v === 'string' ? v : Number(v).toFixed(3))
};

function trim(months, ...arrs) {
  let n;
  if (state.per === '7m') n = 7;
  else if (state.per === 'ytd') {
    const i = months.findIndex(m => m.includes('26'));
    n = i >= 0 ? months.length - i : months.length;
  } else n = months.length;
  const s = Math.max(0, months.length - n);
  return [months.slice(s), ...arrs.map(a => a ? a.slice(s) : a)];
}

function destroyCharts() {
  Object.values(charts).forEach(c => { try { c.destroy(); } catch(e){} });
  charts = {};
}

function buildTabs() {
  const mk = (id, items, key) => {
    const c = document.getElementById(id);
    c.innerHTML = '';
    items.forEach(it => {
      const v = typeof it === 'string' ? it : it.k;
      const l = typeof it === 'string' ? it : it.l;
      const t = document.createElement('div');
      t.className = 'tab' + (state[key] === v ? ' active' : '');
      t.textContent = l;
      t.dataset.value = v;
      t.onclick = () => {
        state[key] = v;
        c.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x.dataset.value === v));
        render();
      };
      c.appendChild(t);
    });
  };
  mk('projectTabs', ['Todos', ...PROJECTS], 'proy');
  mk('viewTabs', VIEWS, 'view');
  mk('periodTabs', PERIODS, 'per');
}

function shell(title, subtitle, body) {
  return '<div class="slide">' +
    '<div class="lar-header">' +
      '<div class="lar-logo">LAR<small>GROUP</small></div>' +
      '<span class="lar-slogan">Tu nueva forma de arrendar</span>' +
    '</div>' +
    '<div class="slide-body">' +
      '<div class="slide-title">' + title + '</div>' +
      '<div class="slide-subtitle">' + subtitle + '</div>' +
      body +
    '</div>' +
    '<div class="lar-endorse">' +
      '<span>UN PROYECTO LAR GROUP</span>' +
      '<span class="date">Información al 07-05-2026</span>' +
    '</div>' +
  '</div>';
}

function tableRow(label, arr, fn, kpi) {
  fn = fn || fmt.n;
  let html = '<tr' + (kpi ? ' class="kpi"' : '') + '>';
  html += '<td class="left">' + label + '</td>';
  arr.forEach(v => { html += '<td>' + fn(v) + '</td>'; });
  html += '</tr>';
  return html;
}

// ===== LEADS =====
function buildLeads(p) {
  const d = LEADS[p], m = d.metrics;
  const [mo, web, ag, meta, port, otr, tot, vis, res, kV, kC] = trim(d.months,
    m['Web'], m['Agendamientos Web'], m['Meta Ads'], m['Portal Inmobiliario'],
    m['Otros'], m['Leads Totales'], m['Visita concretada'], m['Reservas mensuales'],
    m['KPI Visita'], m['KPI Cierre']);
  const li = mo.length - 1;
  const sumRes = res.reduce((a,b) => a+(b||0), 0);
  const avgV = kV.filter(x=>x!=null).reduce((a,b)=>a+b,0)/Math.max(1,kV.filter(x=>x!=null).length);
  const avgC = kC.filter(x=>x!=null).reduce((a,b)=>a+b,0)/Math.max(1,kC.filter(x=>x!=null).length);
  const cols = mo.map(x => '<th>' + x + '</th>').join('');

  let body = '<div class="kpis">';
  body += '<div class="kpi dark"><div class="lbl">Reservas '+mo[li]+'</div><div class="val">'+res[li]+'</div><div class="sub">Promedio 12m: '+d.avgRes+'/mes</div></div>';
  body += '<div class="kpi"><div class="lbl">Leads '+mo[li]+'</div><div class="val">'+fmt.n(tot[li])+'</div><div class="sub">Visitas: '+vis[li]+'</div></div>';
  body += '<div class="kpi"><div class="lbl">KPI Visita</div><div class="val">'+fmt.p(kV[li])+'</div><div class="sub">Prom: '+fmt.p(avgV)+'</div></div>';
  body += '<div class="kpi gris"><div class="lbl">KPI Cierre</div><div class="val">'+fmt.p(kC[li])+'</div><div class="sub">Prom: '+fmt.p(avgC)+'</div></div>';
  body += '<div class="kpi gris"><div class="lbl">Reservas Período</div><div class="val">'+sumRes+'</div><div class="sub">'+mo.length+' meses</div></div>';
  body += '</div>';

  body += '<div class="section-title">Resumen de Leads</div>';
  body += '<table class="lar"><thead><tr><th class="left">'+p.toUpperCase()+'</th>'+cols+'</tr></thead><tbody>';
  body += tableRow('Agendamientos Web', ag);
  body += tableRow('Web', web);
  body += tableRow('Meta Ads', meta);
  body += tableRow('Portal Inmobiliario', port);
  body += tableRow('Otros', otr);
  body += tableRow('Leads Totales', tot);
  body += tableRow('Visita concretada', vis);
  body += tableRow('Reservas mensuales netas', res);
  body += tableRow('Tasa visita / leads', kV, fmt.p, true);
  body += tableRow('Tasa cierre / visitas', kC, fmt.p, true);
  body += '</tbody></table>';
  body += '<div class="section-title">Evolución de leads por canal</div>';
  body += '<div class="chart-wrap"><canvas id="cL_'+p+'"></canvas></div>';

  return shell('Resultados Gestión Comercial <strong>'+p+'</strong>', 'Resumen de Leads', body);
}

function chartLeads(p) {
  const d = LEADS[p], m = d.metrics;
  const [mo, web, , meta, port, otr, , , res] = trim(d.months,
    m['Web'], m['Agendamientos Web'], m['Meta Ads'], m['Portal Inmobiliario'],
    m['Otros'], m['Leads Totales'], m['Visita concretada'], m['Reservas mensuales']);
  const ctx = document.getElementById('cL_'+p);
  if (!ctx) return;
  charts['cL_'+p] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: mo,
      datasets: [
        { label:'Web', data:web, backgroundColor:'#00A8B4', stack:'a' },
        { label:'Meta', data:meta, backgroundColor:'#66CAD2', stack:'a' },
        { label:'Portal', data:port, backgroundColor:'#747678', stack:'a' },
        { label:'Otros', data:otr, backgroundColor:'#B5B6B7', stack:'a' },
        { label:'Reservas', data:res, type:'line', borderColor:'#1A1A1A', backgroundColor:'#1A1A1A', tension:.3, pointRadius:5, yAxisID:'y2' }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: { x:{stacked:true}, y:{stacked:true,beginAtZero:true}, y2:{position:'right',grid:{drawOnChartArea:false},beginAtZero:true} },
      plugins: { legend:{position:'top'} }
    }
  });
}

// ===== OCUPACION =====
function buildOcup(p) {
  const d = OCUP[p], y = d.ytd, fc = d.fc, tipo = d.tipo;
  const resKey = p === 'IMU' ? 'Reservas Netas mes' : 'Reservas del mes';
  const [mo, totU, arrU, resM, resC, noD, cD, cL, oc, pA, oP] = trim(d.months,
    y['Unidades Totales'], y['Unidades Arrendadas'], y[resKey],
    y['Reservas en curso'], y['No Disponibles + Pil/Of'],
    y['Comerc. Disponibles'], y['Comerc. Por liberar'],
    y['Ocupación %'], y['Un. Arr. PPTO'], y['Ocup. PPTO %']);
  const li = mo.length - 1;
  const cols = mo.map(x => '<th>' + x + '</th>').join('');
  const totalT = tipo.find(t => t.isTotal);

  let body = '<div class="kpis">';
  body += '<div class="kpi dark"><div class="lbl">Ocupación '+mo[li]+'</div><div class="val">'+fmt.p(oc[li])+'</div><div class="sub">'+arrU[li]+' de '+totU[li]+' un.</div></div>';
  body += '<div class="kpi"><div class="lbl">Vs PPTO</div><div class="val">'+fmt.p(oc[li]-oP[li])+'</div><div class="sub">PPTO: '+fmt.p(oP[li])+'</div></div>';
  body += '<div class="kpi"><div class="lbl">Reservas mes</div><div class="val">'+resM[li]+'</div><div class="sub">En curso: '+resC[li]+'</div></div>';
  body += '<div class="kpi gris"><div class="lbl">Disponibles</div><div class="val">'+cD[li]+'</div><div class="sub">Por liberar: '+cL[li]+'</div></div>';
  body += '<div class="kpi gris"><div class="lbl">UF/m² Total</div><div class="val">'+fmt.u3(totalT.ufArr)+'</div><div class="sub">'+(p==='Holley'?'Desafío 2026: 0,480':p==='Bellet'?'Desafío 2026: 0,450':'')+'</div></div>';
  body += '</div>';

  body += '<div class="section-title">Ocupación YTD</div>';
  body += '<table class="lar"><thead><tr><th class="left">'+p.toUpperCase()+'</th>'+cols+'</tr></thead><tbody>';
  body += tableRow('Unidades Totales', totU);
  body += tableRow('Unidades Arrendadas', arrU);
  body += tableRow('Reservas del mes', resM);
  body += tableRow('Reservas en curso', resC);
  body += tableRow('No Disponibles', noD);
  body += tableRow('Comerc. Disponibles', cD);
  body += tableRow('Comerc. Por liberar', cL);
  body += tableRow('Ocupación', oc, fmt.p, true);
  body += tableRow('Un. Arr. PPTO', pA);
  body += tableRow('Ocupación PPTO', oP, fmt.p, true);
  body += '</tbody></table>';

  // Forecast
  body += '<div class="split-2"><div>';
  body += '<div class="section-title">Forecast '+fc.months[0]+' – '+fc.months[fc.months.length-1]+'</div>';
  const fcCols = fc.months.map(x => '<th>'+x+'</th>').join('');
  body += '<table class="lar"><thead><tr><th class="left">FORECAST</th>'+fcCols+'</tr></thead><tbody>';
  body += tableRow('Unidades Arrendadas', fc['Unidades Arrendadas']);
  body += tableRow('Reservas Pendientes', fc['Reservas Pendientes']);
  body += tableRow('Salidas sin reservas', fc['Salidas sin reservas']);
  body += tableRow('Forecast Ocupación', fc['Forecast %'], fmt.p, true);
  body += '</tbody></table></div>';
  body += '<div><div class="section-title">Ocupación vs PPTO</div>';
  body += '<div class="chart-wrap"><canvas id="cO_'+p+'"></canvas></div></div></div>';

  // Tipologías
  body += '<div class="section-title">Tipologías — UF/m² por categoría</div>';
  body += '<table class="lar"><thead><tr><th class="left">Tipología</th><th>Total</th><th>Arrendado</th><th>% Real</th><th>UF/m² Arr.</th><th>Reservado</th><th>% Forecast</th><th>UF/m² Rsv.</th><th>Disponible</th><th>UF/m² Disp.</th></tr></thead><tbody>';
  tipo.forEach(t => {
    const cls = t.isTotal ? ' class="totales"' : '';
    body += '<tr'+cls+'><td class="left">'+t.tipo+'</td><td>'+fmt.n(t.total)+'</td><td>'+fmt.n(t.arr)+'</td><td>'+fmt.p(t.pctReal)+'</td><td>'+fmt.u3(t.ufArr)+'</td><td>'+fmt.n(t.rsv)+'</td><td>'+fmt.p(t.pctFc)+'</td><td>'+fmt.u3(t.ufRsv)+'</td><td>'+fmt.n(t.disp)+'</td><td>'+fmt.u3(t.ufDisp)+'</td></tr>';
  });
  body += '</tbody></table>';

  return shell('Resultados Gestión Comercial <strong>'+p+'</strong>', 'Status Ocupación · Forecast · Tipologías', body);
}

function chartOcup(p) {
  const d = OCUP[p], y = d.ytd;
  const [mo, oc, oP] = trim(d.months, y['Ocupación %'], y['Ocup. PPTO %']);
  const ctx = document.getElementById('cO_'+p);
  if (!ctx) return;
  charts['cO_'+p] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: mo,
      datasets: [
        { label:'Real', data:oc.map(v=>v==null?null:v*100), borderColor:'#00A8B4', backgroundColor:'rgba(0,168,180,0.15)', tension:.3, fill:true, borderWidth:3 },
        { label:'PPTO', data:oP.map(v=>v==null?null:v*100), borderColor:'#747678', tension:.3, borderDash:[5,5], borderWidth:2 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: { y:{min:p==='IMU'?0:80, max:100, ticks:{callback:v=>v+'%'}} },
      plugins: { legend:{position:'top'} }
    }
  });
}

// ===== VENCIMIENTOS =====
function buildVenc(p) {
  const d = VENC[p], k = d.kpi, s = d.sal;
  const [mo, ve, re, nr, sR, kR, kN, ge] = trim(d.months,
    k['Vencimientos'], k['Renovaciones'], k['No Renuevan'], k['Sin Respuesta'],
    k['KPI Renov'], k['KPI NoRenov'], k['Gestion']);
  const [, sa, ex, ci] = trim(d.months, s['Anticipadas'], s['Extensiones'], s['CambioInterno']);
  const tV = ve.reduce((a,b)=>a+(b||0),0);
  const tR = re.reduce((a,b)=>a+(b||0),0);
  const tNR = nr.reduce((a,b)=>a+(b||0),0);
  const tSR = sR.reduce((a,b)=>a+(b||0),0);
  const tSA = sa.reduce((a,b)=>a+(b||0),0);
  const tasa = tV ? tR/tV : 0;
  const li = mo.length - 1;
  const cols = mo.map(x => '<th>'+x+'</th>').join('');
  const tact = {
    'Holley':'Estacionamiento y Bodega 50% por 1 año',
    'Bellet':'Estacionamiento 50% por 6 meses o Bodega 50% por 1 año',
    'IMU':'Camino 1: Renovar sin alza · Camino 2: Medio mes gratis + 1,5 UF est.'
  };

  let body = '<div class="kpis">';
  body += '<div class="kpi dark"><div class="lbl">Tasa Retención</div><div class="val">'+fmt.p(tasa)+'</div><div class="sub">'+tR+' / '+tV+' venc.</div></div>';
  body += '<div class="kpi"><div class="lbl">Vencimientos '+mo[li]+'</div><div class="val">'+ve[li]+'</div><div class="sub">Renovaron: '+re[li]+'</div></div>';
  body += '<div class="kpi"><div class="lbl">No Renuevan '+mo[li]+'</div><div class="val">'+nr[li]+'</div><div class="sub">KPI: '+fmt.p(kN[li])+'</div></div>';
  body += '<div class="kpi '+(tSR>0?'warn':'gris')+'"><div class="lbl">Sin Respuesta</div><div class="val">'+tSR+'</div><div class="sub">% Gestión: '+fmt.p(ge[li])+'</div></div>';
  body += '<div class="kpi amber"><div class="lbl">Salidas Anticipadas</div><div class="val">'+tSA+'</div><div class="sub">en período</div></div>';
  body += '</div>';

  if (tSR > 0) {
    body += '<div class="info-box warn"><strong>⚠ Alerta · Sin Respuesta</strong>'+tSR+' contratos sin gestionar. Crítico para retención.</div>';
  }

  body += '<div class="section-title">Renovaciones de Contratos — '+p.toUpperCase()+'</div>';
  body += '<table class="lar"><thead><tr><th class="left">'+p.toUpperCase()+'</th>'+cols+'<th>Total</th></tr></thead><tbody>';
  body += '<tr><td class="left">Vencimientos</td>' + ve.map(v=>'<td>'+fmt.n(v)+'</td>').join('') + '<td><strong>'+tV+'</strong></td></tr>';
  body += '<tr><td class="left">Renovaciones</td>' + re.map(v=>'<td>'+fmt.n(v)+'</td>').join('') + '<td><strong>'+tR+'</strong></td></tr>';
  body += '<tr><td class="left">No Renuevan</td>' + nr.map(v=>'<td>'+fmt.n(v)+'</td>').join('') + '<td><strong>'+tNR+'</strong></td></tr>';
  body += '<tr'+(tSR>0?' class="warn"':'')+'><td class="left">Sin Respuesta</td>' + sR.map(v=>'<td>'+fmt.n(v)+'</td>').join('') + '<td><strong>'+tSR+'</strong></td></tr>';
  body += '<tr class="kpi"><td class="left">KPI Renovación</td>' + kR.map(v=>'<td>'+fmt.p(v)+'</td>').join('') + '<td><strong>'+fmt.p(tasa)+'</strong></td></tr>';
  body += '<tr class="kpi"><td class="left">KPI No Renovación</td>' + kN.map(v=>'<td>'+fmt.p(v)+'</td>').join('') + '<td><strong>'+fmt.p((tNR+tSR)/Math.max(tV,1))+'</strong></td></tr>';
  body += '<tr><td class="left">% Gestión</td>' + ge.map(v=>'<td>'+fmt.p(v)+'</td>').join('') + '<td></td></tr>';
  body += '</tbody></table>';

  body += '<div class="split-2"><div>';
  body += '<div class="section-title">Salidas anticipadas / Extensiones / Cambios Internos</div>';
  body += '<table class="lar"><thead><tr><th class="left"></th>'+cols+'</tr></thead><tbody>';
  body += tableRow('Salidas anticipadas', sa);
  body += tableRow('Extensiones', ex);
  body += tableRow('Cambio Interno', ci);
  body += '</tbody></table></div><div>';
  body += '<div class="info-box"><strong>Tácticas de Retención</strong>'+tact[p]+'</div>';
  body += '<div class="info-box gris"><strong>Resumen Período</strong><span class="big">'+fmt.p(tasa)+'</span>'+tR+' renovaron · '+tNR+' no renovaron · '+tSR+' sin respuesta</div>';
  body += '</div></div>';

  body += '<div class="section-title">Evolución mensual</div>';
  body += '<div class="chart-wrap tall"><canvas id="cV_'+p+'"></canvas></div>';

  return shell('Status Renovaciones de Contrato <strong>'+p+'</strong>', 'Vencimientos · Renueva · No Renueva · KPI', body);
}

function chartVenc(p) {
  const d = VENC[p], k = d.kpi;
  const [mo, re, nr, sR, kR] = trim(d.months, k['Renovaciones'], k['No Renuevan'], k['Sin Respuesta'], k['KPI Renov']);
  const ctx = document.getElementById('cV_'+p);
  if (!ctx) return;
  charts['cV_'+p] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: mo,
      datasets: [
        { label:'Renovaciones', data:re, backgroundColor:'#00A8B4', stack:'v' },
        { label:'No Renuevan', data:nr, backgroundColor:'#747678', stack:'v' },
        { label:'Sin Respuesta', data:sR, backgroundColor:'#B23A48', stack:'v' },
        { label:'KPI %', data:kR.map(v=>v==null?null:v*100), type:'line', borderColor:'#1A1A1A', backgroundColor:'#1A1A1A', tension:.3, pointRadius:5, yAxisID:'y2' }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      scales: { x:{stacked:true}, y:{stacked:true,beginAtZero:true}, y2:{position:'right',grid:{drawOnChartArea:false},min:0,max:100,ticks:{callback:v=>v+'%'}} },
      plugins: { legend:{position:'top'} }
    }
  });
}

// ===== SALIDAS ANTICIPADAS =====
function buildSal(p) {
  const recs = SALIDAS.filter(r => r[0] === p);
  const cat = {};
  const tipoCount = { controlable:0, vida:0, interno:0, fin:0, otros:0 };
  recs.forEach(r => {
    cat[r[4]] = (cat[r[4]] || 0) + 1;
    const t = CAT_TIPO[r[4]] || 'otros';
    tipoCount[t]++;
  });
  const total = recs.length;
  const ant = total - (cat['Fin de contrato'] || 0);
  const sorted = Object.entries(cat).sort((a,b) => b[1]-a[1]);
  const ufTotal = recs.reduce((s,r) => s + (r[3]||0), 0);
  const topUF = recs.filter(r => r[3]).sort((a,b) => b[3]-a[3]).slice(0, 8);
  const ufByCat = {};
  recs.forEach(r => { if (r[3]) ufByCat[r[4]] = (ufByCat[r[4]] || 0) + r[3]; });

  const insights = {
    'Holley': (cat['Tarifa']||0)+' por <strong>tarifa</strong> y '+(cat['Cambio laboral']||0)+' por <strong>cambio laboral</strong> son las dos causas dominantes. Tarifa es controlable.',
    'Bellet': (cat['Omisión']||0)+' por <strong>omisión</strong> es la causa #1 — falla de gestión proactiva. '+(cat['Compra vivienda']||0)+' compraron casa: imposible retener.',
    'IMU': (cat['Ruidos']||0)+' por <strong>ruidos</strong> es el problema diferenciador. '+(cat['Cambio laboral']||0)+' por cambio laboral. Atender ruidos es urgente.'
  };

  let body = '<div class="kpis">';
  body += '<div class="kpi dark"><div class="lbl">Total Salidas</div><div class="val">'+total+'</div><div class="sub">No Renueva detallado</div></div>';
  body += '<div class="kpi warn"><div class="lbl">Anticipadas</div><div class="val">'+ant+'</div><div class="sub">'+fmt.p(ant/total)+'</div></div>';
  body += '<div class="kpi gris"><div class="lbl">Fin de Contrato</div><div class="val">'+(cat['Fin de contrato']||0)+'</div><div class="sub">'+fmt.p((cat['Fin de contrato']||0)/total)+'</div></div>';
  body += '<div class="kpi amber"><div class="lbl">Controlables LAR</div><div class="val">'+tipoCount.controlable+'</div><div class="sub">'+fmt.p(tipoCount.controlable/total)+'</div></div>';
  body += '<div class="kpi"><div class="lbl">UF Desactivadas</div><div class="val">'+fmt.u(ufTotal)+'</div><div class="sub">acumulado</div></div>';
  body += '</div>';

  body += '<div class="info-box '+(p==='Bellet'?'warn':p==='IMU'?'amber':'gris')+'"><strong>Hallazgo · '+p+'</strong>'+insights[p]+'</div>';

  body += '<div class="split-2"><div><div class="section-title">Por Categoría</div><div class="chart-wrap tall"><canvas id="cS1_'+p+'"></canvas></div></div>';
  body += '<div><div class="section-title">Atribución</div><div class="chart-wrap tall"><canvas id="cS2_'+p+'"></canvas></div></div></div>';

  body += '<div class="section-title">Detalle por Categoría</div>';
  body += '<table class="lar"><thead><tr><th class="left">Categoría</th><th>Casos</th><th>%</th><th>UF</th><th>UF prom.</th><th>Atribución</th></tr></thead><tbody>';
  sorted.forEach(([c, n]) => {
    const t = CAT_TIPO[c] || 'otros';
    const uf = ufByCat[c] || 0;
    body += '<tr><td class="left">'+c+'</td><td><strong>'+n+'</strong></td><td>'+fmt.p(n/total)+'</td><td>'+fmt.u(uf)+'</td><td>'+fmt.u(n>0?uf/n:0)+'</td><td><span class="badge b-'+t+'">'+t+'</span></td></tr>';
  });
  body += '<tr class="totales"><td class="left">TOTAL</td><td>'+total+'</td><td>100%</td><td>'+fmt.u(ufTotal)+'</td><td>'+fmt.u(ufTotal/total)+'</td><td></td></tr>';
  body += '</tbody></table>';

  body += '<div class="section-title">Top departamentos por UF perdida</div>';
  body += '<table class="lar"><thead><tr><th class="left">Depto</th><th>Mes</th><th>UF</th><th>Categoría</th><th>Perfil</th><th>País</th><th>Atribución</th></tr></thead><tbody>';
  topUF.forEach(r => {
    const t = CAT_TIPO[r[4]] || 'otros';
    body += '<tr><td class="left">'+r[1]+'</td><td>'+r[2]+'</td><td><strong>'+fmt.u(r[3])+'</strong></td><td>'+r[4]+'</td><td>'+(r[5]||'—')+'</td><td>'+(r[6]||'—')+'</td><td><span class="badge b-'+t+'">'+t+'</span></td></tr>';
  });
  body += '</tbody></table>';

  return shell('Análisis Salidas Anticipadas <strong>'+p+'</strong>', 'Causa raíz · Categorización · Atribución', body);
}

function chartSal(p) {
  const recs = SALIDAS.filter(r => r[0] === p);
  const cat = {};
  const tipoCount = { Controlable:0, 'Ciclo vida':0, 'Gestión interna':0, 'Fin contrato':0, Otros:0 };
  recs.forEach(r => {
    cat[r[4]] = (cat[r[4]] || 0) + 1;
    const t = CAT_TIPO[r[4]] || 'otros';
    if (t === 'controlable') tipoCount.Controlable++;
    else if (t === 'vida') tipoCount['Ciclo vida']++;
    else if (t === 'interno') tipoCount['Gestión interna']++;
    else if (t === 'fin') tipoCount['Fin contrato']++;
    else tipoCount.Otros++;
  });
  const sorted = Object.entries(cat).sort((a,b) => b[1]-a[1]);

  const ctx1 = document.getElementById('cS1_'+p);
  if (ctx1) {
    const colors = sorted.map(([c]) => {
      const t = CAT_TIPO[c] || 'otros';
      return t==='controlable'?'#B23A48':t==='vida'?'#D4A017':t==='interno'?'#00A8B4':t==='fin'?'#747678':'#B5B6B7';
    });
    charts['cS1_'+p] = new Chart(ctx1, {
      type:'bar',
      data:{ labels:sorted.map(c=>c[0]), datasets:[{ data:sorted.map(c=>c[1]), backgroundColor:colors }] },
      options:{ responsive:true, maintainAspectRatio:false, indexAxis:'y', plugins:{legend:{display:false}}, scales:{x:{beginAtZero:true}} }
    });
  }

  const ctx2 = document.getElementById('cS2_'+p);
  if (ctx2) {
    const labels = Object.keys(tipoCount).filter(k => tipoCount[k] > 0);
    const data = labels.map(k => tipoCount[k]);
    const colors = labels.map(k => k==='Controlable'?'#B23A48':k==='Ciclo vida'?'#D4A017':k==='Gestión interna'?'#00A8B4':k==='Fin contrato'?'#747678':'#B5B6B7');
    charts['cS2_'+p] = new Chart(ctx2, {
      type:'doughnut',
      data:{ labels, datasets:[{ data, backgroundColor:colors, borderWidth:2, borderColor:'white' }] },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'right'}} }
    });
  }
}

// ===== SUMMARY =====
function buildSummary() {
  const sums = PROJECTS.map(p => {
    const v = VENC[p], o = OCUP[p], l = LEADS[p];
    const [, ve, re, nr, sR] = trim(v.months, v.kpi['Vencimientos'], v.kpi['Renovaciones'], v.kpi['No Renuevan'], v.kpi['Sin Respuesta']);
    const tV = ve.reduce((a,b)=>a+(b||0),0);
    const tR = re.reduce((a,b)=>a+(b||0),0);
    const tNR = nr.reduce((a,b)=>a+(b||0),0);
    const tSR = sR.reduce((a,b)=>a+(b||0),0);
    const oArr = o.ytd['Ocupación %'];
    const aArr = o.ytd['Unidades Arrendadas'];
    const tArr = o.ytd['Unidades Totales'];
    const [, res] = trim(l.months, l.metrics['Reservas mensuales']);
    return { p, totU:tArr[tArr.length-1], lastA:aArr[aArr.length-1], lastO:oArr[oArr.length-1],
      totRes: res.reduce((a,b)=>a+(b||0),0), tV, tR, tNR, tSR, tasa: tV?tR/tV:0 };
  });
  const tU = sums.reduce((a,r)=>a+r.totU,0);
  const tA = sums.reduce((a,r)=>a+r.lastA,0);
  const tRes = sums.reduce((a,r)=>a+r.totRes,0);
  const tV = sums.reduce((a,r)=>a+r.tV,0);
  const tR = sums.reduce((a,r)=>a+r.tR,0);
  const tNR = sums.reduce((a,r)=>a+r.tNR,0);
  const tSR = sums.reduce((a,r)=>a+r.tSR,0);
  const tasa = tV ? tR/tV : 0;

  let body = '<div class="kpis">';
  body += '<div class="kpi dark"><div class="lbl">Cartera total</div><div class="val">'+tU+'</div><div class="sub">3 proyectos</div></div>';
  body += '<div class="kpi"><div class="lbl">Arrendadas</div><div class="val">'+tA+'</div><div class="sub">'+fmt.p(tA/tU)+' ocupación</div></div>';
  body += '<div class="kpi"><div class="lbl">Reservas período</div><div class="val">'+tRes+'</div></div>';
  body += '<div class="kpi gris"><div class="lbl">Tasa Retención</div><div class="val">'+fmt.p(tasa)+'</div><div class="sub">'+tR+'/'+tV+'</div></div>';
  body += '<div class="kpi '+(tSR>0?'warn':'gris')+'"><div class="lbl">Sin Respuesta</div><div class="val">'+tSR+'</div></div>';
  body += '</div>';

  body += '<table class="lar"><thead><tr><th class="left">Proyecto</th><th>Unidades</th><th>Arrendadas</th><th>Ocupación</th><th>Reservas Per.</th><th>Vencim.</th><th>Renueva</th><th>No Ren.</th><th>Sin Resp.</th><th>Retención</th></tr></thead><tbody>';
  sums.forEach(r => {
    body += '<tr><td class="left">'+r.p+'</td><td>'+r.totU+'</td><td>'+r.lastA+'</td><td>'+fmt.p(r.lastO)+'</td><td>'+r.totRes+'</td><td>'+r.tV+'</td><td>'+r.tR+'</td><td>'+r.tNR+'</td><td'+(r.tSR>0?' style="color:#B23A48;font-weight:700"':'')+'>'+r.tSR+'</td><td>'+fmt.p(r.tasa)+'</td></tr>';
  });
  body += '<tr class="totales"><td class="left">CONSOLIDADO</td><td>'+tU+'</td><td>'+tA+'</td><td>'+fmt.p(tA/tU)+'</td><td>'+tRes+'</td><td>'+tV+'</td><td>'+tR+'</td><td>'+tNR+'</td><td>'+tSR+'</td><td>'+fmt.p(tasa)+'</td></tr>';
  body += '</tbody></table>';

  body += '<div class="split-2"><div><div class="section-title">Ocupación por proyecto</div><div class="chart-wrap"><canvas id="cSum1"></canvas></div></div>';
  body += '<div><div class="section-title">Tasa Retención</div><div class="chart-wrap"><canvas id="cSum2"></canvas></div></div></div>';

  return shell('Resumen Comercial <strong>CCLA</strong>', 'Holley · Bellet · IMU · Status al 07-05-2026', body);
}

function chartSummary() {
  const sums = PROJECTS.map(p => {
    const o = OCUP[p];
    const oA = o.ytd['Ocupación %'];
    const pA = o.ytd['Ocup. PPTO %'];
    const v = VENC[p];
    const [, ve, re] = trim(v.months, v.kpi['Vencimientos'], v.kpi['Renovaciones']);
    const tV = ve.reduce((a,b)=>a+(b||0),0);
    const tR = re.reduce((a,b)=>a+(b||0),0);
    return { p, ocup:oA[oA.length-1], ppt:pA[pA.length-1], tasa: tV?tR/tV:0 };
  });
  const c1 = document.getElementById('cSum1');
  if (c1) {
    charts.cSum1 = new Chart(c1, {
      type:'bar',
      data:{ labels:sums.map(s=>s.p), datasets:[
        {label:'Real', data:sums.map(s=>+(s.ocup*100).toFixed(1)), backgroundColor:'#00A8B4'},
        {label:'PPTO', data:sums.map(s=>+(s.ppt*100).toFixed(1)), backgroundColor:'#747678'}
      ]},
      options:{ responsive:true, maintainAspectRatio:false, scales:{y:{min:0,max:100,ticks:{callback:v=>v+'%'}}}, plugins:{legend:{position:'top'}} }
    });
  }
  const c2 = document.getElementById('cSum2');
  if (c2) {
    charts.cSum2 = new Chart(c2, {
      type:'bar',
      data:{ labels:sums.map(s=>s.p), datasets:[{ data:sums.map(s=>+(s.tasa*100).toFixed(1)), backgroundColor:'#00A8B4' }]},
      options:{ responsive:true, maintainAspectRatio:false, indexAxis:'y', scales:{x:{min:0,max:100,ticks:{callback:v=>v+'%'}}}, plugins:{legend:{display:false}} }
    });
  }
}

// ===== RENDER =====
function render() {
  destroyCharts();
  const c = document.getElementById('slidesContainer');
  const ps = state.proy === 'Todos' ? PROJECTS : [state.proy];
  const vs = state.view === 'Todos' ? ['Leads','Ocupación','Vencimientos','Salidas Anticipadas'] : [state.view];

  let html = '';
  if (state.proy === 'Todos' && state.view === 'Todos') html += buildSummary();
  vs.forEach(v => {
    ps.forEach(p => {
      if (v === 'Leads') html += buildLeads(p);
      else if (v === 'Ocupación') html += buildOcup(p);
      else if (v === 'Vencimientos') html += buildVenc(p);
      else if (v === 'Salidas Anticipadas') html += buildSal(p);
    });
  });
  c.innerHTML = html;

  if (state.proy === 'Todos' && state.view === 'Todos') chartSummary();
  vs.forEach(v => {
    ps.forEach(p => {
      if (v === 'Leads') chartLeads(p);
      else if (v === 'Ocupación') chartOcup(p);
      else if (v === 'Vencimientos') chartVenc(p);
      else if (v === 'Salidas Anticipadas') chartSal(p);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('resetBtn').onclick = () => {
    state.proy = 'Todos'; state.view = 'Todos'; state.per = '7m';
    buildTabs();
    render();
  };
  document.getElementById('printBtn').onclick = function() { window.print(); };
  buildTabs();
  render();
});

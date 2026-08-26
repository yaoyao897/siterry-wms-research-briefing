/**
 * 思特瑞 WMS Demo · PC / APP 同源联动存储
 * - localStorage 持久化单据状态、在途、流水
 * - BroadcastChannel('wms-demo') + storage 事件跨页实时刷新
 * - 统一业务主键（运单号 / 入库单号等）两端共用
 */
window.WMS_DEMO_STORE = (function () {
  const STORAGE_KEY = 'wms-demo-store-v1';
  const CHANNEL = 'wms-demo';

  /** APP ↔ PC 状态文案对齐 */
  const STATUS_TO_PC = {
    待执行: '待执行',
    执行中: '执行中',
    已完成: '已完成',
    已关闭: '已关闭',
    待发运: '待运输',
    待派车: '待派车',
    待运输: '待运输',
    发运中: '运输中',
    运输中: '运输中',
    已签收: '已完成',
    已到达: '已完成',
    待结算: '已完成',
    待放行: '待放行',
    已放行: '已放行',
  };
  const STATUS_TO_APP = {
    待执行: '待执行',
    执行中: '执行中',
    已完成: '已完成',
    已关闭: '已关闭',
    待发运: '待运输',
    待派车: '待派车',
    待运输: '待运输',
    运输中: '运输中',
    发运中: '运输中',
    已签收: '已签收',
    已到达: '已签收',
    待结算: '已签收',
    待放行: '待放行',
    已放行: '已完成',
  };

  function emptyState() {
    return {
      version: 1,
      updatedAt: '',
      docs: {},
      enroute: {},
      flows: [],
      inventory: {},
      points: {},
      /** APP 采购入库 → PC wh-po-in 三 Tab 联动缓存 */
      whPoIn: { notices: {}, tab2: {}, tab3: {}, drafts: {} },
      whPoRet: { notices: {}, tab2: {}, tab3: {}, drafts: {} },
      whOsIssue: { notices: {}, tab2: {}, tab3: {}, drafts: {} },
      whProdIssue: { notices: {}, tab2: {}, tab3: {}, drafts: {} },
      whProdRet: { notices: {}, tab2: {}, tab3: {}, drafts: {} },
      whOsRetMat: { notices: {}, tab2: {}, tab3: {}, drafts: {} },
      whOsRecv: { notices: {}, tab2: {}, tab3: {}, drafts: {} },
      whOsRetGoods: { notices: {}, tab2: {}, tab3: {}, drafts: {} },
    };
  }

  function nowStr() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return emptyState();
      const parsed = JSON.parse(raw);
      return Object.assign(emptyState(), parsed || {});
    } catch (e) {
      return emptyState();
    }
  }

  let channel = null;
  try {
    channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null;
  } catch (e) {
    channel = null;
  }

  function save(state, reason) {
    state.updatedAt = nowStr();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('[WMS_DEMO_STORE] localStorage 写入失败', e);
    }
    const payload = { type: 'sync', reason: reason || 'update', at: state.updatedAt };
    try {
      channel && channel.postMessage(payload);
    } catch (e) { /* ignore */ }
    try {
      window.dispatchEvent(new CustomEvent('wms-demo-sync', { detail: payload }));
    } catch (e) { /* ignore */ }
    return state;
  }

  function mutate(fn, reason) {
    const state = load();
    fn(state);
    return save(state, reason);
  }

  function setDocStatus(docId, status, extra) {
    if (!docId) return load();
    return mutate((s) => {
      const prev = s.docs[docId] || {};
      s.docs[docId] = Object.assign({}, prev, extra || {}, {
        id: docId,
        status: status,
        updatedAt: nowStr(),
        source: (extra && extra.source) || prev.source || 'APP',
      });
    }, 'doc-status');
  }

  function patchDoc(docId, patch) {
    if (!docId) return load();
    return mutate((s) => {
      const prev = s.docs[docId] || { id: docId };
      s.docs[docId] = Object.assign({}, prev, patch || {}, {
        id: docId,
        updatedAt: nowStr(),
      });
    }, 'doc-patch');
  }

  function getDoc(docId) {
    if (!docId) return null;
    return load().docs[docId] || null;
  }

  function appendEnroute(waybillId, record) {
    if (!waybillId || !record) return load();
    return mutate((s) => {
      const list = s.enroute[waybillId] ? s.enroute[waybillId].slice() : [];
      const stamp = nowStr();
      const row = Object.assign({
        打卡时间: stamp.slice(0, 16),
        打卡位置: '',
        现场照片: '—',
        打卡备注: '—',
        记录时间: stamp,
        当前位置: '',
        行驶状态: '正常行驶',
        预计到达时间: '—',
        途经事件: '无异常',
        备注: '—',
        操作人: 'APP司机',
        照片: '0',
        经纬度: '—',
        工序摘要: '—',
      }, record);
      if (!row['打卡位置'] && row['当前位置']) row['打卡位置'] = row['当前位置'];
      if (!row['当前位置'] && row['打卡位置']) row['当前位置'] = row['打卡位置'];
      if (!row['打卡备注'] && row['备注']) row['打卡备注'] = row['备注'];
      if (!row['备注'] && row['打卡备注']) row['备注'] = row['打卡备注'];
      list.unshift(row);
      s.enroute[waybillId] = list.slice(0, 50);
      const prev = s.docs[waybillId] || { id: waybillId };
      s.docs[waybillId] = Object.assign({}, prev, {
        id: waybillId,
        status: prev.status || '运输中',
        lastEnroute: row['打卡位置'] || row['当前位置'],
        预计到货时间: record.预计送达时间 || prev.预计到货时间 || '',
        updatedAt: nowStr(),
        source: 'APP',
      });
    }, 'enroute');
  }

  function getEnroute(waybillId) {
    if (!waybillId) return [];
    return (load().enroute[waybillId] || []).slice();
  }

  function setPointStatus(waybillId, pointId, status, extra) {
    if (!waybillId || !pointId) return load();
    const key = waybillId + '::' + pointId;
    return mutate((s) => {
      s.points[key] = Object.assign({}, s.points[key] || {}, extra || {}, {
        waybillId: waybillId,
        pointId: pointId,
        status: status,
        updatedAt: nowStr(),
      });
    }, 'point-status');
  }

  function getPoint(waybillId, pointId) {
    if (!waybillId || !pointId) return null;
    return load().points[waybillId + '::' + pointId] || null;
  }

  function appendFlow(entry) {
    return mutate((s) => {
      const row = Object.assign({
        id: 'FL-' + Date.now(),
        at: nowStr(),
        source: 'APP',
        docId: '',
        type: '操作',
        summary: '',
      }, entry || {});
      s.flows.unshift(row);
      s.flows = s.flows.slice(0, 200);
    }, 'flow');
  }

  function getFlows(docId) {
    const flows = load().flows || [];
    if (!docId) return flows.slice();
    return flows.filter((f) => f.docId === docId);
  }

  function bumpInventory(sku, delta, extra) {
    if (!sku) return load();
    return mutate((s) => {
      const prev = s.inventory[sku] || { sku: sku, qty: 0 };
      s.inventory[sku] = Object.assign({}, prev, extra || {}, {
        sku: sku,
        qty: Number(prev.qty || 0) + Number(delta || 0),
        updatedAt: nowStr(),
      });
    }, 'inventory');
  }

  function getInventory(sku) {
    const inv = load().inventory || {};
    return sku ? (inv[sku] || null) : Object.assign({}, inv);
  }

  /** PC 列表行叠加共享状态 */
  function overlayPcRow(pageId, row) {
    if (!row) return row;
    if (pageId === 'lg-ship' || pageId === 'lg-pickup' || pageId === 'lg-sign') return row;
    const id =
      row['运单号'] ||
      row['出门条单号'] ||
      row['提货单号'] ||
      row['签收单号'] ||
      row['入库单号'] ||
      row['单号'] ||
      row['派车申请单号'] ||
      row['发货单号'] ||
      row['编号'] ||
      row.id;
    const doc = getDoc(id);
    if (!doc) return row;
    const next = Object.assign({}, row);
    if (doc.status) {
      const pcStatus = STATUS_TO_PC[doc.status] || doc.status;
      if (pageId === 'lg-gatepass') {
        next['出门条状态'] = doc.status === '已完成' ? '已放行' : (pcStatus || doc.status);
        if (doc.放行时间) next['放行时间'] = doc.放行时间;
        if (doc.放行人) next['放行人'] = doc.放行人;
      } else if (pageId === 'lg-waybill' || pageId === 'lg-waybill-carrier') {
        // 已关闭以 PC 关闭为准；已完成可被 APP 签收推进，但结算态由 PC 结算锁定
        if (next['状态'] !== undefined && next['状态'] !== '已关闭') {
          if (!['已完成'].includes(next['状态']) || ['已签收', '已到达', '待结算'].includes(doc.status)) {
            next['状态'] = pcStatus;
          }
        }
        // APP 签收完成 → 运单已完成 + 结算待结算；PC 已结算不回退
        if (['已签收', '已到达', '待结算'].includes(doc.status)) {
          if (next['结算状态'] !== '已结算') next['结算状态'] = '待结算';
          if (next['状态'] !== '已关闭') next['状态'] = '已完成';
        }
        if (doc.status === '已完成' && (doc.action === 'settle' || doc.结算状态 === '已结算')) {
          next['结算状态'] = '已结算';
          if (next['状态'] !== '已关闭') next['状态'] = '已完成';
        }
      } else if (next['单据状态'] !== undefined) {
        next['单据状态'] = pcStatus;
      } else if (next['状态'] !== undefined) {
        next['状态'] = pcStatus;
      }
    }
    if (doc.lastEnroute && next['备注'] !== undefined && (pageId === 'lg-waybill' || pageId === 'lg-waybill-carrier')) {
      next['备注'] = 'APP在途：' + doc.lastEnroute;
    }
    if ((pageId === 'lg-waybill' || pageId === 'lg-waybill-carrier') && doc.预计到货时间) {
      next['预计到货时间'] = doc.预计到货时间;
    }
    if ((pageId === 'lg-waybill' || pageId === 'lg-waybill-carrier') && doc.实际装货时间) {
      next['实际装货时间'] = doc.实际装货时间;
    }
    if ((pageId === 'lg-waybill' || pageId === 'lg-waybill-carrier') && doc.实际到货时间) {
      next['实际到货时间'] = doc.实际到货时间;
    }
    if (pageId === 'lg-waybill' || pageId === 'lg-waybill-carrier') {
      const fleetKeys = [
        '车牌号', '车挂号', '司机姓名', '司机电话', '驾驶证号', '从业资格证号',
        '押运员姓名', '押运员资格证号',
        '送货车牌号（专线）', '送货车挂号（专线）', '送货司机（专线）', '送货司机电话（专线）', '送货中转备注',
      ];
      fleetKeys.forEach(function (k) {
        if (doc[k] !== undefined && doc[k] !== null && doc[k] !== '') next[k] = doc[k];
      });
    }
    return next;
  }

  /** APP 单据叠加共享状态 */
  function overlayAppDoc(doc) {
    if (!doc || !doc.id) return doc;
    const hit = getDoc(doc.id);
    if (!hit) return doc;
    const next = doc;
    if (hit.status) next.status = STATUS_TO_APP[hit.status] || hit.status;
    if (hit.放行时间) next.releaseAt = hit.放行时间;
    if (hit.放行人) next.releaseBy = hit.放行人;
    if (hit.预计到货时间) next.eta = hit.预计到货时间;
    if (hit.lastEnroute) {
      next.enroute = Object.assign({}, next.enroute || {}, {
        location: hit.lastEnroute,
        updatedAt: hit.updatedAt || (next.enroute && next.enroute.updatedAt) || '',
        remark: (next.enroute && next.enroute.remark) || 'APP已同步',
      });
    }
    if (hit.车牌号 !== undefined) next.plate = hit.车牌号 === '—' ? '' : hit.车牌号;
    if (hit.车挂号 !== undefined) next.trailer = hit.车挂号 === '—' ? '' : hit.车挂号;
    if (hit.司机姓名 !== undefined) next.driver = hit.司机姓名 === '—' ? '' : hit.司机姓名;
    if (hit.司机电话 !== undefined) next.phone = hit.司机电话 === '—' ? '' : hit.司机电话;
    if (hit.驾驶证号 !== undefined) next.licenseNo = hit.驾驶证号 === '—' ? '' : hit.驾驶证号;
    if (hit.从业资格证号 !== undefined) next.certNo = hit.从业资格证号 === '—' ? '' : hit.从业资格证号;
    if (hit.押运员姓名 !== undefined) next.escort = hit.押运员姓名 === '—' ? '' : hit.押运员姓名;
    if (hit.押运员资格证号 !== undefined) next.escortCert = hit.押运员资格证号 === '—' ? '' : hit.押运员资格证号;
    if (hit['送货车牌号（专线）'] !== undefined) next.secondaryPlate = hit['送货车牌号（专线）'] === '—' ? '' : hit['送货车牌号（专线）'];
    if (hit['送货车挂号（专线）'] !== undefined) next.secondaryTrailer = hit['送货车挂号（专线）'] === '—' ? '' : hit['送货车挂号（专线）'];
    if (hit['送货司机（专线）'] !== undefined) next.secondaryDriver = hit['送货司机（专线）'] === '—' ? '' : hit['送货司机（专线）'];
    if (hit['送货司机电话（专线）'] !== undefined) next.secondaryPhone = hit['送货司机电话（专线）'] === '—' ? '' : hit['送货司机电话（专线）'];
    if (hit['送货中转备注'] !== undefined) next.secondaryRemark = hit['送货中转备注'] === '—' ? '' : hit['送货中转备注'];
    if (Array.isArray(next.loads)) {
      next.loads.forEach((p) => {
        const pt = getPoint(doc.id, p.id);
        if (pt && pt.status) p.status = pt.status;
      });
    }
    if (Array.isArray(next.unloads)) {
      next.unloads.forEach((p) => {
        const pt = getPoint(doc.id, p.id);
        if (pt && pt.status) p.status = pt.status;
      });
    }
    return next;
  }

  function hydrateAppDocs(list) {
    if (!Array.isArray(list)) return list;
    list.forEach((d) => overlayAppDoc(d));
    return list;
  }

  function getEnrouteForPc(pageId, row) {
    const id = (row && (row['运单号'] || row['派车申请单号'] || row.id)) || '';
    const list = getEnroute(id);
    if (list.length) return list;
    return null;
  }

  function ensureWhPoIn(s) {
    if (!s.whPoIn) s.whPoIn = { notices: {}, tab2: {}, tab3: {}, drafts: {} };
    if (!s.whPoIn.notices) s.whPoIn.notices = {};
    if (!s.whPoIn.tab2) s.whPoIn.tab2 = {};
    if (!s.whPoIn.tab3) s.whPoIn.tab3 = {};
    if (!s.whPoIn.drafts) s.whPoIn.drafts = {};
    return s.whPoIn;
  }

  /**
   * APP 采购入库写入 PC 同源缓存
   * payload: {
   *   noticeId, noticeStatus, noticeRow?, noticeLines?,
   *   rkId, rkStatus, rkRow,
   *   flowRows: [{ key?, ...tab3 fields }],
   *   draftKey?, draft?, clearDraft?
   * }
   */
  function upsertWhPoInFromApp(payload) {
    if (!payload || !payload.noticeId) return load();
    return mutate((s) => {
      const wp = ensureWhPoIn(s);
      const noticeId = payload.noticeId;
      const prevNotice = wp.notices[noticeId] || {};
      wp.notices[noticeId] = Object.assign({}, prevNotice, {
        status: payload.noticeStatus || prevNotice.status,
        lines: payload.noticeLines || prevNotice.lines,
        row: payload.noticeRow || prevNotice.row,
        updatedAt: nowStr(),
      });
      if (payload.rkId && payload.rkRow) {
        const prevRk = wp.tab2[payload.rkId] || {};
        wp.tab2[payload.rkId] = Object.assign({}, prevRk, payload.rkRow, {
          入库单号: payload.rkId,
          单据状态: payload.rkStatus || payload.rkRow['单据状态'] || prevRk['单据状态'] || '执行中',
          关联收料通知单号: noticeId,
          updatedAt: nowStr(),
        });
      }
      (payload.flowRows || []).forEach(function (fr) {
        if (!fr) return;
        const key = fr.key || ((fr['入库单号'] || payload.rkId || '') + '::' + (fr['条码号'] || ''));
        if (!key || key === '::') return;
        const prev = wp.tab3[key] || {};
        wp.tab3[key] = Object.assign({}, prev, fr, {
          key: key,
          入库单号: fr['入库单号'] || payload.rkId || prev['入库单号'],
          通知单号: fr['通知单号'] || noticeId,
          流水状态: fr['流水状态'] || payload.rkStatus || prev['流水状态'] || '执行中',
          updatedAt: nowStr(),
        });
      });
      if (payload.clearDraft && payload.draftKey) {
        delete wp.drafts[payload.draftKey];
      } else if (payload.draftKey && payload.draft) {
        wp.drafts[payload.draftKey] = Object.assign({}, payload.draft, { updatedAt: nowStr() });
      }
      s.docs[noticeId] = Object.assign({}, s.docs[noticeId] || {}, {
        id: noticeId,
        status: payload.noticeStatus || (s.docs[noticeId] && s.docs[noticeId].status) || '执行中',
        source: 'APP',
        updatedAt: nowStr(),
        action: payload.action || 'po-in',
      });
      if (payload.rkId) {
        s.docs[payload.rkId] = Object.assign({}, s.docs[payload.rkId] || {}, {
          id: payload.rkId,
          status: payload.rkStatus || '执行中',
          noticeId: noticeId,
          source: 'APP',
          updatedAt: nowStr(),
          action: payload.action || 'po-in',
        });
      }
    }, payload.action || 'wh-po-in');
  }

  function getWhPoInDraft(draftKey) {
    if (!draftKey) return null;
    const wp = load().whPoIn || {};
    return (wp.drafts && wp.drafts[draftKey]) || null;
  }

  function clearWhPoInDraft(draftKey) {
    if (!draftKey) return load();
    return mutate((s) => {
      const wp = ensureWhPoIn(s);
      delete wp.drafts[draftKey];
    }, 'wh-po-in-draft-clear');
  }

  /** 将 APP 写入的采购入库缓存合并进 PC MOCK['wh-po-in'] */
  function applyWhPoInToMock(MOCK) {
    if (!MOCK || !MOCK['wh-po-in']) return false;
    const wp = load().whPoIn;
    if (!wp) return false;
    let changed = false;
    const page = MOCK['wh-po-in'];
    page.tab1 = page.tab1 || [];
    page.tab2 = page.tab2 || [];
    page.tab3 = page.tab3 || [];

    Object.keys(wp.notices || {}).forEach(function (noticeId) {
      const patch = wp.notices[noticeId];
      let row = page.tab1.find(function (r) { return String(r['单号'] || '') === noticeId; });
      if (!row && patch.row) {
        row = Object.assign({ id: String(page.tab1.length + 1) }, patch.row);
        page.tab1.unshift(row);
        changed = true;
      }
      if (!row) return;
      if (patch.status && row['单据状态'] !== patch.status) {
        row['单据状态'] = patch.status;
        changed = true;
      }
      if (Array.isArray(patch.lines) && Array.isArray(row._lines)) {
        patch.lines.forEach(function (ln) {
          const hit = row._lines.find(function (x) {
            const mat = String(x['物料信息'] || '');
            const code = String(ln.code || '');
            return String(x.id || '') === String(ln.id || '')
              || (code && mat.indexOf(code) === 0)
              || (ln.lineNo != null && (
                String(x.id || '').endsWith('-l' + ln.lineNo)
                || String(x.id || '') === String(ln.lineNo)
              ));
          });
          if (!hit) return;
          if (ln.status) hit['行状态'] = ln.status;
          if (ln.doneQty != null) hit['已完成数量'] = Number(ln.doneQty).toFixed(2);
          if (ln.remainQty != null) hit['未完成数量'] = Number(ln.remainQty).toFixed(2);
          changed = true;
        });
      } else if (Array.isArray(patch.lines) && patch.row && Array.isArray(patch.row._lines)) {
        row._lines = JSON.parse(JSON.stringify(patch.row._lines));
        changed = true;
      }
    });

    Object.keys(wp.tab2 || {}).forEach(function (rkId) {
      const src = wp.tab2[rkId];
      const idx = page.tab2.findIndex(function (r) { return String(r['入库单号'] || '') === rkId; });
      if (idx >= 0) {
        page.tab2[idx] = Object.assign({}, page.tab2[idx], src, { 入库单号: rkId });
      } else {
        page.tab2.unshift(Object.assign({ id: String(page.tab2.length + 1) }, src, { 入库单号: rkId }));
      }
      changed = true;
    });

    Object.keys(wp.tab3 || {}).forEach(function (key) {
      const src = wp.tab3[key];
      const barcode = src['条码号'];
      const rkId = src['入库单号'];
      const idx = page.tab3.findIndex(function (r) {
        return String(r['条码号'] || '') === String(barcode || '')
          && String(r['入库单号'] || '') === String(rkId || '');
      });
      if (idx >= 0) {
        page.tab3[idx] = Object.assign({}, page.tab3[idx], src);
      } else {
        page.tab3.unshift(Object.assign({ id: String(page.tab3.length + 1) }, src));
      }
      changed = true;
    });

    return changed;
  }

  function ensureWhPoRet(s) {
    if (!s.whPoRet) s.whPoRet = { notices: {}, tab2: {}, tab3: {}, drafts: {} };
    if (!s.whPoRet.notices) s.whPoRet.notices = {};
    if (!s.whPoRet.tab2) s.whPoRet.tab2 = {};
    if (!s.whPoRet.tab3) s.whPoRet.tab3 = {};
    if (!s.whPoRet.drafts) s.whPoRet.drafts = {};
    return s.whPoRet;
  }

  /**
   * APP 采购退料出库写入 PC 同源缓存
   * payload: {
   *   noticeId, noticeStatus, noticeRow?, noticeLines?,
   *   ckId, ckStatus, ckRow,
   *   flowRows: [{ key?, ...tab3 fields }],
   *   draftKey?, draft?, clearDraft?
   * }
   */
  function upsertWhPoRetFromApp(payload) {
    if (!payload || !payload.noticeId) return load();
    return mutate((s) => {
      const wp = ensureWhPoRet(s);
      const noticeId = payload.noticeId;
      const prevNotice = wp.notices[noticeId] || {};
      wp.notices[noticeId] = Object.assign({}, prevNotice, {
        status: payload.noticeStatus || prevNotice.status,
        lines: payload.noticeLines || prevNotice.lines,
        row: payload.noticeRow || prevNotice.row,
        updatedAt: nowStr(),
      });
      if (payload.ckId && payload.ckRow) {
        const prevCk = wp.tab2[payload.ckId] || {};
        wp.tab2[payload.ckId] = Object.assign({}, prevCk, payload.ckRow, {
          出库单号: payload.ckId,
          单据状态: payload.ckStatus || payload.ckRow['单据状态'] || prevCk['单据状态'] || '执行中',
          关联退料通知单号: noticeId,
          updatedAt: nowStr(),
        });
      }
      (payload.flowRows || []).forEach(function (fr) {
        if (!fr) return;
        const key = fr.key || ((fr['出库单号'] || payload.ckId || '') + '::' + (fr['条码号'] || ''));
        if (!key || key === '::') return;
        const prev = wp.tab3[key] || {};
        wp.tab3[key] = Object.assign({}, prev, fr, {
          key: key,
          出库单号: fr['出库单号'] || payload.ckId || prev['出库单号'],
          通知单号: fr['通知单号'] || noticeId,
          流水状态: fr['流水状态'] || payload.ckStatus || prev['流水状态'] || '执行中',
          updatedAt: nowStr(),
        });
      });
      if (payload.clearDraft && payload.draftKey) {
        delete wp.drafts[payload.draftKey];
      } else if (payload.draftKey && payload.draft) {
        wp.drafts[payload.draftKey] = Object.assign({}, payload.draft, { updatedAt: nowStr() });
      }
      s.docs[noticeId] = Object.assign({}, s.docs[noticeId] || {}, {
        id: noticeId,
        status: payload.noticeStatus || (s.docs[noticeId] && s.docs[noticeId].status) || '执行中',
        source: 'APP',
        updatedAt: nowStr(),
        action: payload.action || 'po-ret',
      });
      if (payload.ckId) {
        s.docs[payload.ckId] = Object.assign({}, s.docs[payload.ckId] || {}, {
          id: payload.ckId,
          status: payload.ckStatus || '执行中',
          noticeId: noticeId,
          source: 'APP',
          updatedAt: nowStr(),
          action: payload.action || 'po-ret',
        });
      }
    }, payload.action || 'wh-po-ret');
  }

  function getWhPoRetDraft(draftKey) {
    if (!draftKey) return null;
    const wp = load().whPoRet || {};
    return (wp.drafts && wp.drafts[draftKey]) || null;
  }

  function clearWhPoRetDraft(draftKey) {
    if (!draftKey) return load();
    return mutate((s) => {
      const wp = ensureWhPoRet(s);
      delete wp.drafts[draftKey];
    }, 'wh-po-ret-draft-clear');
  }

  /** 将 APP 写入的采购退料出库缓存合并进 PC MOCK['wh-po-ret'] */
  function applyWhPoRetToMock(MOCK) {
    if (!MOCK || !MOCK['wh-po-ret']) return false;
    const wp = load().whPoRet;
    if (!wp) return false;
    let changed = false;
    const page = MOCK['wh-po-ret'];
    page.tab1 = page.tab1 || [];
    page.tab2 = page.tab2 || [];
    page.tab3 = page.tab3 || [];

    Object.keys(wp.notices || {}).forEach(function (noticeId) {
      const patch = wp.notices[noticeId];
      let row = page.tab1.find(function (r) { return String(r['单号'] || '') === noticeId; });
      if (!row && patch.row) {
        row = Object.assign({ id: String(page.tab1.length + 1) }, patch.row);
        page.tab1.unshift(row);
        changed = true;
      }
      if (!row) return;
      if (patch.status && row['单据状态'] !== patch.status) {
        row['单据状态'] = patch.status;
        changed = true;
      }
      if (Array.isArray(patch.lines) && Array.isArray(row._lines)) {
        patch.lines.forEach(function (ln) {
          const hit = row._lines.find(function (x) {
            const mat = String(x['物料信息'] || '');
            const code = String(ln.code || '');
            return String(x.id || '') === String(ln.id || '')
              || (code && mat.indexOf(code) === 0)
              || (ln.lineNo != null && (
                String(x.id || '').endsWith('-l' + ln.lineNo)
                || String(x.id || '') === String(ln.lineNo)
              ));
          });
          if (!hit) return;
          if (ln.status) hit['行状态'] = ln.status;
          if (ln.doneQty != null) hit['已完成数量'] = Number(ln.doneQty).toFixed(2);
          if (ln.remainQty != null) hit['未完成数量'] = Number(ln.remainQty).toFixed(2);
          changed = true;
        });
      } else if (Array.isArray(patch.lines) && patch.row && Array.isArray(patch.row._lines)) {
        row._lines = JSON.parse(JSON.stringify(patch.row._lines));
        changed = true;
      }
    });

    Object.keys(wp.tab2 || {}).forEach(function (ckId) {
      const src = wp.tab2[ckId];
      const idx = page.tab2.findIndex(function (r) { return String(r['出库单号'] || '') === ckId; });
      if (idx >= 0) {
        page.tab2[idx] = Object.assign({}, page.tab2[idx], src, { 出库单号: ckId });
      } else {
        page.tab2.unshift(Object.assign({ id: String(page.tab2.length + 1) }, src, { 出库单号: ckId }));
      }
      changed = true;
    });

    Object.keys(wp.tab3 || {}).forEach(function (key) {
      const src = wp.tab3[key];
      const barcode = src['条码号'];
      const ckId = src['出库单号'];
      const idx = page.tab3.findIndex(function (r) {
        return String(r['条码号'] || '') === String(barcode || '')
          && String(r['出库单号'] || '') === String(ckId || '');
      });
      if (idx >= 0) {
        page.tab3[idx] = Object.assign({}, page.tab3[idx], src);
      } else {
        page.tab3.unshift(Object.assign({ id: String(page.tab3.length + 1) }, src));
      }
      changed = true;
    });

    return changed;
  }

  function ensureWhOsIssue(s) {
    if (!s.whOsIssue) s.whOsIssue = { notices: {}, tab2: {}, tab3: {}, drafts: {} };
    if (!s.whOsIssue.notices) s.whOsIssue.notices = {};
    if (!s.whOsIssue.tab2) s.whOsIssue.tab2 = {};
    if (!s.whOsIssue.tab3) s.whOsIssue.tab3 = {};
    if (!s.whOsIssue.drafts) s.whOsIssue.drafts = {};
    return s.whOsIssue;
  }

  function ensureWhProdIssue(s) {
    if (!s.whProdIssue) s.whProdIssue = { notices: {}, tab2: {}, tab3: {}, drafts: {} };
    if (!s.whProdIssue.notices) s.whProdIssue.notices = {};
    if (!s.whProdIssue.tab2) s.whProdIssue.tab2 = {};
    if (!s.whProdIssue.tab3) s.whProdIssue.tab3 = {};
    if (!s.whProdIssue.drafts) s.whProdIssue.drafts = {};
    return s.whProdIssue;
  }

  /**
   * APP 生产领料出库写入 PC 同源缓存（wh-prod-issue）
   * payload: {
   *   noticeId, noticeStatus, noticeRow?, noticeLines?, skipNotice?,
   *   ckId, ckStatus, ckRow,
   *   flowRows: [{ key?, ...tab3 fields }],
   *   draftKey?, draft?, clearDraft?
   * }
   */
  function upsertWhProdIssueFromApp(payload) {
    if (!payload) return load();
    const skipNotice = !!payload.skipNotice;
    if (!skipNotice && !payload.noticeId) return load();
    if (skipNotice && !payload.ckId) return load();
    return mutate((s) => {
      const wp = ensureWhProdIssue(s);
      const noticeId = payload.noticeId;
      if (!skipNotice && noticeId) {
        const prevNotice = wp.notices[noticeId] || {};
        wp.notices[noticeId] = Object.assign({}, prevNotice, {
          status: payload.noticeStatus || prevNotice.status,
          lines: payload.noticeLines || prevNotice.lines,
          row: payload.noticeRow || prevNotice.row,
          updatedAt: nowStr(),
        });
      }
      if (payload.ckId && payload.ckRow) {
        const prevCk = wp.tab2[payload.ckId] || {};
        const linkNotice = skipNotice
          ? (payload.ckRow['关联领料申请单号'] || '—')
          : noticeId;
        wp.tab2[payload.ckId] = Object.assign({}, prevCk, payload.ckRow, {
          出库单号: payload.ckId,
          单据状态: payload.ckStatus || payload.ckRow['单据状态'] || prevCk['单据状态'] || '执行中',
          关联领料申请单号: linkNotice,
          updatedAt: nowStr(),
        });
      }
      (payload.flowRows || []).forEach(function (fr) {
        if (!fr) return;
        const key = fr.key || ((fr['出库单号'] || payload.ckId || '') + '::' + (fr['条码号'] || ''));
        if (!key || key === '::') return;
        const prev = wp.tab3[key] || {};
        wp.tab3[key] = Object.assign({}, prev, fr, {
          key: key,
          出库单号: fr['出库单号'] || payload.ckId || prev['出库单号'],
          申请单号: fr['申请单号'] || (skipNotice ? '—' : noticeId),
          流水状态: fr['流水状态'] || payload.ckStatus || prev['流水状态'] || '执行中',
          updatedAt: nowStr(),
        });
      });
      if (payload.clearDraft && payload.draftKey) {
        delete wp.drafts[payload.draftKey];
      } else if (payload.draftKey && payload.draft) {
        wp.drafts[payload.draftKey] = Object.assign({}, payload.draft, { updatedAt: nowStr() });
      }
      if (!skipNotice && noticeId) {
        s.docs[noticeId] = Object.assign({}, s.docs[noticeId] || {}, {
          id: noticeId,
          status: payload.noticeStatus || (s.docs[noticeId] && s.docs[noticeId].status) || '执行中',
          source: 'APP',
          updatedAt: nowStr(),
          action: payload.action || 'prod-pick',
        });
      }
      if (payload.ckId) {
        s.docs[payload.ckId] = Object.assign({}, s.docs[payload.ckId] || {}, {
          id: payload.ckId,
          status: payload.ckStatus || '执行中',
          noticeId: noticeId,
          source: 'APP',
          updatedAt: nowStr(),
          action: payload.action || 'prod-pick',
        });
      }
    }, payload.action || 'wh-prod-issue');
  }

  function getWhProdIssueDraft(draftKey) {
    if (!draftKey) return null;
    const wp = load().whProdIssue || {};
    return (wp.drafts && wp.drafts[draftKey]) || null;
  }

  function clearWhProdIssueDraft(draftKey) {
    if (!draftKey) return load();
    return mutate((s) => {
      const wp = ensureWhProdIssue(s);
      delete wp.drafts[draftKey];
    }, 'wh-prod-issue-draft-clear');
  }

  /** 将 APP 写入的生产领料出库缓存合并进 PC MOCK['wh-prod-issue'] */
  function applyWhProdIssueToMock(MOCK) {
    if (!MOCK || !MOCK['wh-prod-issue']) return false;
    const wp = load().whProdIssue;
    if (!wp) return false;
    let changed = false;
    const page = MOCK['wh-prod-issue'];
    page.tab1 = page.tab1 || [];
    page.tab2 = page.tab2 || [];
    page.tab3 = page.tab3 || [];

    Object.keys(wp.notices || {}).forEach(function (noticeId) {
      const patch = wp.notices[noticeId];
      let row = page.tab1.find(function (r) { return String(r['单号'] || '') === noticeId; });
      if (!row && patch.row) {
        row = Object.assign({ id: String(page.tab1.length + 1) }, patch.row);
        page.tab1.unshift(row);
        changed = true;
      }
      if (!row) return;
      if (patch.status && row['单据状态'] !== patch.status) {
        row['单据状态'] = patch.status;
        changed = true;
      }
      if (Array.isArray(patch.lines) && Array.isArray(row._lines)) {
        patch.lines.forEach(function (ln) {
          const hit = row._lines.find(function (x) {
            const mat = String(x['物料信息'] || '');
            const code = String(ln.code || '');
            return String(x.id || '') === String(ln.id || '')
              || (code && mat.indexOf(code) === 0)
              || (ln.lineNo != null && (
                String(x.id || '').endsWith('-l' + ln.lineNo)
                || String(x.id || '') === String(ln.lineNo)
              ));
          });
          if (!hit) return;
          if (ln.status) hit['行状态'] = ln.status;
          if (ln.doneQty != null) hit['已完成数量'] = Number(ln.doneQty).toFixed(2);
          if (ln.remainQty != null) hit['未完成数量'] = Number(ln.remainQty).toFixed(2);
          changed = true;
        });
      } else if (Array.isArray(patch.lines) && patch.row && Array.isArray(patch.row._lines)) {
        row._lines = JSON.parse(JSON.stringify(patch.row._lines));
        changed = true;
      }
    });

    Object.keys(wp.tab2 || {}).forEach(function (ckId) {
      const src = wp.tab2[ckId];
      const idx = page.tab2.findIndex(function (r) { return String(r['出库单号'] || '') === ckId; });
      if (idx >= 0) {
        page.tab2[idx] = Object.assign({}, page.tab2[idx], src, { 出库单号: ckId });
      } else {
        page.tab2.unshift(Object.assign({ id: String(page.tab2.length + 1) }, src, { 出库单号: ckId }));
      }
      changed = true;
    });

    Object.keys(wp.tab3 || {}).forEach(function (key) {
      const src = wp.tab3[key];
      const barcode = src['条码号'];
      const ckId = src['出库单号'];
      const idx = page.tab3.findIndex(function (r) {
        if (src.key && r.key && String(r.key) === String(src.key)) return true;
        if (barcode && barcode !== '—') {
          return String(r['条码号'] || '') === String(barcode)
            && String(r['出库单号'] || '') === String(ckId || '');
        }
        return String(r['出库单号'] || '') === String(ckId || '')
          && String(r['原位置'] || '') === String(src['原位置'] || '')
          && String(r['物料批号'] || '') === String(src['物料批号'] || '')
          && String(r['档案类型'] || '') === String(src['档案类型'] || '');
      });
      if (idx >= 0) {
        page.tab3[idx] = Object.assign({}, page.tab3[idx], src);
      } else {
        page.tab3.unshift(Object.assign({ id: String(page.tab3.length + 1), key: src.key || key }, src));
      }
      changed = true;
    });

    return changed;
  }

  function ensureWhProdRet(s) {
    if (!s.whProdRet) s.whProdRet = { notices: {}, tab2: {}, tab3: {}, drafts: {} };
    if (!s.whProdRet.notices) s.whProdRet.notices = {};
    if (!s.whProdRet.tab2) s.whProdRet.tab2 = {};
    if (!s.whProdRet.tab3) s.whProdRet.tab3 = {};
    if (!s.whProdRet.drafts) s.whProdRet.drafts = {};
    return s.whProdRet;
  }

  /**
   * APP 生产退料入库写入 PC 同源缓存（wh-prod-ret）
   * payload: {
   *   noticeId, noticeStatus, noticeRow?, noticeLines?,
   *   rkId, rkStatus, rkRow,
   *   flowRows: [{ key?, ...tab3 fields }],
   *   draftKey?, draft?, clearDraft?
   * }
   */
  function upsertWhProdRetFromApp(payload) {
    if (!payload || !payload.noticeId) return load();
    return mutate((s) => {
      const wp = ensureWhProdRet(s);
      const noticeId = payload.noticeId;
      const prevNotice = wp.notices[noticeId] || {};
      wp.notices[noticeId] = Object.assign({}, prevNotice, {
        status: payload.noticeStatus || prevNotice.status,
        lines: payload.noticeLines || prevNotice.lines,
        row: payload.noticeRow || prevNotice.row,
        updatedAt: nowStr(),
      });
      if (payload.rkId && payload.rkRow) {
        const prevRk = wp.tab2[payload.rkId] || {};
        wp.tab2[payload.rkId] = Object.assign({}, prevRk, payload.rkRow, {
          入库单号: payload.rkId,
          单据状态: payload.rkStatus || payload.rkRow['单据状态'] || prevRk['单据状态'] || '执行中',
          关联退料申请单号: noticeId,
          updatedAt: nowStr(),
        });
      }
      (payload.flowRows || []).forEach(function (fr) {
        if (!fr) return;
        const key = fr.key || ((fr['入库单号'] || payload.rkId || '') + '::' + (fr['条码号'] || ''));
        if (!key || key === '::') return;
        const prev = wp.tab3[key] || {};
        wp.tab3[key] = Object.assign({}, prev, fr, {
          key: key,
          入库单号: fr['入库单号'] || payload.rkId || prev['入库单号'],
          申请单号: fr['申请单号'] || noticeId,
          流水状态: fr['流水状态'] || payload.rkStatus || prev['流水状态'] || '执行中',
          updatedAt: nowStr(),
        });
      });
      if (payload.clearDraft && payload.draftKey) {
        delete wp.drafts[payload.draftKey];
      } else if (payload.draftKey && payload.draft) {
        wp.drafts[payload.draftKey] = Object.assign({}, payload.draft, { updatedAt: nowStr() });
      }
      s.docs[noticeId] = Object.assign({}, s.docs[noticeId] || {}, {
        id: noticeId,
        status: payload.noticeStatus || (s.docs[noticeId] && s.docs[noticeId].status) || '执行中',
        source: 'APP',
        updatedAt: nowStr(),
        action: payload.action || 'prod-ret',
      });
      if (payload.rkId) {
        s.docs[payload.rkId] = Object.assign({}, s.docs[payload.rkId] || {}, {
          id: payload.rkId,
          status: payload.rkStatus || '执行中',
          noticeId: noticeId,
          source: 'APP',
          updatedAt: nowStr(),
          action: payload.action || 'prod-ret',
        });
      }
    }, payload.action || 'wh-prod-ret');
  }

  function getWhProdRetDraft(draftKey) {
    if (!draftKey) return null;
    const wp = load().whProdRet || {};
    return (wp.drafts && wp.drafts[draftKey]) || null;
  }

  function clearWhProdRetDraft(draftKey) {
    if (!draftKey) return load();
    return mutate((s) => {
      const wp = ensureWhProdRet(s);
      delete wp.drafts[draftKey];
    }, 'wh-prod-ret-draft-clear');
  }

  /** 将 APP 写入的生产退料入库缓存合并进 PC MOCK['wh-prod-ret'] */
  function applyWhProdRetToMock(MOCK) {
    if (!MOCK || !MOCK['wh-prod-ret']) return false;
    const wp = load().whProdRet;
    if (!wp) return false;
    let changed = false;
    const page = MOCK['wh-prod-ret'];
    page.tab1 = page.tab1 || [];
    page.tab2 = page.tab2 || [];
    page.tab3 = page.tab3 || [];

    Object.keys(wp.notices || {}).forEach(function (noticeId) {
      const patch = wp.notices[noticeId];
      let row = page.tab1.find(function (r) { return String(r['单号'] || '') === noticeId; });
      if (!row && patch.row) {
        row = Object.assign({ id: String(page.tab1.length + 1) }, patch.row);
        page.tab1.unshift(row);
        changed = true;
      }
      if (!row) return;
      if (patch.status && row['单据状态'] !== patch.status) {
        row['单据状态'] = patch.status;
        changed = true;
      }
      if (Array.isArray(patch.lines) && Array.isArray(row._lines)) {
        patch.lines.forEach(function (ln) {
          const hit = row._lines.find(function (x) {
            const mat = String(x['物料信息'] || '');
            const code = String(ln.code || '');
            return String(x.id || '') === String(ln.id || '')
              || (code && mat.indexOf(code) === 0)
              || (ln.lineNo != null && (
                String(x.id || '').endsWith('-l' + ln.lineNo)
                || String(x.id || '') === String(ln.lineNo)
              ));
          });
          if (!hit) return;
          if (ln.status) hit['行状态'] = ln.status;
          if (ln.doneQty != null) hit['已完成数量'] = Number(ln.doneQty).toFixed(2);
          if (ln.remainQty != null) hit['未完成数量'] = Number(ln.remainQty).toFixed(2);
          changed = true;
        });
      } else if (Array.isArray(patch.lines) && patch.row && Array.isArray(patch.row._lines)) {
        row._lines = JSON.parse(JSON.stringify(patch.row._lines));
        changed = true;
      }
    });

    Object.keys(wp.tab2 || {}).forEach(function (rkId) {
      const src = wp.tab2[rkId];
      const idx = page.tab2.findIndex(function (r) { return String(r['入库单号'] || '') === rkId; });
      if (idx >= 0) {
        page.tab2[idx] = Object.assign({}, page.tab2[idx], src, { 入库单号: rkId });
      } else {
        page.tab2.unshift(Object.assign({ id: String(page.tab2.length + 1) }, src, { 入库单号: rkId }));
      }
      changed = true;
    });

    Object.keys(wp.tab3 || {}).forEach(function (key) {
      const src = wp.tab3[key];
      const barcode = src['条码号'];
      const rkId = src['入库单号'];
      const idx = page.tab3.findIndex(function (r) {
        return String(r['条码号'] || '') === String(barcode || '')
          && String(r['入库单号'] || '') === String(rkId || '');
      });
      if (idx >= 0) {
        page.tab3[idx] = Object.assign({}, page.tab3[idx], src);
      } else {
        page.tab3.unshift(Object.assign({ id: String(page.tab3.length + 1) }, src));
      }
      changed = true;
    });

    return changed;
  }

  /**
   * APP 委外发料出库写入 PC 同源缓存
   * payload: {
   *   noticeId, noticeStatus, noticeRow?, noticeLines?,
   *   ckId, ckStatus, ckRow,
   *   flowRows: [{ key?, ...tab3 fields }],
   *   draftKey?, draft?, clearDraft?
   * }
   */
  function upsertWhOsIssueFromApp(payload) {
    if (!payload || !payload.noticeId) return load();
    return mutate((s) => {
      const wp = ensureWhOsIssue(s);
      const noticeId = payload.noticeId;
      const prevNotice = wp.notices[noticeId] || {};
      wp.notices[noticeId] = Object.assign({}, prevNotice, {
        status: payload.noticeStatus || prevNotice.status,
        lines: payload.noticeLines || prevNotice.lines,
        row: payload.noticeRow || prevNotice.row,
        updatedAt: nowStr(),
      });
      if (payload.ckId && payload.ckRow) {
        const prevCk = wp.tab2[payload.ckId] || {};
        wp.tab2[payload.ckId] = Object.assign({}, prevCk, payload.ckRow, {
          出库单号: payload.ckId,
          单据状态: payload.ckStatus || payload.ckRow['单据状态'] || prevCk['单据状态'] || '执行中',
          关联发料通知单号: noticeId,
          updatedAt: nowStr(),
        });
      }
      (payload.flowRows || []).forEach(function (fr) {
        if (!fr) return;
        const key = fr.key || ((fr['出库单号'] || payload.ckId || '') + '::' + (fr['条码号'] || ''));
        if (!key || key === '::') return;
        const prev = wp.tab3[key] || {};
        wp.tab3[key] = Object.assign({}, prev, fr, {
          key: key,
          出库单号: fr['出库单号'] || payload.ckId || prev['出库单号'],
          通知单号: fr['通知单号'] || noticeId,
          流水状态: fr['流水状态'] || payload.ckStatus || prev['流水状态'] || '执行中',
          updatedAt: nowStr(),
        });
      });
      if (payload.clearDraft && payload.draftKey) {
        delete wp.drafts[payload.draftKey];
      } else if (payload.draftKey && payload.draft) {
        wp.drafts[payload.draftKey] = Object.assign({}, payload.draft, { updatedAt: nowStr() });
      }
      s.docs[noticeId] = Object.assign({}, s.docs[noticeId] || {}, {
        id: noticeId,
        status: payload.noticeStatus || (s.docs[noticeId] && s.docs[noticeId].status) || '执行中',
        source: 'APP',
        updatedAt: nowStr(),
        action: payload.action || 'os-issue',
      });
      if (payload.ckId) {
        s.docs[payload.ckId] = Object.assign({}, s.docs[payload.ckId] || {}, {
          id: payload.ckId,
          status: payload.ckStatus || '执行中',
          noticeId: noticeId,
          source: 'APP',
          updatedAt: nowStr(),
          action: payload.action || 'os-issue',
        });
      }
    }, payload.action || 'wh-os-issue');
  }

  function getWhOsIssueDraft(draftKey) {
    if (!draftKey) return null;
    const wp = load().whOsIssue || {};
    return (wp.drafts && wp.drafts[draftKey]) || null;
  }

  function clearWhOsIssueDraft(draftKey) {
    if (!draftKey) return load();
    return mutate((s) => {
      const wp = ensureWhOsIssue(s);
      delete wp.drafts[draftKey];
    }, 'wh-os-issue-draft-clear');
  }

  /** 将 APP 写入的委外发料出库缓存合并进 PC MOCK['wh-os-issue'] */
  function applyWhOsIssueToMock(MOCK) {
    if (!MOCK || !MOCK['wh-os-issue']) return false;
    const wp = load().whOsIssue;
    if (!wp) return false;
    let changed = false;
    const page = MOCK['wh-os-issue'];
    page.tab1 = page.tab1 || [];
    page.tab2 = page.tab2 || [];
    page.tab3 = page.tab3 || [];

    Object.keys(wp.notices || {}).forEach(function (noticeId) {
      const patch = wp.notices[noticeId];
      let row = page.tab1.find(function (r) { return String(r['单号'] || '') === noticeId; });
      if (!row && patch.row) {
        row = Object.assign({ id: String(page.tab1.length + 1) }, patch.row);
        page.tab1.unshift(row);
        changed = true;
      }
      if (!row) return;
      if (patch.status && row['单据状态'] !== patch.status) {
        row['单据状态'] = patch.status;
        changed = true;
      }
      if (Array.isArray(patch.lines) && Array.isArray(row._lines)) {
        patch.lines.forEach(function (ln) {
          const hit = row._lines.find(function (x) {
            const mat = String(x['物料信息'] || '');
            const code = String(ln.code || '');
            return String(x.id || '') === String(ln.id || '')
              || (code && mat.indexOf(code) === 0)
              || (ln.lineNo != null && (
                String(x.id || '').endsWith('-l' + ln.lineNo)
                || String(x.id || '') === String(ln.lineNo)
              ));
          });
          if (!hit) return;
          if (ln.status) hit['行状态'] = ln.status;
          if (ln.doneQty != null) hit['已完成数量'] = Number(ln.doneQty).toFixed(2);
          if (ln.remainQty != null) hit['未完成数量'] = Number(ln.remainQty).toFixed(2);
          changed = true;
        });
      } else if (Array.isArray(patch.lines) && patch.row && Array.isArray(patch.row._lines)) {
        row._lines = JSON.parse(JSON.stringify(patch.row._lines));
        changed = true;
      }
    });

    Object.keys(wp.tab2 || {}).forEach(function (ckId) {
      const src = wp.tab2[ckId];
      const idx = page.tab2.findIndex(function (r) { return String(r['出库单号'] || '') === ckId; });
      if (idx >= 0) {
        page.tab2[idx] = Object.assign({}, page.tab2[idx], src, { 出库单号: ckId });
      } else {
        page.tab2.unshift(Object.assign({ id: String(page.tab2.length + 1) }, src, { 出库单号: ckId }));
      }
      changed = true;
    });

    Object.keys(wp.tab3 || {}).forEach(function (key) {
      const src = wp.tab3[key];
      const barcode = src['条码号'];
      const ckId = src['出库单号'];
      const idx = page.tab3.findIndex(function (r) {
        return String(r['条码号'] || '') === String(barcode || '')
          && String(r['出库单号'] || '') === String(ckId || '');
      });
      if (idx >= 0) {
        page.tab3[idx] = Object.assign({}, page.tab3[idx], src);
      } else {
        page.tab3.unshift(Object.assign({ id: String(page.tab3.length + 1) }, src));
      }
      changed = true;
    });

    return changed;
  }

  function ensureWhOsRetMat(s) {
    if (!s.whOsRetMat) s.whOsRetMat = { notices: {}, tab2: {}, tab3: {}, drafts: {} };
    if (!s.whOsRetMat.notices) s.whOsRetMat.notices = {};
    if (!s.whOsRetMat.tab2) s.whOsRetMat.tab2 = {};
    if (!s.whOsRetMat.tab3) s.whOsRetMat.tab3 = {};
    if (!s.whOsRetMat.drafts) s.whOsRetMat.drafts = {};
    return s.whOsRetMat;
  }

  /**
   * APP 委外退料入库写入 PC 同源缓存
   * payload: {
   *   noticeId, noticeStatus, noticeRow?, noticeLines?,
   *   rkId, rkStatus, rkRow,
   *   flowRows: [{ key?, ...tab3 fields }],
   *   draftKey?, draft?, clearDraft?
   * }
   */
  function upsertWhOsRetMatFromApp(payload) {
    if (!payload || !payload.noticeId) return load();
    return mutate((s) => {
      const wp = ensureWhOsRetMat(s);
      const noticeId = payload.noticeId;
      const prevNotice = wp.notices[noticeId] || {};
      wp.notices[noticeId] = Object.assign({}, prevNotice, {
        status: payload.noticeStatus || prevNotice.status,
        lines: payload.noticeLines || prevNotice.lines,
        row: payload.noticeRow || prevNotice.row,
        updatedAt: nowStr(),
      });
      if (payload.rkId && payload.rkRow) {
        const prevRk = wp.tab2[payload.rkId] || {};
        wp.tab2[payload.rkId] = Object.assign({}, prevRk, payload.rkRow, {
          退料单号: payload.rkId,
          单据状态: payload.rkStatus || payload.rkRow['单据状态'] || prevRk['单据状态'] || '退料中',
          关联退料通知单号: noticeId,
          关联通知单: noticeId,
          updatedAt: nowStr(),
        });
      }
      (payload.flowRows || []).forEach(function (fr) {
        if (!fr) return;
        const key = fr.key || ((fr['退料单号'] || payload.rkId || '') + '::' + (fr['条码号'] || ''));
        if (!key || key === '::') return;
        const prev = wp.tab3[key] || {};
        wp.tab3[key] = Object.assign({}, prev, fr, {
          key: key,
          退料单号: fr['退料单号'] || payload.rkId || prev['退料单号'],
          通知单号: fr['通知单号'] || noticeId,
          流水状态: fr['流水状态'] || payload.rkStatus || prev['流水状态'] || '退料中',
          updatedAt: nowStr(),
        });
      });
      if (payload.clearDraft && payload.draftKey) {
        delete wp.drafts[payload.draftKey];
      } else if (payload.draftKey && payload.draft) {
        wp.drafts[payload.draftKey] = Object.assign({}, payload.draft, { updatedAt: nowStr() });
      }
      s.docs[noticeId] = Object.assign({}, s.docs[noticeId] || {}, {
        id: noticeId,
        status: payload.noticeStatus || (s.docs[noticeId] && s.docs[noticeId].status) || '执行中',
        source: 'APP',
        updatedAt: nowStr(),
        action: payload.action || 'os-ret-mat',
      });
      if (payload.rkId) {
        s.docs[payload.rkId] = Object.assign({}, s.docs[payload.rkId] || {}, {
          id: payload.rkId,
          status: payload.rkStatus || '退料中',
          noticeId: noticeId,
          source: 'APP',
          updatedAt: nowStr(),
          action: payload.action || 'os-ret-mat',
        });
      }
    }, payload.action || 'wh-os-ret-mat');
  }

  function getWhOsRetMatDraft(draftKey) {
    if (!draftKey) return null;
    const wp = load().whOsRetMat || {};
    return (wp.drafts && wp.drafts[draftKey]) || null;
  }

  function clearWhOsRetMatDraft(draftKey) {
    if (!draftKey) return load();
    return mutate((s) => {
      const wp = ensureWhOsRetMat(s);
      delete wp.drafts[draftKey];
    }, 'wh-os-ret-mat-draft-clear');
  }

  /** 将 APP 写入的委外退料入库缓存合并进 PC MOCK['wh-os-ret-mat'] */
  function applyWhOsRetMatToMock(MOCK) {
    if (!MOCK || !MOCK['wh-os-ret-mat']) return false;
    const wp = load().whOsRetMat;
    if (!wp) return false;
    let changed = false;
    const page = MOCK['wh-os-ret-mat'];
    page.tab1 = page.tab1 || [];
    page.tab2 = page.tab2 || [];
    page.tab3 = page.tab3 || [];

    Object.keys(wp.notices || {}).forEach(function (noticeId) {
      const patch = wp.notices[noticeId];
      let row = page.tab1.find(function (r) { return String(r['单号'] || '') === noticeId; });
      if (!row && patch.row) {
        row = Object.assign({ id: String(page.tab1.length + 1) }, patch.row);
        page.tab1.unshift(row);
        changed = true;
      }
      if (!row) return;
      if (patch.status && row['单据状态'] !== patch.status) {
        row['单据状态'] = patch.status;
        changed = true;
      }
      if (Array.isArray(patch.lines) && Array.isArray(row._lines)) {
        patch.lines.forEach(function (ln) {
          const hit = row._lines.find(function (x) {
            const mat = String(x['物料信息'] || '');
            const code = String(ln.code || '');
            return String(x.id || '') === String(ln.id || '')
              || (code && mat.indexOf(code) === 0)
              || (ln.lineNo != null && (
                String(x.id || '').endsWith('-l' + ln.lineNo)
                || String(x.id || '') === String(ln.lineNo)
              ));
          });
          if (!hit) return;
          if (ln.status) hit['行状态'] = ln.status;
          if (ln.doneQty != null) hit['已完成数量'] = Number(ln.doneQty).toFixed(2);
          if (ln.remainQty != null) hit['未完成数量'] = Number(ln.remainQty).toFixed(2);
          changed = true;
        });
      } else if (Array.isArray(patch.lines) && patch.row && Array.isArray(patch.row._lines)) {
        row._lines = JSON.parse(JSON.stringify(patch.row._lines));
        changed = true;
      }
    });

    Object.keys(wp.tab2 || {}).forEach(function (rkId) {
      const src = wp.tab2[rkId];
      const idx = page.tab2.findIndex(function (r) { return String(r['退料单号'] || '') === rkId; });
      if (idx >= 0) {
        page.tab2[idx] = Object.assign({}, page.tab2[idx], src, { 退料单号: rkId });
      } else {
        page.tab2.unshift(Object.assign({ id: String(page.tab2.length + 1) }, src, { 退料单号: rkId }));
      }
      changed = true;
    });

    Object.keys(wp.tab3 || {}).forEach(function (key) {
      const src = wp.tab3[key];
      const barcode = src['条码号'];
      const rkId = src['退料单号'];
      const idx = page.tab3.findIndex(function (r) {
        return String(r['条码号'] || '') === String(barcode || '')
          && String(r['退料单号'] || '') === String(rkId || '');
      });
      if (idx >= 0) {
        page.tab3[idx] = Object.assign({}, page.tab3[idx], src);
      } else {
        page.tab3.unshift(Object.assign({ id: String(page.tab3.length + 1) }, src));
      }
      changed = true;
    });

    return changed;
  }

  function ensureWhOsRecv(s) {
    if (!s.whOsRecv) s.whOsRecv = { notices: {}, tab2: {}, tab3: {}, drafts: {} };
    if (!s.whOsRecv.notices) s.whOsRecv.notices = {};
    if (!s.whOsRecv.tab2) s.whOsRecv.tab2 = {};
    if (!s.whOsRecv.tab3) s.whOsRecv.tab3 = {};
    if (!s.whOsRecv.drafts) s.whOsRecv.drafts = {};
    return s.whOsRecv;
  }

  /**
   * APP 委外收货入库写入 PC 同源缓存
   * payload: {
   *   noticeId, noticeStatus, noticeRow?, noticeLines?,
   *   rkId, rkStatus, rkRow,
   *   flowRows: [{ key?, ...tab3 fields }],
   *   draftKey?, draft?, clearDraft?
   * }
   */
  function upsertWhOsRecvFromApp(payload) {
    if (!payload || !payload.noticeId) return load();
    return mutate((s) => {
      const wp = ensureWhOsRecv(s);
      const noticeId = payload.noticeId;
      const prevNotice = wp.notices[noticeId] || {};
      wp.notices[noticeId] = Object.assign({}, prevNotice, {
        status: payload.noticeStatus || prevNotice.status,
        lines: payload.noticeLines || prevNotice.lines,
        row: payload.noticeRow || prevNotice.row,
        updatedAt: nowStr(),
      });
      if (payload.rkId && payload.rkRow) {
        const prevRk = wp.tab2[payload.rkId] || {};
        wp.tab2[payload.rkId] = Object.assign({}, prevRk, payload.rkRow, {
          收货单号: payload.rkId,
          入库单号: payload.rkId,
          单据状态: payload.rkStatus || payload.rkRow['单据状态'] || prevRk['单据状态'] || '执行中',
          关联收货通知单号: noticeId,
          关联通知单: noticeId,
          updatedAt: nowStr(),
        });
      }
      (payload.flowRows || []).forEach(function (fr) {
        if (!fr) return;
        const key = fr.key || ((fr['收货单号'] || fr['入库单号'] || payload.rkId || '') + '::' + (fr['条码号'] || ''));
        if (!key || key === '::') return;
        const prev = wp.tab3[key] || {};
        wp.tab3[key] = Object.assign({}, prev, fr, {
          key: key,
          收货单号: fr['收货单号'] || fr['入库单号'] || payload.rkId || prev['收货单号'],
          入库单号: fr['入库单号'] || fr['收货单号'] || payload.rkId || prev['入库单号'],
          通知单号: fr['通知单号'] || noticeId,
          流水状态: fr['流水状态'] || payload.rkStatus || prev['流水状态'] || '执行中',
          updatedAt: nowStr(),
        });
      });
      if (payload.clearDraft && payload.draftKey) {
        delete wp.drafts[payload.draftKey];
      } else if (payload.draftKey && payload.draft) {
        wp.drafts[payload.draftKey] = Object.assign({}, payload.draft, { updatedAt: nowStr() });
      }
      s.docs[noticeId] = Object.assign({}, s.docs[noticeId] || {}, {
        id: noticeId,
        status: payload.noticeStatus || (s.docs[noticeId] && s.docs[noticeId].status) || '执行中',
        source: 'APP',
        updatedAt: nowStr(),
        action: payload.action || 'os-recv',
      });
      if (payload.rkId) {
        s.docs[payload.rkId] = Object.assign({}, s.docs[payload.rkId] || {}, {
          id: payload.rkId,
          status: payload.rkStatus || '执行中',
          noticeId: noticeId,
          source: 'APP',
          updatedAt: nowStr(),
          action: payload.action || 'os-recv',
        });
      }
    }, payload.action || 'wh-os-recv');
  }

  function getWhOsRecvDraft(draftKey) {
    if (!draftKey) return null;
    const wp = load().whOsRecv || {};
    return (wp.drafts && wp.drafts[draftKey]) || null;
  }

  function clearWhOsRecvDraft(draftKey) {
    if (!draftKey) return load();
    return mutate((s) => {
      const wp = ensureWhOsRecv(s);
      delete wp.drafts[draftKey];
    }, 'wh-os-recv-draft-clear');
  }

  /** 将 APP 写入的委外收货入库缓存合并进 PC MOCK['wh-os-recv'] */
  function applyWhOsRecvToMock(MOCK) {
    if (!MOCK || !MOCK['wh-os-recv']) return false;
    const wp = load().whOsRecv;
    if (!wp) return false;
    let changed = false;
    const page = MOCK['wh-os-recv'];
    page.tab1 = page.tab1 || [];
    page.tab2 = page.tab2 || [];
    page.tab3 = page.tab3 || [];

    Object.keys(wp.notices || {}).forEach(function (noticeId) {
      const patch = wp.notices[noticeId];
      let row = page.tab1.find(function (r) { return String(r['单号'] || '') === noticeId; });
      if (!row && patch.row) {
        row = Object.assign({ id: String(page.tab1.length + 1) }, patch.row);
        page.tab1.unshift(row);
        changed = true;
      }
      if (!row) return;
      if (patch.status && row['单据状态'] !== patch.status) {
        row['单据状态'] = patch.status;
        changed = true;
      }
      if (Array.isArray(patch.lines) && Array.isArray(row._lines)) {
        patch.lines.forEach(function (ln) {
          const hit = row._lines.find(function (x) {
            const mat = String(x['物料信息'] || '');
            const code = String(ln.code || '');
            return String(x.id || '') === String(ln.id || '')
              || (code && mat.indexOf(code) === 0)
              || (ln.lineNo != null && (
                String(x.id || '').endsWith('-l' + ln.lineNo)
                || String(x.id || '') === String(ln.lineNo)
              ));
          });
          if (!hit) return;
          if (ln.status) hit['行状态'] = ln.status;
          if (ln.doneQty != null) hit['已完成数量'] = Number(ln.doneQty).toFixed(2);
          if (ln.remainQty != null) hit['未完成数量'] = Number(ln.remainQty).toFixed(2);
          changed = true;
        });
      } else if (Array.isArray(patch.lines) && patch.row && Array.isArray(patch.row._lines)) {
        row._lines = JSON.parse(JSON.stringify(patch.row._lines));
        changed = true;
      }
    });

    Object.keys(wp.tab2 || {}).forEach(function (rkId) {
      const src = wp.tab2[rkId];
      const idx = page.tab2.findIndex(function (r) {
        return String(r['收货单号'] || r['入库单号'] || '') === rkId;
      });
      if (idx >= 0) {
        page.tab2[idx] = Object.assign({}, page.tab2[idx], src, { 收货单号: rkId, 入库单号: rkId });
      } else {
        page.tab2.unshift(Object.assign({ id: String(page.tab2.length + 1) }, src, { 收货单号: rkId, 入库单号: rkId }));
      }
      changed = true;
    });

    Object.keys(wp.tab3 || {}).forEach(function (key) {
      const src = wp.tab3[key];
      const barcode = src['条码号'];
      const rkId = src['收货单号'] || src['入库单号'];
      const idx = page.tab3.findIndex(function (r) {
        return String(r['条码号'] || '') === String(barcode || '')
          && String(r['收货单号'] || r['入库单号'] || '') === String(rkId || '');
      });
      if (idx >= 0) {
        page.tab3[idx] = Object.assign({}, page.tab3[idx], src);
      } else {
        page.tab3.unshift(Object.assign({ id: String(page.tab3.length + 1) }, src));
      }
      changed = true;
    });

    return changed;
  }

  function ensureWhOsRetGoods(s) {
    if (!s.whOsRetGoods) s.whOsRetGoods = { notices: {}, tab2: {}, tab3: {}, drafts: {} };
    if (!s.whOsRetGoods.notices) s.whOsRetGoods.notices = {};
    if (!s.whOsRetGoods.tab2) s.whOsRetGoods.tab2 = {};
    if (!s.whOsRetGoods.tab3) s.whOsRetGoods.tab3 = {};
    if (!s.whOsRetGoods.drafts) s.whOsRetGoods.drafts = {};
    return s.whOsRetGoods;
  }

  /**
   * APP 委外退货出库写入 PC 同源缓存
   * payload: {
   *   noticeId, noticeStatus, noticeRow?, noticeLines?,
   *   ckId, ckStatus, ckRow,
   *   flowRows: [{ key?, ...tab3 fields }],
   *   draftKey?, draft?, clearDraft?
   * }
   */
  function upsertWhOsRetGoodsFromApp(payload) {
    if (!payload || !payload.noticeId) return load();
    return mutate((s) => {
      const wp = ensureWhOsRetGoods(s);
      const noticeId = payload.noticeId;
      const prevNotice = wp.notices[noticeId] || {};
      wp.notices[noticeId] = Object.assign({}, prevNotice, {
        status: payload.noticeStatus || prevNotice.status,
        lines: payload.noticeLines || prevNotice.lines,
        row: payload.noticeRow || prevNotice.row,
        updatedAt: nowStr(),
      });
      if (payload.ckId && payload.ckRow) {
        const prevCk = wp.tab2[payload.ckId] || {};
        wp.tab2[payload.ckId] = Object.assign({}, prevCk, payload.ckRow, {
          退货单号: payload.ckId,
          单据状态: payload.ckStatus || payload.ckRow['单据状态'] || prevCk['单据状态'] || '退货中',
          关联退货通知单号: noticeId,
          关联通知单: noticeId,
          updatedAt: nowStr(),
        });
      }
      (payload.flowRows || []).forEach(function (fr) {
        if (!fr) return;
        const key = fr.key || ((fr['退货单号'] || payload.ckId || '') + '::' + (fr['条码号'] || ''));
        if (!key || key === '::') return;
        const prev = wp.tab3[key] || {};
        wp.tab3[key] = Object.assign({}, prev, fr, {
          key: key,
          退货单号: fr['退货单号'] || payload.ckId || prev['退货单号'],
          通知单号: fr['通知单号'] || noticeId,
          流水状态: fr['流水状态'] || payload.ckStatus || prev['流水状态'] || '退货中',
          updatedAt: nowStr(),
        });
      });
      if (payload.clearDraft && payload.draftKey) {
        delete wp.drafts[payload.draftKey];
      } else if (payload.draftKey && payload.draft) {
        wp.drafts[payload.draftKey] = Object.assign({}, payload.draft, { updatedAt: nowStr() });
      }
      s.docs[noticeId] = Object.assign({}, s.docs[noticeId] || {}, {
        id: noticeId,
        status: payload.noticeStatus || (s.docs[noticeId] && s.docs[noticeId].status) || '执行中',
        source: 'APP',
        updatedAt: nowStr(),
        action: payload.action || 'os-rma',
      });
      if (payload.ckId) {
        s.docs[payload.ckId] = Object.assign({}, s.docs[payload.ckId] || {}, {
          id: payload.ckId,
          status: payload.ckStatus || '退货中',
          noticeId: noticeId,
          source: 'APP',
          updatedAt: nowStr(),
          action: payload.action || 'os-rma',
        });
      }
    }, payload.action || 'wh-os-ret-goods');
  }

  function getWhOsRetGoodsDraft(draftKey) {
    if (!draftKey) return null;
    const wp = load().whOsRetGoods || {};
    return (wp.drafts && wp.drafts[draftKey]) || null;
  }

  function clearWhOsRetGoodsDraft(draftKey) {
    if (!draftKey) return load();
    return mutate((s) => {
      const wp = ensureWhOsRetGoods(s);
      delete wp.drafts[draftKey];
    }, 'wh-os-ret-goods-draft-clear');
  }

  /** 将 APP 写入的委外退货出库缓存合并进 PC MOCK['wh-os-ret-goods'] */
  function applyWhOsRetGoodsToMock(MOCK) {
    if (!MOCK || !MOCK['wh-os-ret-goods']) return false;
    const wp = load().whOsRetGoods;
    if (!wp) return false;
    let changed = false;
    const page = MOCK['wh-os-ret-goods'];
    page.tab1 = page.tab1 || [];
    page.tab2 = page.tab2 || [];
    page.tab3 = page.tab3 || [];

    Object.keys(wp.notices || {}).forEach(function (noticeId) {
      const patch = wp.notices[noticeId];
      let row = page.tab1.find(function (r) { return String(r['单号'] || '') === noticeId; });
      if (!row && patch.row) {
        row = Object.assign({ id: String(page.tab1.length + 1) }, patch.row);
        page.tab1.unshift(row);
        changed = true;
      }
      if (!row) return;
      if (patch.status && row['单据状态'] !== patch.status) {
        row['单据状态'] = patch.status;
        changed = true;
      }
      if (Array.isArray(patch.lines) && Array.isArray(row._lines)) {
        patch.lines.forEach(function (ln) {
          const hit = row._lines.find(function (x) {
            const mat = String(x['物料信息'] || '');
            const code = String(ln.code || '');
            return String(x.id || '') === String(ln.id || '')
              || (code && mat.indexOf(code) === 0)
              || (ln.lineNo != null && (
                String(x.id || '').endsWith('-l' + ln.lineNo)
                || String(x.id || '') === String(ln.lineNo)
              ));
          });
          if (!hit) return;
          if (ln.status) hit['行状态'] = ln.status;
          if (ln.doneQty != null) hit['已完成数量'] = Number(ln.doneQty).toFixed(2);
          if (ln.remainQty != null) hit['未完成数量'] = Number(ln.remainQty).toFixed(2);
          changed = true;
        });
      } else if (Array.isArray(patch.lines) && patch.row && Array.isArray(patch.row._lines)) {
        row._lines = JSON.parse(JSON.stringify(patch.row._lines));
        changed = true;
      }
    });

    Object.keys(wp.tab2 || {}).forEach(function (ckId) {
      const src = wp.tab2[ckId];
      const idx = page.tab2.findIndex(function (r) { return String(r['退货单号'] || '') === ckId; });
      if (idx >= 0) {
        page.tab2[idx] = Object.assign({}, page.tab2[idx], src, { 退货单号: ckId });
      } else {
        page.tab2.unshift(Object.assign({ id: String(page.tab2.length + 1) }, src, { 退货单号: ckId }));
      }
      changed = true;
    });

    Object.keys(wp.tab3 || {}).forEach(function (key) {
      const src = wp.tab3[key];
      const barcode = src['条码号'];
      const ckId = src['退货单号'];
      const idx = page.tab3.findIndex(function (r) {
        return String(r['条码号'] || '') === String(barcode || '')
          && String(r['退货单号'] || '') === String(ckId || '');
      });
      if (idx >= 0) {
        page.tab3[idx] = Object.assign({}, page.tab3[idx], src);
      } else {
        page.tab3.unshift(Object.assign({ id: String(page.tab3.length + 1) }, src));
      }
      changed = true;
    });

    return changed;
  }

  function reset() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) { /* ignore */ }
    const state = emptyState();
    try {
      channel && channel.postMessage({ type: 'sync', reason: 'reset', at: nowStr() });
    } catch (e) { /* ignore */ }
    try {
      window.dispatchEvent(new CustomEvent('wms-demo-sync', { detail: { type: 'sync', reason: 'reset' } }));
    } catch (e) { /* ignore */ }
    return state;
  }

  /* ---- MOCK 数据持久化（用户在 PC 端新增/编辑/删除的列表行） ---- */
  const MOCK_KEY = 'wms-demo-mock-v1';

  function saveMock(mockObj) {
    if (!mockObj) return;
    try {
      localStorage.setItem(MOCK_KEY, JSON.stringify(mockObj));
    } catch (e) {
      console.warn('[WMS_DEMO_STORE] MOCK localStorage 写入失败', e);
    }
  }

  function loadMock() {
    try {
      const raw = localStorage.getItem(MOCK_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function mockRowKey(r) {
    if (!r || typeof r !== 'object') return '';
    return String(r.id || r['单号'] || r['入库单号'] || r['运单号'] || r['发货单号'] || r['事件编号'] || r['采购订单号'] || r['物料编码'] || '');
  }

  /** 持久化行优先，但源码 Mock 上有而缓存缺失的 `_lines` 等子表予以回补，避免详情操作列丢失 */
  function mergeMockRows(saved, fresh) {
    if (!Array.isArray(saved)) return Array.isArray(fresh) ? fresh : saved;
    if (!Array.isArray(fresh) || !fresh.length) return saved;
    const byKey = {};
    fresh.forEach(function (r) {
      const k = mockRowKey(r);
      if (k) byKey[k] = r;
    });
    return saved.map(function (r) {
      const k = mockRowKey(r);
      const base = k ? byKey[k] : null;
      if (!base) return r;
      const next = Object.assign({}, base, r);
      if ((!Array.isArray(r._lines) || !r._lines.length) && Array.isArray(base._lines) && base._lines.length) {
        next._lines = JSON.parse(JSON.stringify(base._lines));
      }
      if ((!Array.isArray(r._addrs) || !r._addrs.length) && Array.isArray(base._addrs) && base._addrs.length) {
        next._addrs = JSON.parse(JSON.stringify(base._addrs));
      }
      if ((!Array.isArray(r._pickLines) || !r._pickLines.length) && Array.isArray(base._pickLines) && base._pickLines.length) {
        next._pickLines = JSON.parse(JSON.stringify(base._pickLines));
      }
      return next;
    });
  }

  function hydrateMock(target) {
    const saved = loadMock();
    if (!saved || !target) return;
    Object.keys(saved).forEach(function (pageKey) {
      const src = saved[pageKey];
      if (src && typeof src === 'object') {
        if (!target[pageKey]) {
          target[pageKey] = src;
        } else if (Array.isArray(src) && Array.isArray(target[pageKey])) {
          target[pageKey] = mergeMockRows(src, target[pageKey]);
        } else if (typeof src === 'object' && !Array.isArray(src)) {
          Object.keys(src).forEach(function (tabKey) {
            if (!target[pageKey]) target[pageKey] = {};
            if (Array.isArray(src[tabKey]) && Array.isArray(target[pageKey][tabKey])) {
              target[pageKey][tabKey] = mergeMockRows(src[tabKey], target[pageKey][tabKey]);
            } else {
              target[pageKey][tabKey] = src[tabKey];
            }
          });
        }
      }
    });
  }

  function resetMock() {
    try { localStorage.removeItem(MOCK_KEY); } catch (e) { /* ignore */ }
  }

  function snapshot() {
    return load();
  }

  function subscribe(handler) {
    if (typeof handler !== 'function') return function () {};
    const onMsg = (ev) => handler(ev && ev.data ? ev.data : ev);
    const onStorage = (ev) => {
      if (ev && ev.key === STORAGE_KEY) handler({ type: 'sync', reason: 'storage' });
    };
    const onCustom = (ev) => handler(ev.detail || { type: 'sync' });
    if (channel) channel.addEventListener('message', onMsg);
    window.addEventListener('storage', onStorage);
    window.addEventListener('wms-demo-sync', onCustom);
    return function unsubscribe() {
      if (channel) channel.removeEventListener('message', onMsg);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('wms-demo-sync', onCustom);
    };
  }

  return {
    STORAGE_KEY: STORAGE_KEY,
    CHANNEL: CHANNEL,
    STATUS_TO_PC: STATUS_TO_PC,
    STATUS_TO_APP: STATUS_TO_APP,
    load: load,
    snapshot: snapshot,
    reset: reset,
    subscribe: subscribe,
    nowStr: nowStr,
    setDocStatus: setDocStatus,
    patchDoc: patchDoc,
    getDoc: getDoc,
    appendEnroute: appendEnroute,
    getEnroute: getEnroute,
    getEnrouteForPc: getEnrouteForPc,
    setPointStatus: setPointStatus,
    getPoint: getPoint,
    appendFlow: appendFlow,
    getFlows: getFlows,
    bumpInventory: bumpInventory,
    getInventory: getInventory,
    overlayPcRow: overlayPcRow,
    overlayAppDoc: overlayAppDoc,
    hydrateAppDocs: hydrateAppDocs,
    upsertWhPoInFromApp: upsertWhPoInFromApp,
    getWhPoInDraft: getWhPoInDraft,
    clearWhPoInDraft: clearWhPoInDraft,
    applyWhPoInToMock: applyWhPoInToMock,
    upsertWhPoRetFromApp: upsertWhPoRetFromApp,
    getWhPoRetDraft: getWhPoRetDraft,
    clearWhPoRetDraft: clearWhPoRetDraft,
    applyWhPoRetToMock: applyWhPoRetToMock,
    upsertWhOsIssueFromApp: upsertWhOsIssueFromApp,
    getWhOsIssueDraft: getWhOsIssueDraft,
    clearWhOsIssueDraft: clearWhOsIssueDraft,
    applyWhOsIssueToMock: applyWhOsIssueToMock,
    upsertWhProdIssueFromApp: upsertWhProdIssueFromApp,
    getWhProdIssueDraft: getWhProdIssueDraft,
    clearWhProdIssueDraft: clearWhProdIssueDraft,
    applyWhProdIssueToMock: applyWhProdIssueToMock,
    upsertWhProdRetFromApp: upsertWhProdRetFromApp,
    getWhProdRetDraft: getWhProdRetDraft,
    clearWhProdRetDraft: clearWhProdRetDraft,
    applyWhProdRetToMock: applyWhProdRetToMock,
    upsertWhOsRetMatFromApp: upsertWhOsRetMatFromApp,
    getWhOsRetMatDraft: getWhOsRetMatDraft,
    clearWhOsRetMatDraft: clearWhOsRetMatDraft,
    applyWhOsRetMatToMock: applyWhOsRetMatToMock,
    upsertWhOsRecvFromApp: upsertWhOsRecvFromApp,
    getWhOsRecvDraft: getWhOsRecvDraft,
    clearWhOsRecvDraft: clearWhOsRecvDraft,
    applyWhOsRecvToMock: applyWhOsRecvToMock,
    upsertWhOsRetGoodsFromApp: upsertWhOsRetGoodsFromApp,
    getWhOsRetGoodsDraft: getWhOsRetGoodsDraft,
    clearWhOsRetGoodsDraft: clearWhOsRetGoodsDraft,
    applyWhOsRetGoodsToMock: applyWhOsRetGoodsToMock,
    saveMock: saveMock,
    loadMock: loadMock,
    hydrateMock: hydrateMock,
    resetMock: resetMock,
  };
})();

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
    待发运: '待发运',
    发运中: '运输中',
    运输中: '运输中',
    已签收: '已签收',
    已到达: '已到达',
  };
  const STATUS_TO_APP = {
    待执行: '待执行',
    执行中: '执行中',
    已完成: '已完成',
    已关闭: '已关闭',
    待发运: '待发运',
    运输中: '发运中',
    发运中: '发运中',
    已签收: '已签收',
    已到达: '已到达',
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
      const row = Object.assign({
        记录时间: nowStr(),
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
      list.unshift(row);
      s.enroute[waybillId] = list.slice(0, 50);
      const prev = s.docs[waybillId] || { id: waybillId };
      s.docs[waybillId] = Object.assign({}, prev, {
        id: waybillId,
        status: prev.status || '发运中',
        lastEnroute: row.当前位置,
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
    const id =
      row['运单号'] ||
      row['单号'] ||
      row['物流订单号'] ||
      row['发货单号'] ||
      row['派车申请单号'] ||
      row.id;
    const doc = getDoc(id);
    if (!doc || !doc.status) return row;
    const next = Object.assign({}, row);
    const pcStatus = STATUS_TO_PC[doc.status] || doc.status;
    if (pageId === 'lg-waybill' || pageId === 'lg-order') {
      if (next['状态'] !== undefined) next['状态'] = pcStatus;
    } else if (next['单据状态'] !== undefined) {
      next['单据状态'] = pcStatus;
    } else if (next['状态'] !== undefined) {
      next['状态'] = pcStatus;
    }
    if (doc.lastEnroute && next['备注'] !== undefined && (pageId === 'lg-waybill' || pageId === 'lg-order')) {
      next['备注'] = 'APP在途：' + doc.lastEnroute;
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
    if (hit.lastEnroute) {
      next.enroute = Object.assign({}, next.enroute || {}, {
        location: hit.lastEnroute,
        updatedAt: hit.updatedAt || (next.enroute && next.enroute.updatedAt) || '',
        remark: (next.enroute && next.enroute.remark) || 'APP已同步',
      });
    }
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
    const id = (row && (row['运单号'] || row['物流订单号'] || row.id)) || '';
    const list = getEnroute(id);
    if (list.length) return list;
    return null;
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
  };
})();

/**
 * APP Demo：功能树 + 首页模块 + 仓储管理全叶子 flowMeta / Mock
 * 对齐 02-背景说明/03-页面清单与功能清单.md · APP 仓储管理
 */
window.APP_CFG = (function () {
  function leaf(id, title) {
    return { index: id, title: title, page: 'docs' };
  }

  const menu = [
    {
      index: 'home',
      title: '首页',
      children: [
        { index: 'app-home', title: '功能首页' },
        { index: 'app-msg', title: '消息', stub: true },
        { index: 'app-mine', title: '我的', stub: true },
      ],
    },
    {
      index: 'pkg-data',
      title: '包材资料',
      children: [
        { index: 'app-pkg-create', title: '包材建档' },
        { index: 'app-pkg-query', title: '信息查询' },
      ],
    },
    {
      index: 'wh',
      title: '仓储管理',
      children: [
        {
          index: 'wh-po',
          title: '采购',
          children: [
            leaf('po-in-serial', '采购入库-流水码'),
            leaf('po-in-tank', '采购入库-罐区'),
            leaf('po-in-count', '采购入库-计数'),
            leaf('po-ret-serial', '退料出库-流水码'),
            leaf('po-ret-count', '退料出库-计数'),
          ],
        },
        {
          index: 'wh-prod',
          title: '生产',
          children: [
            leaf('prod-pick-serial', '生产领料-流水码'),
            leaf('prod-pick-count', '生产领料-计数'),
            leaf('prod-pick-tank', '生产领料-罐区'),
            leaf('prod-ret-serial', '生产退料-流水码'),
            leaf('prod-ret-count', '生产退料-计数'),
            leaf('prod-ret-tank', '生产退料-罐区'),
            leaf('prod-in-serial', '生产入库-流水码'),
            leaf('prod-in-count', '生产入库-计数'),
          ],
        },
        {
          index: 'wh-os',
          title: '委外',
          children: [
            leaf('os-issue-serial', '委外发料-流水码'),
            leaf('os-issue-count', '委外发料-计数'),
            leaf('os-ret-serial', '委外退料-流水码'),
            leaf('os-ret-count', '委外退料-计数'),
            leaf('os-recv-serial', '委外收货-流水码'),
            leaf('os-recv-count', '委外收货-计数'),
            leaf('os-recv-tank', '委外收货-罐区'),
            leaf('os-rma-serial', '委外退货-流水码'),
            leaf('os-rma-count', '委外退货-计数'),
          ],
        },
        {
          index: 'wh-trust',
          title: '受托',
          children: [
            leaf('trust-recv-serial', '受托收料-流水码'),
            leaf('trust-recv-count', '受托收料-计数'),
            leaf('trust-recv-tank', '受托收料-罐区'),
            leaf('trust-ret-serial', '受托退料-流水码'),
            leaf('trust-ret-count', '受托退料-计数'),
            leaf('trust-in-serial', '受托入库-流水码'),
            leaf('trust-in-count', '受托入库-计数'),
          ],
        },
        {
          index: 'wh-so',
          title: '销售',
          children: [
            leaf('so-ship-serial', '销售发货-流水码'),
            leaf('so-ship-count', '销售发货-计数'),
            leaf('so-rma-serial', '销售退货-流水码'),
            leaf('so-rma-count', '销售退货-计数'),
          ],
        },
        {
          index: 'wh-other',
          title: '其他',
          children: [
            leaf('oth-in-serial', '其他入库-流水码'),
            leaf('oth-in-count', '其他入库-计数'),
            leaf('oth-in-tank', '其他入库-罐区'),
            leaf('oth-out-serial', '其他出库-流水码'),
            leaf('oth-out-count', '其他出库-计数'),
            leaf('oth-out-tank', '其他出库-罐区'),
          ],
        },
        {
          index: 'wh-inner',
          title: '库内',
          children: [
            leaf('inner-xfer', '物料转序'),
            leaf('inner-move', '货物移库'),
          ],
        },
        {
          index: 'wh-stock',
          title: '盘点',
          children: [leaf('stock-take', '库存盘点')],
        },
        {
          index: 'wh-load',
          title: '装卸',
          children: [leaf('wh-load', '装卸')],
        },
      ],
    },
    {
      index: 'pkg-mgmt',
      title: '包材管理',
      children: [
        leaf('pkg-split', '流水码拆分'),
        leaf('pkg-merge', '流水码合并'),
        leaf('pkg-outer', '外包材拆组'),
        leaf('pkg-scrap', '报废处理'),
        leaf('pkg-unfreeze', '解除冻结'),
        leaf('pkg-freeze', '异常冻结'),
      ],
    },
    {
      index: 'lg',
      title: '物流管理',
      children: [
        leaf('lg-waybill', '运单'),
      ],
    },
  ];

  function homeItem(id, name, icon) {
    return { id: id, name: name, icon: icon, ready: true };
  }

  const homeModules = [
    {
      group: '包材资料',
      items: [
        homeItem('app-pkg-create', '包材建档', '📦'),
        homeItem('app-pkg-query', '信息查询', '🔍'),
      ],
    },
    {
      group: '仓储管理 · 采购',
      items: [
        homeItem('po-in-serial', '采购入库-流水码', '📥'),
        homeItem('po-in-tank', '采购入库-罐区', '🛢️'),
        homeItem('po-in-count', '采购入库-计数', '🔢'),
        homeItem('po-ret-serial', '退料出库-流水码', '📤'),
        homeItem('po-ret-count', '退料出库-计数', '📤'),
      ],
    },
    {
      group: '仓储管理 · 生产',
      items: [
        homeItem('prod-pick-serial', '生产领料-流水码', '🏭'),
        homeItem('prod-pick-count', '生产领料-计数', '🏭'),
        homeItem('prod-pick-tank', '生产领料-罐区', '🛢️'),
        homeItem('prod-ret-serial', '生产退料-流水码', '↩️'),
        homeItem('prod-ret-count', '生产退料-计数', '↩️'),
        homeItem('prod-ret-tank', '生产退料-罐区', '🛢️'),
        homeItem('prod-in-serial', '生产入库-流水码', '✅'),
        homeItem('prod-in-count', '生产入库-计数', '✅'),
      ],
    },
    {
      group: '仓储管理 · 委外',
      items: [
        homeItem('os-issue-serial', '委外发料-流水码', '🚚'),
        homeItem('os-issue-count', '委外发料-计数', '🚚'),
        homeItem('os-ret-serial', '委外退料-流水码', '🔄'),
        homeItem('os-ret-count', '委外退料-计数', '🔄'),
        homeItem('os-recv-serial', '委外收货-流水码', '📋'),
        homeItem('os-recv-count', '委外收货-计数', '📋'),
        homeItem('os-recv-tank', '委外收货-罐区', '🛢️'),
        homeItem('os-rma-serial', '委外退货-流水码', '⚠️'),
        homeItem('os-rma-count', '委外退货-计数', '⚠️'),
      ],
    },
    {
      group: '仓储管理 · 受托',
      items: [
        homeItem('trust-recv-serial', '受托收料-流水码', '📥'),
        homeItem('trust-recv-count', '受托收料-计数', '📥'),
        homeItem('trust-recv-tank', '受托收料-罐区', '🛢️'),
        homeItem('trust-ret-serial', '受托退料-流水码', '📤'),
        homeItem('trust-ret-count', '受托退料-计数', '📤'),
        homeItem('trust-in-serial', '受托入库-流水码', '✅'),
        homeItem('trust-in-count', '受托入库-计数', '✅'),
      ],
    },
    {
      group: '仓储管理 · 销售',
      items: [
        homeItem('so-ship-serial', '销售发货-流水码', '🚛'),
        homeItem('so-ship-count', '销售发货-计数', '🔢'),
        homeItem('so-rma-serial', '销售退货-流水码', '🔙'),
        homeItem('so-rma-count', '销售退货-计数', '🔢'),
      ],
    },
    {
      group: '仓储管理 · 其他 / 库内 / 盘点',
      items: [
        homeItem('oth-in-serial', '其他入库-流水码', '➕'),
        homeItem('oth-in-count', '其他入库-计数', '➕'),
        homeItem('oth-in-tank', '其他入库-罐区', '🛢️'),
        homeItem('oth-out-serial', '其他出库-流水码', '➖'),
        homeItem('oth-out-count', '其他出库-计数', '➖'),
        homeItem('oth-out-tank', '其他出库-罐区', '🛢️'),
        homeItem('inner-xfer', '物料转序', '🔀'),
        homeItem('inner-move', '货物移库', '↔️'),
        homeItem('stock-take', '库存盘点', '📊'),
        homeItem('wh-load', '装卸', '🏗️'),
      ],
    },
    {
      group: '包材管理',
      items: [
        homeItem('pkg-split', '流水码拆分', '✂️'),
        homeItem('pkg-merge', '流水码合并', '🔗'),
        homeItem('pkg-outer', '外包材拆组', '📦'),
        homeItem('pkg-scrap', '报废处理', '🗑️'),
        homeItem('pkg-unfreeze', '解除冻结', '🔓'),
        homeItem('pkg-freeze', '异常冻结', '❄️'),
      ],
    },
    {
      group: '物流管理',
      items: [
        homeItem('lg-waybill', '运单', '🚚'),
      ],
    },
  ];

  /** 标准单据流 flow 工厂 */
  function flow(title, mode, opts) {
    opts = opts || {};
    const isOut = !!opts.isOut;
    return {
      title: title,
      mode: mode,
      hasProcess: opts.hasProcess !== undefined ? opts.hasProcess : mode !== 'count',
      hasMaterials: opts.hasMaterials !== false,
      docKind: opts.docKind || 'supplier',
      partnerLabel: opts.partnerLabel || '供应商名称',
      refLabel: opts.refLabel || '关联单据',
      searchHint: opts.searchHint || '模糊搜索单号/往来单位/物料…',
      emptyDocs: opts.emptyDocs || '暂无待执行单据',
      addLocTitle: opts.addLocTitle || (isOut ? '添加位置信息' : '添加入库信息'),
      addMatTitle: opts.addMatTitle || (isOut ? '添加出库信息' : '添加厂外物料'),
      qtyLabel: opts.qtyLabel || (isOut ? '出库数量' : '入库数量'),
      serialScanTitle: opts.serialScanTitle || (isOut ? '添加退料/出库扫码' : '添加厂外物料'),
      docsKey: opts.docsKey || 'default',
      doneHint: opts.doneHint || '所有物料行已完成',
      execVariant: opts.execVariant || 'default',
    };
  }

  const flowMeta = {
    // 采购
    'po-in-serial': flow('采购入库-流水码', 'serial', { refLabel: '关联采购订单', addMatTitle: '添加厂外物料' }),
    'po-in-tank': flow('采购入库-罐区', 'tank', { refLabel: '关联采购订单' }),
    'po-in-count': flow('采购入库-计数', 'count', { hasProcess: true, refLabel: '关联采购订单', qtyLabel: '入库数量' }),
    'po-ret-serial': flow('退料出库-流水码', 'serial', { isOut: true, refLabel: '关联采购订单', addLocTitle: '添加退料出库信息', serialScanTitle: '添加退料出库信息', addMatTitle: '添加退料出库信息' }),
    'po-ret-count': flow('退料出库-计数', 'count', { isOut: true, hasProcess: false, refLabel: '关联采购订单', qtyLabel: '出库数量', addMatTitle: '添加退料信息' }),

    // 生产
    'prod-pick-serial': flow('生产领料-流水码', 'serial', {
      isOut: true,
      docKind: 'dept',
      partnerLabel: '生产部门',
      refLabel: '关联生产订单',
      execVariant: 'line-side-pick',
      doneHint: '所有物料行已领出完成',
    }),
    'prod-pick-count': flow('生产领料-计数', 'count', { isOut: true, hasProcess: false, docKind: 'dept', partnerLabel: '生产部门', refLabel: '关联生产订单', qtyLabel: '领料数量' }),
    'prod-pick-tank': flow('生产领料-罐区', 'tank', { isOut: true, docKind: 'dept', partnerLabel: '生产部门', refLabel: '关联生产订单' }),
    'prod-ret-serial': flow('生产退料-流水码', 'serial', { docKind: 'dept', partnerLabel: '生产部门', refLabel: '关联生产订单', serialScanTitle: '添加退料扫码' }),
    'prod-ret-count': flow('生产退料-计数', 'count', { hasProcess: false, docKind: 'dept', partnerLabel: '生产部门', refLabel: '关联生产订单', qtyLabel: '退料数量' }),
    'prod-ret-tank': flow('生产退料-罐区', 'tank', { docKind: 'dept', partnerLabel: '生产部门', refLabel: '关联生产订单' }),
    'prod-in-serial': flow('生产入库-流水码', 'serial', { docKind: 'dept', partnerLabel: '生产部门', refLabel: '关联生产订单' }),
    'prod-in-count': flow('生产入库-计数', 'count', { hasProcess: false, docKind: 'dept', partnerLabel: '生产部门', refLabel: '关联生产订单', qtyLabel: '入库数量' }),

    // 委外
    'os-issue-serial': flow('委外发料-流水码', 'serial', { isOut: true, partnerLabel: '供应商名称', refLabel: '关联委外加工单', serialScanTitle: '添加发料扫码' }),
    'os-issue-count': flow('委外发料-计数', 'count', { isOut: true, hasProcess: false, partnerLabel: '供应商名称', refLabel: '关联委外加工单', qtyLabel: '发料数量' }),
    'os-ret-serial': flow('委外退料-流水码', 'serial', { partnerLabel: '供应商名称', refLabel: '关联委外加工单', serialScanTitle: '添加退料扫码' }),
    'os-ret-count': flow('委外退料-计数', 'count', { hasProcess: false, partnerLabel: '供应商名称', refLabel: '关联委外加工单', qtyLabel: '退料数量' }),
    'os-recv-serial': flow('委外收货-流水码', 'serial', { partnerLabel: '供应商名称', refLabel: '关联委外加工单' }),
    'os-recv-count': flow('委外收货-计数', 'count', { hasProcess: false, partnerLabel: '供应商名称', refLabel: '关联委外加工单', qtyLabel: '收货数量' }),
    'os-recv-tank': flow('委外收货-罐区', 'tank', { partnerLabel: '供应商名称', refLabel: '关联委外加工单' }),
    'os-rma-serial': flow('委外退货-流水码', 'serial', { isOut: true, partnerLabel: '供应商名称', refLabel: '关联委外加工单', serialScanTitle: '添加退货扫码' }),
    'os-rma-count': flow('委外退货-计数', 'count', { isOut: true, hasProcess: false, partnerLabel: '供应商名称', refLabel: '关联委外加工单', qtyLabel: '退货数量' }),

    // 受托
    'trust-recv-serial': flow('受托收料-流水码', 'serial', { partnerLabel: '委托方名称', refLabel: '关联受托订单' }),
    'trust-recv-count': flow('受托收料-计数', 'count', { hasProcess: false, partnerLabel: '委托方名称', refLabel: '关联受托订单', qtyLabel: '收料数量' }),
    'trust-recv-tank': flow('受托收料-罐区', 'tank', { partnerLabel: '委托方名称', refLabel: '关联受托订单' }),
    'trust-ret-serial': flow('受托退料-流水码', 'serial', { isOut: true, partnerLabel: '委托方名称', refLabel: '关联受托订单', serialScanTitle: '添加退料扫码' }),
    'trust-ret-count': flow('受托退料-计数', 'count', { isOut: true, hasProcess: false, partnerLabel: '委托方名称', refLabel: '关联受托订单', qtyLabel: '退料数量' }),
    'trust-in-serial': flow('受托入库-流水码', 'serial', { partnerLabel: '委托方名称', refLabel: '关联受托订单' }),
    'trust-in-count': flow('受托入库-计数', 'count', { hasProcess: false, partnerLabel: '委托方名称', refLabel: '关联受托订单', qtyLabel: '入库数量' }),

    // 销售（计数也有工序）
    'so-ship-serial': flow('销售发货-流水码', 'serial', { isOut: true, docKind: 'customer', partnerLabel: '客户名称', refLabel: '关联销售订单', serialScanTitle: '添加发货扫码' }),
    'so-ship-count': flow('销售发货-计数', 'count', { isOut: true, hasProcess: true, docKind: 'customer', partnerLabel: '客户名称', refLabel: '关联销售订单', qtyLabel: '发货数量' }),
    'so-rma-serial': flow('销售退货-流水码', 'serial', { docKind: 'customer', partnerLabel: '客户名称', refLabel: '关联销售订单', serialScanTitle: '添加退货扫码' }),
    'so-rma-count': flow('销售退货-计数', 'count', { hasProcess: true, docKind: 'customer', partnerLabel: '客户名称', refLabel: '关联销售订单', qtyLabel: '退货数量' }),

    // 其他
    'oth-in-serial': flow('其他入库-流水码', 'serial', { partnerLabel: '往来单位', refLabel: '关联单据' }),
    'oth-in-count': flow('其他入库-计数', 'count', { hasProcess: false, partnerLabel: '往来单位', refLabel: '关联单据', qtyLabel: '入库数量' }),
    'oth-in-tank': flow('其他入库-罐区', 'tank', { partnerLabel: '往来单位', refLabel: '关联单据' }),
    'oth-out-serial': flow('其他出库-流水码', 'serial', { isOut: true, partnerLabel: '往来单位', refLabel: '关联单据', serialScanTitle: '添加出库扫码' }),
    'oth-out-count': flow('其他出库-计数', 'count', { isOut: true, hasProcess: false, partnerLabel: '往来单位', refLabel: '关联单据', qtyLabel: '出库数量' }),
    'oth-out-tank': flow('其他出库-罐区', 'tank', { isOut: true, partnerLabel: '往来单位', refLabel: '关联单据' }),

    // 库内 / 盘点
    'inner-xfer': {
      title: '物料转序',
      mode: 'inner',
      hasProcess: false,
      hasMaterials: false,
      docsKey: 'inner',
      partnerLabel: '转出仓库',
      refLabel: '转入仓库',
      searchHint: '模糊搜索转序单号/仓库…',
      emptyDocs: '暂无转序单',
      innerType: 'xfer',
    },
    'inner-move': {
      title: '货物移库',
      mode: 'inner',
      hasProcess: false,
      hasMaterials: false,
      docsKey: 'inner',
      partnerLabel: '移出仓库',
      refLabel: '移入仓库',
      searchHint: '模糊搜索移库单号/仓库…',
      emptyDocs: '暂无移库单',
      innerType: 'move',
    },
    'stock-take': {
      title: '库存盘点',
      mode: 'stocktake',
      hasProcess: false,
      hasMaterials: false,
      docsKey: 'stock',
      partnerLabel: '盘点仓库',
      refLabel: '盘点类型',
      searchHint: '模糊搜索盘点单号/仓库/制单人…',
      emptyDocs: '暂无盘点单',
      showDocAdd: true,
    },
    'app-pkg-create': {
      title: '包材建档',
      mode: 'pkg-arch',
      hasProcess: false,
      hasMaterials: false,
    },
    'app-pkg-query': {
      title: '信息查询',
      mode: 'pkg-query',
      hasProcess: false,
      hasMaterials: false,
    },
    // 包材管理
    'pkg-split': {
      title: '条码拆分',
      mode: 'direct-exec',
      execVariant: 'pkg-split',
      hasProcess: false,
      hasMaterials: false,
    },
    'pkg-merge': {
      title: '条码合并',
      mode: 'direct-exec',
      execVariant: 'pkg-merge',
      hasProcess: false,
      hasMaterials: false,
    },
    'pkg-outer': {
      title: '外包材拆组',
      mode: 'direct-exec',
      execVariant: 'pkg-outer',
      hasProcess: false,
      hasMaterials: false,
    },
    'pkg-scrap': {
      title: '报废处理',
      mode: 'pkg-doc',
      execVariant: 'pkg-scrap',
      hasProcess: true,
      hasMaterials: false,
      docsKey: 'pkg-scrap',
      partnerLabel: '产线名称',
      refLabel: '车间名称',
      searchHint: '模糊搜索报废单号/产线/物料…',
      emptyDocs: '暂无报废处理单',
      processButtons: ['外观检查', '阀门检查'],
      docTypeLabel: '报废处理',
    },
    'pkg-freeze': {
      title: '异常冻结',
      mode: 'pkg-doc',
      execVariant: 'pkg-freeze',
      hasProcess: true,
      hasMaterials: false,
      docsKey: 'pkg-freeze',
      partnerLabel: '产线名称',
      refLabel: '车间名称',
      searchHint: '模糊搜索冻结单号/产线…',
      emptyDocs: '暂无异常冻结单',
      processButtons: ['冻结检查', '状态确认'],
      docTypeLabel: '异常冻结',
    },
    'pkg-unfreeze': {
      title: '解除冻结',
      mode: 'pkg-doc',
      execVariant: 'pkg-unfreeze',
      hasProcess: true,
      hasMaterials: false,
      docsKey: 'pkg-unfreeze',
      partnerLabel: '产线名称',
      refLabel: '车间名称',
      searchHint: '模糊搜索解冻单号/产线…',
      emptyDocs: '暂无解除冻结单',
      processButtons: ['解冻检查', '状态恢复'],
      docTypeLabel: '解除冻结',
    },
    'wh-load': {
      title: '装卸',
      mode: 'count',
      execVariant: 'load',
      hasProcess: true,
      hasMaterials: true,
      docsKey: 'load',
      partnerLabel: '装卸区域',
      refLabel: '单据类型',
      searchHint: '模糊搜索单号/物料信息/装卸区域…',
      emptyDocs: '暂无待执行的装卸通知单',
      qtyLabel: '本次数量',
      addLocTitle: '装卸数量',
      addMatTitle: '装卸数量',
      doneHint: '所有物料已装卸完成',
      showDocAdd: true,
    },
    'lg-waybill': {
      title: '运单',
      mode: 'waybill',
      showDocAdd: true,
      execVariant: 'waybill',
      hasProcess: true,
      hasMaterials: false,
      docsKey: 'waybill',
      searchHint: '模糊搜索运单号/车牌/发货单位…',
      emptyDocs: '暂无待执行的运单',
    },

  };

  const lineTpl = [
    {
      lineNo: 1,
      status: '待执行',
      code: 'RM-LI2CO3',
      name: '电池级碳酸锂',
      spec: 'Li2CO3≥99.5%',
      kind: '原料',
      unit: 'Kg',
      lot: '2026012100',
      remark: '原料仓待检',
      planPcs: 50,
      planQty: 500,
      doneQty: 120,
      remainQty: 380,
      remainPcs: 38,
    },
    {
      lineNo: 2,
      status: '执行中',
      code: 'RM-LI2SO4',
      name: '电池级硫酸锂',
      spec: 'Li2SO4·H2O',
      kind: '原料',
      unit: 'Kg',
      lot: '2026012101',
      remark: '—',
      planPcs: 30,
      planQty: 300,
      doneQty: 150,
      remainQty: 150,
      remainPcs: 15,
    },
    {
      lineNo: 3,
      status: '已完成',
      code: 'RM-LIOH',
      name: '电池级氢氧化锂',
      spec: 'LiOH·H2O≥56.5%',
      kind: '原料',
      unit: 'Kg',
      lot: '2026012102',
      remark: '—',
      planPcs: 20,
      planQty: 200,
      doneQty: 200,
      remainQty: 0,
      remainPcs: 0,
    },
  ];

  function cloneLines() {
    return JSON.parse(JSON.stringify(lineTpl));
  }

  const noticesDefault = [
    {
      // 与 PC wh-po-in「单号」PO-I0001 同源联动
      id: 'PO-I0001',
      status: '待执行',
      partner: '天齐锂业股份有限公司',
      supplier: '天齐锂业股份有限公司',
      refNo: 'PO20250801001',
      poNo: 'PO20250801001',
      planDate: '2025-08-05',
      docType: '标准业务',
      logisticsNo: 'DN2026081201',
      materialSummary: 'RM-LI2CO3 电池级碳酸锂 / Li2CO3≥99.5% / 原料',
      lines: cloneLines(),
    },
    {
      // 与 PC wh-po-in「单号」PO-I0002 同源联动
      id: 'PO-I0002',
      status: '执行中',
      partner: '赣锋锂业集团股份有限公司',
      supplier: '赣锋锂业集团股份有限公司',
      refNo: 'PO20250801012',
      poNo: 'PO20250801012',
      planDate: '2025-08-06',
      docType: '紧急业务',
      logisticsNo: 'DN2026081202',
      materialSummary: 'RM-LI2CO3 电池级碳酸锂 / 原料',
      lines: [
        {
          lineNo: 1,
          status: '执行中',
          code: 'RM-LI2CO3',
          name: '电池级碳酸锂',
          spec: 'Li2CO3≥99.5%',
          kind: '原料',
          unit: 'Kg',
          lot: '2026012200',
          remark: '急单',
          planPcs: 10,
          planQty: 100,
          doneQty: 40,
          remainQty: 60,
          remainPcs: 6,
        },
      ],
    },
  ];

  const noticesInner = [
    {
      id: 'YK202508010001',
      status: '待执行',
      partner: '原料仓 A01',
      refNo: '成品仓 B02',
      planDate: '2025-08-05',
      docType: '货物移库',
      logisticsNo: '',
      materialSummary: '库内移库 · 原料→成品',
      fromWh: 'CK001',
      fromLoc: 'KW001',
      toWh: 'CK002',
      toLoc: 'KW010',
      remark: '按计划移库',
      lines: [],
    },
    {
      id: 'ZX202508010001',
      status: '执行中',
      partner: '原料仓 A01',
      refNo: '线边仓 X01',
      planDate: '2025-08-06',
      docType: '物料转序',
      logisticsNo: '',
      materialSummary: '库内转序 · 清洗→包装',
      fromWh: 'CK001',
      fromLoc: 'KW002',
      toWh: 'CK001',
      toLoc: 'KW008',
      remark: '转序作业',
      lines: [],
    },
  ];

  const noticesStock = [
    {
      id: 'PD202508010001',
      status: '待执行',
      partner: '原料仓',
      refNo: '全盘',
      takeMode: '条码盘点',
      planDate: '2025-08-05 09:10',
      planStart: '2025-08-05 09:10',
      docType: '库存全盘',
      logisticsNo: '',
      materialSummary: '原料仓全盘',
      remark: '月度盘点',
      creator: '张三',
      createTime: '2025-08-01 09:10',
      planPcs: 3,
      donePcs: 0,
      pendingPcs: 3,
      lines: cloneLines(),
    },
    {
      id: 'PD202508010002',
      status: '执行中',
      partner: '成品仓',
      refNo: '抽盘',
      takeMode: '计数盘点',
      planDate: '2025-08-06 08:00',
      planStart: '2025-08-06 08:00',
      docType: '库存抽盘',
      logisticsNo: '',
      materialSummary: '成品仓抽盘',
      remark: '抽盘作业',
      creator: '李四',
      createTime: '2025-08-02 10:00',
      planPcs: 30,
      donePcs: 20,
      pendingPcs: 10,
      lines: cloneLines().slice(0, 2),
    },
    {
      id: 'PD202508010003',
      status: '已完成',
      partner: '万物智汇',
      refNo: '全盘',
      takeMode: '条码盘点',
      planDate: '2025-07-28 09:00',
      planStart: '2025-07-28 09:00',
      docType: '库存全盘',
      materialSummary: '月结全盘',
      remark: '已结案',
      creator: '王五',
      createTime: '2025-07-27 16:00',
      planPcs: 50,
      donePcs: 50,
      pendingPcs: 0,
      lines: [],
    },
  ];

  /** 流水码档案 Mock（包材建档 / 信息查询） */
  const serialArchRows = [
    {
      barcode: 'TM202608040001',
      pkgNo: 'BK-001',
      packSpec: '吨袋1T',
      material: 'RM-Li2CO3-BG / 电池级碳酸锂 / Li2CO3≥99.5% / 锂盐原料',
      lot: 'LOT-Li-2026001',
      unit: 'KG',
      archiveQty: '1000',
      qty: '980',
      maker: '思特瑞锂业',
      supplier: '天齐锂业股份',
      prodDate: '2026-07-01',
      validPeriod: '24',
      validUnit: '月',
      expireDate: '2028-07-01',
      useStatus: '在用',
      stockStatus: '厂外',
      loc: '—',
      bindStatus: '未绑定',
      bindOuter: '—',
      step: '入厂',
      sourceNo: 'DOC2026080001',
      remark: '可编辑示例（在用+厂外）',
    },
    {
      barcode: 'TM202608040002',
      pkgNo: 'BK-002',
      packSpec: '吨袋1T',
      material: 'RM-Li2SO4-BG / 电池级硫酸锂 / Li2SO4·H2O / 锂盐原料',
      lot: 'LOT-Li-2026002',
      unit: 'KG',
      archiveQty: '1000',
      qty: '1000',
      maker: '天齐锂业股份',
      supplier: '赣锋锂业股份',
      prodDate: '2026-07-10',
      validPeriod: '24',
      validUnit: '月',
      expireDate: '2028-07-10',
      useStatus: '在用',
      stockStatus: '仓库',
      loc: 'WH-RAW-01',
      bindStatus: '已绑定',
      bindOuter: 'TM20260720001',
      step: '入库',
      sourceNo: 'DOC2026080002',
      remark: '库内不可编辑',
    },
  ];


  const noticesPkgScrap = [
    {
      id: 'BF202508060001',
      status: '待执行',
      partner: 'A产线',
      refNo: '一车间',
      planDate: '2025-08-06',
      docType: '报废处理',
      materialSummary: '外观检查、阀门检查',
      planPcs: 10,
      remark: '产线报废',
      processButtons: ['外观检查', '阀门检查'],
      lines: [],
    },
    {
      id: 'BF202508060002',
      status: '执行中',
      partner: 'B产线',
      refNo: '二车间',
      planDate: '2025-08-06',
      docType: '报废处理',
      materialSummary: '包装检查',
      planPcs: 20,
      remark: '—',
      processButtons: ['包装检查'],
      lines: [],
    },
  ];

  const noticesPkgFreeze = [
    {
      id: 'DJ202508060001',
      status: '待执行',
      partner: 'A产线',
      refNo: '一车间',
      planDate: '2025-08-06',
      docType: '异常冻结',
      materialSummary: '质量异常冻结',
      planPcs: 10,
      remark: '待检异常',
      processButtons: ['冻结检查', '状态确认'],
      lines: [],
    },
  ];

  const noticesPkgUnfreeze = [
    {
      id: 'JD202508060001',
      status: '待执行',
      partner: 'A产线',
      refNo: '一车间',
      planDate: '2025-08-06',
      docType: '解除冻结',
      materialSummary: '复检合格解冻',
      planPcs: 8,
      remark: '复检通过',
      processButtons: ['解冻检查', '状态恢复'],
      lines: [],
    },
  ];

  const waybills = [
    {
      // 与 PC WY2026081201 同源：待运输，可提货
      id: 'WY2026081201',
      status: '待运输',
      dispatchNo: 'PC2026081203',
      shipMode: '发货',
      driver: '赵六',
      plate: '川A12345',
      phone: '13900000001',
      planLoad: '2026-08-12 10:00',
      scheduleAt: '2026-08-11 16:30',
      route: '思特瑞原料仓 → 无锡客户B卸货区',
      shipNos: 'DN2026081201',
      remark: '防雨',
      actualDepart: '—',
      actualArrive: '—',
      loads: [
        {
          id: 'TH2026081201',
          type: 'load',
          status: '待确认',
          shipNo: 'DN2026081201',
          unit: '四川思特瑞科技',
          place: '思特瑞原料仓',
          contact: '王五 / 13800001111',
          material: 'M001 / 钢瓶 / φ219 / 成品',
          qty: '100 个',
          remark: '优先装货',
          lines: [
            { code: 'M001', name: '钢瓶', spec: 'φ219', kind: '成品', planQty: 100, unit: '个', actualQty: 100, remark: '', confirmed: false },
          ],
          procs: [
            { name: '装货确认', status: '待执行', user: '—', time: '—' },
            { name: '包装检查', status: '待执行', user: '—', time: '—' },
            { name: '数量核对', status: '待执行', user: '—', time: '—' },
          ],
        },
      ],
      unloads: [
        {
          id: 'RC2026081301',
          type: 'unload',
          status: '待确认',
          shipNo: 'DN2026081201',
          unit: '无锡客户B',
          place: '无锡客户B卸货区',
          contact: '周工 / 13700003333',
          due: '2026-08-13 17:00',
          material: 'M001 / 钢瓶 / φ219 / 成品',
          qty: '100 个',
          remark: '—',
          lines: [
            { code: 'M001', name: '钢瓶', spec: 'φ219', kind: '成品', planQty: 100, unit: '个', actualQty: 100, remark: '', confirmed: false },
          ],
          procs: [
            { name: '卸货确认', status: '待执行', user: '—', time: '—' },
            { name: '数量核对', status: '待执行', user: '—', time: '—' },
            { name: '异常记录', status: '待执行', user: '—', time: '—' },
          ],
        },
      ],
      enroute: { location: '', remark: '', updatedAt: '' },
    },
    {
      // 与 PC YD2026080101 同源：运输中，提货已完成，可签收/在途
      id: 'YD2026080101',
      status: '运输中',
      dispatchNo: 'PC2026081001',
      shipMode: '发货',
      driver: '钱七',
      plate: '川B67890',
      phone: '13900000002',
      planLoad: '2026-08-11 08:00',
      scheduleAt: '2026-08-10 12:00',
      route: '常州一号库装货台 → 苏州园区卸货区',
      shipNos: 'DN2026081101',
      remark: '防潮',
      actualDepart: '2026-08-11 08:35',
      actualArrive: '—',
      loads: [
        {
          id: 'TH2026081101',
          type: 'load',
          status: '已确认',
          shipNo: 'DN2026081101',
          unit: '四川思特瑞科技',
          place: '常州一号库装货台',
          contact: '仓库值班 / 0519-88880001',
          material: 'MAT001 / 氢氧化锂 / φ219 / 成品',
          qty: '8 吨',
          remark: '—',
          lines: [
            { code: 'MAT001', name: '氢氧化锂', spec: 'φ219', kind: '成品', planQty: 8, unit: '吨', actualQty: 8, remark: '', confirmed: true },
          ],
          procs: [
            { name: '装货确认', status: '已完成', user: '钱七', time: '08:35' },
            { name: '包装检查', status: '已完成', user: '钱七', time: '08:32' },
            { name: '数量核对', status: '已完成', user: '钱七', time: '08:34' },
          ],
        },
      ],
      unloads: [
        {
          id: 'RC2026081201',
          type: 'unload',
          status: '待确认',
          shipNo: 'DN2026081101',
          unit: '苏州园区',
          place: '苏州园区卸货区',
          contact: '收货员 / 0512-66660002',
          due: '2026-08-12 18:00',
          material: 'MAT001 / 氢氧化锂 / φ219 / 成品',
          qty: '8 吨',
          remark: '—',
          lines: [
            { code: 'MAT001', name: '氢氧化锂', spec: 'φ219', kind: '成品', planQty: 8, unit: '吨', actualQty: 8, remark: '', confirmed: false },
          ],
          procs: [
            { name: '卸货确认', status: '待执行', user: '—', time: '—' },
            { name: '数量核对', status: '待执行', user: '—', time: '—' },
            { name: '异常记录', status: '待执行', user: '—', time: '—' },
          ],
        },
      ],
      enroute: { location: '沪宁高速苏州段', remark: '预计准时到达', updatedAt: '2026-08-11 14:30' },
    },
  ];

  const pkgScanRows = [
    { barcode: '001', pkgNo: '001', lot: '001', process: '外观检查', done: false },
    { barcode: '002', pkgNo: '001', lot: '001', process: '外观检查', done: false },
    { barcode: '002', pkgNo: '001', lot: '001', process: '/', done: false },
  ];

  const outerScanRows = [
    { barcode: '唯一', pkgNo: '001', medium: 'NO' },
    { barcode: '001', pkgNo: '002', medium: 'NO' },
    { barcode: '002', pkgNo: '003', medium: 'NO' },
  ];


  const loadLineTpl = [
    {
      lineNo: 1,
      status: '待执行',
      code: 'A001',
      name: '钢瓶',
      spec: 'φ219',
      kind: '成品',
      unit: 'Kg',
      manageMode: '条码管理',
      lot: '—',
      remark: '优先装货',
      planPcs: 50,
      planQty: 500,
      doneQty: 120,
      remainQty: 380,
      procs: [
        { name: '装货确认', status: '待完成', summary: '→ 装货时间、封签号、铅封照片…' },
        { name: '包装检查', status: '已完成', summary: '✓ 包装完好，无破损' },
        { name: '装车核验', status: '待完成', summary: '→ 车辆号、装车件数、核验结果…' },
      ],
    },
    {
      lineNo: 2,
      status: '已完成',
      code: 'A002',
      name: '铝瓶',
      spec: 'φ165',
      kind: '半成品',
      unit: '件',
      manageMode: '计数管理',
      lot: '—',
      remark: '—',
      planPcs: 10,
      planQty: 300,
      doneQty: 300,
      remainQty: 0,
      procs: [
        { name: '装货确认', status: '已完成', summary: '✓ 已确认装货' },
        { name: '包装检查', status: '已完成', summary: '✓ 完好' },
        { name: '装车核验', status: '已完成', summary: '✓ 核验合格' },
      ],
    },
  ];

  const noticesLoad = [
    {
      id: 'ZX202508060001',
      status: '待执行',
      docType: '装货',
      planDate: '2025-08-07 08:00',
      loadArea: 'A区1号装卸台',
      partner: 'A区1号装卸台',
      refNo: '装货',
      materialSummary: 'A001 钢瓶 / φ219 / 成品',
      planPcs: 5,
      planQty: 500,
      planUnit: 'Kg',
      remark: '',
      lines: JSON.parse(JSON.stringify(loadLineTpl)),
    },
    {
      id: 'ZX202508060002',
      status: '执行中',
      docType: '卸货',
      planDate: '2025-08-08 06:00',
      loadArea: 'B区3号卸货台',
      partner: 'B区3号卸货台',
      refNo: '卸货',
      materialSummary: 'B002 铝瓶 / φ165 / 半成品',
      planPcs: 10,
      planQty: 300,
      planUnit: '件',
      remark: '注意轻放',
      lines: [
        {
          lineNo: 1,
          status: '执行中',
          code: 'B002',
          name: '铝瓶',
          spec: 'φ165',
          kind: '半成品',
          unit: '件',
          manageMode: '计数管理',
          lot: '—',
          remark: '—',
          planPcs: 10,
          planQty: 300,
          doneQty: 100,
          remainQty: 200,
          procs: [
            { name: '卸货确认', status: '已完成', summary: '✓ 卸货完成' },
            { name: '数量核对', status: '待完成', summary: '→ 实收件数、差异件数…' },
            { name: '异常记录', status: '待完成', summary: '→ 异常类型、处理方式…' },
          ],
        },
      ],
    },
  ];

  const docsMap = {
    default: noticesDefault,
    inner: noticesInner,
    stock: noticesStock,
    'pkg-scrap': noticesPkgScrap,
    'pkg-freeze': noticesPkgFreeze,
    'pkg-unfreeze': noticesPkgUnfreeze,
    waybill: waybills,
    load: noticesLoad,
  };

  const scanRowsSerial = [
    { barcode: 'SC001', qty: 20, lot: '2026012100', loc: 'A01', process: '包装', outer: '—' },
    { barcode: 'SC001', qty: 5, lot: '2026012100', loc: '—', process: '物料', outer: '—' },
    { barcode: 'SC002', qty: 20, lot: '2026012100', loc: 'A02', process: '包装', outer: '—' },
  ];

  /** 生产领料-流水码执行页扫码明细（对齐 PRD 列：条码号/包材编号/数量/原位置/批号/当前工序/外包材编号） */
  const scanRowsPick = [
    { barcode: '001', pkgNo: '鲁G-123456', qty: 20, fromLoc: 'A01-01', lot: '002', process: '包装检查', outer: 'WB001', done: false },
    { barcode: '001', pkgNo: '001', qty: 5, fromLoc: 'A01-02', lot: '002', process: '包装检查', outer: 'WB002', done: false },
    { barcode: '001', pkgNo: '001', qty: 20, fromLoc: 'A02-01', lot: '002', process: '物料检查', outer: 'WB003', done: true },
    { barcode: '002', pkgNo: '002', qty: 20, fromLoc: 'A02-02', lot: '002', process: '物料检查', outer: 'WB004', done: true },
  ];

  const lineSideWhOptions = ['XB-01 一车间线边仓', 'XB-02 二车间线边仓', 'XB-03 灌装线边仓'];
  const recommendBarcodes = [
    { barcode: 'BR20250806001', pkgNo: 'BK-1001', loc: 'A01-01', lot: '2026012100', qty: 20 },
    { barcode: 'BR20250806002', pkgNo: 'BK-1002', loc: 'A01-03', lot: '2026012100', qty: 15 },
    { barcode: 'BR20250806003', pkgNo: 'BK-1003', loc: 'A02-01', lot: '2026012101', qty: 10 },
  ];

  const tankRows = [
    {
      barcode: 'TK001',
      tankNo: '丁A',
      loc: 'A01-01',
      beforeQty: 20,
      beforeLot: 'lot001,lot002',
      afterQty: 45,
    },
  ];

  const innerScanRows = [
    { barcode: 'SC101', pkgNo: 'BK-001', code: 'RM-LI2CO3', qty: 20 },
    { barcode: 'SC102', pkgNo: 'BK-002', code: 'RM-LI2SO4', qty: 15 },
  ];

  return {
    menu: menu,
    homeModules: homeModules,
    flowMeta: flowMeta,
    docsMap: docsMap,
    notices: noticesDefault,
    scanRowsSerial: scanRowsSerial,
    scanRowsPick: scanRowsPick,
    lineSideWhOptions: lineSideWhOptions,
    recommendBarcodes: recommendBarcodes,
    tankRows: tankRows,
    innerScanRows: innerScanRows,
    pkgScanRows: pkgScanRows,
    outerScanRows: outerScanRows,
    serialArchRows: serialArchRows,
    waybills: waybills,
    tanks: ['丁A', '丁B', '戊C', '己D'],
    operator: '张三',
  };
})();

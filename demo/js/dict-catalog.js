/**
 * 思特瑞 WMS Demo · 数据字典种子与字段绑定
 * - 各业务单据的「单据类型」独立成一张字典（采购收料通知单单据类型 / 采购退料通知单单据类型 …）
 * - 物料种类、客户类型、储罐类型等共享字典按模块分组
 * - PC/APP 下拉通过 optionsFor(pageId, field, tab, MOCK.dict) 读取启用项，实现数据联动
 */
window.WMS_DICT = (function () {
  function g(id, code, name, parent, remark) {
    return { id: id, 编码: code, 名称: name, 上级字典: parent || '', 备注: remark || '', 系统开发: true, 分组节点: true };
  }
  function t(id, code, name, parent, remark) {
    return { id: id, 编码: code, 名称: name, 上级字典: parent || '', 备注: remark || '', 系统开发: true, 分组节点: false };
  }
  function i(id, typeId, code, name, remark) {
    return {
      id: id, typeId: typeId, 编码: code, 名称: name,
      启用状态: '启用', 创建人: '系统', 创建时间: '2026-08-01 08:00:00', 备注: remark || ''
    };
  }
  function itemsOf(typeId, pairs) {
    return pairs.map(function (p, idx) {
      return i(typeId + '-' + (idx + 1), typeId, p[0], p[1], p[2] || '');
    });
  }

  const types = [
    g('g-mat', 'MOD_MAT', '物料', '', '基础资料 · 物料'),
    g('g-cust', 'MOD_CUST', '客户', '', '基础资料 · 客户'),
    g('g-supp', 'MOD_SUPP', '供应商', '', '基础资料 · 供应商'),
    g('g-order', 'MOD_ORDER', '订单资料', '', '基础数据 · 订单资料'),
    g('g-pkg', 'MOD_PKG', '包材资料', '', '基础数据 · 包材资料'),
    g('g-wh', 'MOD_WH', '仓储管理', '', '仓储单据与作业字典'),
    g('g-wh-po', 'MOD_WH_PO', '采购', 'g-wh', '采购收料/退料'),
    g('g-wh-os', 'MOD_WH_OS', '委外', 'g-wh', '委外发料/退料/收货/退货'),
    g('g-wh-prod', 'MOD_WH_PROD', '生产', 'g-wh', '生产领料/退料/入库'),
    g('g-wh-cs', 'MOD_WH_CS', '受托', 'g-wh', '受托收料/退料'),
    g('g-wh-so', 'MOD_WH_SO', '销售', 'g-wh', '备货/预出货/发货/退货'),
    g('g-wh-oth', 'MOD_WH_OTH', '其他', 'g-wh', '其他入出库'),
    g('g-wh-inner', 'MOD_WH_INNER', '库内', 'g-wh', '转移/转序'),
    g('g-wh-load', 'MOD_WH_LOAD', '装卸', 'g-wh', '装卸货'),
    g('g-wh-st', 'MOD_WH_ST', '盘点', 'g-wh', '库存全盘'),
    g('g-lg-data', 'MOD_LG_DATA', '物流资料', '', '车辆/运费'),
    g('g-lg', 'MOD_LG', '物流管理', '', '承运商事件'),
    g('g-bc', 'MOD_BC', '条码管理', '', '报废/冻结'),

    t('t1', 'MAT_KIND', '物料种类', 'g-mat', '物料主数据分类'),
    t('t2', 'MAT_SPEC', '物料规格', 'g-mat', '锂盐规格等级'),
    t('t3', 'CUST_TYPE', '客户类型', 'g-cust', ''),
    t('t5', 'SALE_AREA', '销售区域', 'g-cust', ''),
    t('t4', 'SUPP_TYPE', '供应商类型', 'g-supp', ''),
    t('d-po-type', 'PO_TYPE', '采购类型', 'g-order', ''),
    t('d-so-type', 'SO_TYPE', '销售类型', 'g-order', ''),
    t('d-ww-type', 'WWPO_TYPE', '委外类型', 'g-order', ''),
    t('d-tank-type', 'TANK_TYPE', '储罐类型', 'g-pkg', ''),
    t('d-fill', 'FILL_MEDIA', '充装介质', 'g-pkg', ''),
    t('d-vol', 'TANK_VOL', '容积', 'g-pkg', ''),
    t('d-outer-t', 'OUTER_TYPE', '外包材类型', 'g-pkg', ''),
    t('d-outer-m', 'OUTER_MAT', '外包材材质', 'g-pkg', ''),
    t('d-pkg-spec', 'PKG_SPEC', '包装规格', 'g-pkg', ''),

    t('d-po-in-n', 'DOC_PO_IN_NOTICE', '采购收料通知单单据类型', 'g-wh-po', ''),
    t('d-po-in-o', 'DOC_PO_IN_ORDER', '采购入库单单据类型', 'g-wh-po', ''),
    t('d-po-ret-n', 'DOC_PO_RET_NOTICE', '采购退料通知单单据类型', 'g-wh-po', ''),
    t('d-po-ret-o', 'DOC_PO_RET_OUT', '采购退料出库单单据类型', 'g-wh-po', ''),
    t('d-os-iss-n', 'DOC_OS_ISSUE_NOTICE', '委外发料通知单单据类型', 'g-wh-os', ''),
    t('d-os-iss-o', 'DOC_OS_ISSUE_OUT', '委外发料出库单单据类型', 'g-wh-os', ''),
    t('d-os-ret-n', 'DOC_OS_RET_NOTICE', '委外退料通知单单据类型', 'g-wh-os', ''),
    t('d-os-ret-o', 'DOC_OS_RET_IN', '委外退料入库单单据类型', 'g-wh-os', ''),
    t('d-os-rcv-n', 'DOC_OS_RECV_NOTICE', '委外收货通知单单据类型', 'g-wh-os', ''),
    t('d-os-rcv-o', 'DOC_OS_RECV_IN', '委外收货入库单单据类型', 'g-wh-os', ''),
    t('d-os-rma-n', 'DOC_OS_RMA_NOTICE', '委外退货通知单单据类型', 'g-wh-os', ''),
    t('d-os-rma-o', 'DOC_OS_RMA_OUT', '委外退货出库单单据类型', 'g-wh-os', ''),
    t('d-pr-iss-n', 'DOC_PROD_ISSUE_NOTICE', '生产领料申请单单据类型', 'g-wh-prod', ''),
    t('d-pr-iss-o', 'DOC_PROD_ISSUE_OUT', '生产领料出库单单据类型', 'g-wh-prod', ''),
    t('d-pr-ret-n', 'DOC_PROD_RET_NOTICE', '生产退料申请单单据类型', 'g-wh-prod', ''),
    t('d-pr-ret-o', 'DOC_PROD_RET_IN', '生产退料入库单单据类型', 'g-wh-prod', ''),
    t('d-pr-in-n', 'DOC_PROD_IN_NOTICE', '生产入库申请单单据类型', 'g-wh-prod', ''),
    t('d-pr-in-o', 'DOC_PROD_IN_ORDER', '生产入库单单据类型', 'g-wh-prod', ''),
    t('d-pr-biz', 'PROD_IN_BIZ', '生产入库业务类型', 'g-wh-prod', ''),
    t('d-pr-pick-t', 'PROD_ISSUE_PICK_TYPE', '生产领料领料类型', 'g-wh-prod', '生产领料 / 备品备件领料'),
    t('d-cs-rcv-n', 'DOC_CS_RECV_NOTICE', '受托收料通知单单据类型', 'g-wh-cs', ''),
    t('d-cs-ret-n', 'DOC_CS_RET_NOTICE', '受托退料通知单单据类型', 'g-wh-cs', ''),
    t('d-so-prep', 'DOC_SO_PREP', '备货通知单单据类型', 'g-wh-so', ''),
    t('d-so-pre-n', 'DOC_SO_PREOUT_NOTICE', '销售预出货通知单单据类型', 'g-wh-so', ''),
    t('d-so-pre-o', 'DOC_SO_PREOUT_OUT', '销售预出货出库单单据类型', 'g-wh-so', ''),
    t('d-so-ship', 'DOC_SO_SHIP_NOTICE', '销售发货通知单单据类型', 'g-wh-so', ''),
    t('d-so-ship-o', 'DOC_SO_SHIP_OUT', '销售发货出库单单据类型', 'g-wh-so', ''),
    t('d-so-ret', 'DOC_SO_RET_NOTICE', '销售退货通知单单据类型', 'g-wh-so', ''),
    t('d-so-ret-in', 'DOC_SO_RET_IN', '销售退货入库单单据类型', 'g-wh-so', ''),
    t('d-oth-in', 'DOC_OTH_IN_NOTICE', '其他入库通知单单据类型', 'g-wh-oth', ''),
    t('d-oth-out', 'DOC_OTH_OUT_NOTICE', '其他出库通知单单据类型', 'g-wh-oth', ''),
    t('d-in-dir', 'IN_DIR', '入库方向', 'g-wh-oth', ''),
    t('d-out-dir', 'OUT_DIR', '出库方向', 'g-wh-oth', ''),
    t('d-xfer', 'DOC_XFER', '库内转移单单据类型', 'g-wh-inner', ''),
    t('d-direct-xfer', 'DOC_DIRECT_XFER', '直接调拨申请单单据类型', 'g-wh-inner', ''),
    t('d-seq', 'DOC_SEQ', '库内转序单单据类型', 'g-wh-inner', ''),
    t('d-load-n', 'DOC_LOAD_NOTICE', '装卸货通知单单据类型', 'g-wh-load', ''),
    t('d-load-t', 'LOAD_TYPE', '装卸类型', 'g-wh-load', ''),
    t('d-plant', 'LG_PLANT', '物流厂区', 'g-wh-load', ''),
    t('d-st-type', 'ST_TYPE', '盘点类型', 'g-wh-st', ''),
    t('d-st-mode', 'ST_MODE', '盘点方式', 'g-wh-st', ''),

    t('d-emit', 'EMIT_STAGE', '环保排放阶段', 'g-lg-data', ''),
    t('d-scope', 'VEH_SCOPE', '经营范围', 'g-lg-data', ''),
    t('d-veh', 'VEH_MODEL', '车型', 'g-lg-data', ''),
    t('d-fee', 'FEE_UNIT', '计费单位', 'g-lg-data', ''),
    t('d-evt-m', 'EVT_MAJOR', '事件大类', 'g-lg', ''),
    t('d-evt-lv', 'EVT_LEVEL', '事件等级', 'g-lg', ''),

    t('d-scrap', 'DOC_SCRAP', '报废处理单单据类型', 'g-bc', ''),
    t('d-freeze', 'DOC_FREEZE', '异常冻结单单据类型', 'g-bc', ''),
    t('d-unfreeze', 'DOC_UNFREEZE', '冻结解除单单据类型', 'g-bc', ''),
    t('d-outer-sp', 'DOC_OUTER_SPLIT', '外包材拆组单单据类型', 'g-bc', ''),
  ];

  const items = []
    .concat(itemsOf('t1', [
      ['RAW_LI', '锂盐原料'], ['RAW_EL', '电解液原料'], ['AUX', '辅料'], ['FG_LI', '锂盐成品'],
      ['PKG', '包材'], ['HAZ', '危化原料'], ['GAS', '气体'], ['LIQ', '液体']
    ]))
    .concat(itemsOf('t2', [
      ['BG', '电池级', 'Li2CO3≥99.5%'], ['IG', '工业级'], ['EG', '电子级'],
      ['LI2CO3', 'Li2CO3≥99.5%'], ['LI2SO4', 'Li2SO4·H2O'], ['LIOH', 'LiOH·H2O'],
      ['TON', '吨袋1T'], ['P219', 'φ219'], ['P165', 'φ165'], ['PCT98', '98%'], ['PCT32', '32%']
    ]))
    .concat(itemsOf('t3', [['DOM_C', '国内客户'], ['FOR_C', '国外客户']]))
    .concat(itemsOf('t4', [['DOM_S', '国内供应商'], ['FOR_S', '国外供应商'], ['OS', '委外加工商']]))
    .concat(itemsOf('t5', [['EA', '华东'], ['SC', '华南'], ['NC', '华北'], ['SW', '西南'], ['NW', '西北'], ['EX', '出口']]))
    .concat(itemsOf('d-po-type', [['STD', '标准采购'], ['LTA', '长协采购'], ['URG', '紧急采购'], ['RAW', '原材料'], ['SP', '备品备件']]))
    .concat(itemsOf('d-so-type', [['NML', '正常销售'], ['TRD', '纯贸易'], ['FG', '成品销售'], ['FILL', '代充业务'], ['STD', '标准销售'], ['CON', '寄售']]))
    .concat(itemsOf('d-ww-type', [['PUR', '委外提纯'], ['MIL', '委外粉碎'], ['REP', '委外改包']]))
    .concat(itemsOf('d-tank-type', [['FIX', '固定罐'], ['MOV', '移动罐'], ['TKR', '槽罐']]))
    .concat(itemsOf('d-fill', [['SLU', '高纯碳酸锂料浆'], ['LIOH', '氢氧化锂溶液'], ['WATER', '纯水'], ['NMP', 'NMP'], ['LN2', '液氮']]))
    .concat(itemsOf('d-vol', [['V50', '50m³'], ['V30', '30m³'], ['V80', '80m³'], ['V1000', '1000L'], ['V500', '500L'], ['V200', '200L']]))
    .concat(itemsOf('d-outer-t', [['STD', '标准'], ['HVY', '重型'], ['LGT', '轻型']]))
    .concat(itemsOf('d-outer-m', [['PP', 'PP吨袋'], ['PE', 'PE内衬'], ['AL', '铝合金'], ['SS316', '不锈钢316'], ['SS304', '不锈钢304']]))
    .concat(itemsOf('d-pkg-spec', [
      ['TONBAG', '1000L吨袋'], ['DRUM200', '200L标准桶'], ['BOX', '标准箱'], ['KG1000', '1000Kg/袋'],
      ['PALLET', '吨袋+托架'], ['TKR', '槽车散装/储罐'], ['NONE', '计数/无包材'], ['L40', '40L']
    ]))
    .concat(itemsOf('d-po-in-n', [['STD', '标准采购入库'], ['URG', '紧急采购入库']]))
    .concat(itemsOf('d-po-in-o', [['ORD', '采购入库单']]))
    .concat(itemsOf('d-po-ret-n', [['STD', '标准采购退料'], ['URG', '紧急采购退料']]))
    .concat(itemsOf('d-po-ret-o', [['OUT', '采购退料出库单']]))
    .concat(itemsOf('d-os-iss-n', [['STD', '标准委外发料'], ['URG', '紧急委外发料']]))
    .concat(itemsOf('d-os-iss-o', [['OUT', '委外发料']]))
    .concat(itemsOf('d-os-ret-n', [['STD', '标准委外退料'], ['URG', '紧急委外退料'], ['URG2', '紧急退料']]))
    .concat(itemsOf('d-os-ret-o', [['IN', '委外退料']]))
    .concat(itemsOf('d-os-rcv-n', [['STD', '标准委外收货'], ['URG', '紧急委外收货']]))
    .concat(itemsOf('d-os-rcv-o', [['IN', '委外收货']]))
    .concat(itemsOf('d-os-rma-n', [['STD', '标准委外退货'], ['URG', '紧急委外退货']]))
    .concat(itemsOf('d-os-rma-o', [['OUT', '委外退货']]))
    .concat(itemsOf('d-pr-iss-n', [['APP', '生产领料申请单']]))
    .concat(itemsOf('d-pr-iss-o', [['OUT', '生产领料出库单']]))
    .concat(itemsOf('d-pr-ret-n', [['APP', '生产退料申请单']]))
    .concat(itemsOf('d-pr-ret-o', [['IN', '生产退料入库单']]))
    .concat(itemsOf('d-pr-in-n', [['APP', '生产入库申请单']]))
    .concat(itemsOf('d-pr-in-o', [['ORD', '生产入库单']]))
    .concat(itemsOf('d-pr-biz', [['SELF', '自产完工'], ['CS', '受托加工完工']]))
    .concat(itemsOf('d-pr-pick-t', [['PROD', '生产领料'], ['SPARE', '备品备件领料']]))
    .concat(itemsOf('d-cs-rcv-n', [['N', '受托收料通知单'], ['A', '受托收料']]))
    .concat(itemsOf('d-cs-ret-n', [['N', '受托退料通知单'], ['A', '受托退料']]))
    .concat(itemsOf('d-so-prep', [['NML', '正常备货'], ['URG', '紧急备货']]))
    .concat(itemsOf('d-so-pre-n', [['NML', '标准预出货'], ['URG', '紧急预出货'], ['SMP', '样品预出货']]))
    .concat(itemsOf('d-so-pre-o', [['OUT', '销售预出货出库单']]))
    .concat(itemsOf('d-so-ship', [['NML', '标准发货'], ['URG', '紧急发货'], ['SMP', '样品发货']]))
    .concat(itemsOf('d-so-ret', [['NML', '标准退货'], ['REJ', '拒收退货'], ['EXG', '换货退货']]))
    .concat(itemsOf('d-oth-in', [['GAIN', '盘盈入库'], ['SMPL', '样品入库'], ['RD', '研发入库']]))
    .concat(itemsOf('d-oth-out', [['LOSS', '盘亏出库'], ['SMPL', '样品出库'], ['RD', '研发领用']]))
    .concat(itemsOf('d-in-dir', [['OUT', '厂外'], ['LINE', '线边仓'], ['PROD_RET', '生产退料'], ['GAIN', '盘盈入库'], ['XFER', '调拨入库'], ['OTH', '其他入库']]))
    .concat(itemsOf('d-out-dir', [['OUT', '厂外'], ['LINE', '线边仓'], ['PROD', '生产领料'], ['LOSS', '盘亏出库'], ['XFER', '调拨出库'], ['OTH', '其他出库']]))
    .concat(itemsOf('d-xfer', [['MV', '库内移库'], ['A', '库内转移']]))
    .concat(itemsOf('d-direct-xfer', [['N', '直接调拨申请单']]))
    .concat(itemsOf('d-seq', [['CODE', '编码转换'], ['LOT', '批号转换'], ['A', '库内转序']]))
    .concat(itemsOf('d-load-n', [['STD', '标准装卸'], ['URG', '紧急装卸'], ['MV', '厂内移库装卸']]))
    .concat(itemsOf('d-load-t', [['IN', '装货'], ['OUT', '卸货']]))
    .concat(itemsOf('d-plant', [['HQ', '总厂'], ['A', '分厂A'], ['B', '分厂B']]))
    .concat(itemsOf('d-st-type', [['FULL', '全盘'], ['SAMPLE', '抽盘']]))
    .concat(itemsOf('d-st-mode', [['BC', '条码盘点'], ['CNT', '计数盘点']]))
    .concat(itemsOf('d-emit', [['G6', '国六'], ['G5', '国五'], ['G4', '国四'], ['EV', '纯电动'], ['H2', '氢燃料']]))
    .concat(itemsOf('d-scope', [['GEN', '普货'], ['HAZ', '危货']]))
    .concat(itemsOf('d-veh', [['T13', '13米半挂'], ['H96', '9.6米高栏'], ['TKR', '槽罐车'], ['VAN', '厢式货车']]))
    .concat(itemsOf('d-fee', [['TON', '吨'], ['KG', '公斤'], ['TRK', '车'], ['M3', '立方米']]))
    .concat(itemsOf('d-evt-m', [['CARGO', '货物异常'], ['TIME', '时效异常'], ['DOC', '单据异常'], ['SVC', '服务异常']]))
    .concat(itemsOf('d-evt-lv', [['L1', '轻微'], ['L2', '一般'], ['L3', '严重'], ['L4', '重大']]))
    .concat(itemsOf('d-scrap', [['N', '报废处理单']]))
    .concat(itemsOf('d-freeze', [['N', '异常冻结单']]))
    .concat(itemsOf('d-unfreeze', [['N', '冻结解除单']]))
    .concat(itemsOf('d-outer-sp', [['N', '外包材拆组单']]));

  const binds = {
    '物料种类': 'MAT_KIND',
    '物料规格': 'MAT_SPEC',
    '客户类型': 'CUST_TYPE',
    '供应商类型': 'SUPP_TYPE',
    '销售区域': 'SALE_AREA',
    '采购类型': 'PO_TYPE',
    '销售类型': 'SO_TYPE',
    '委外类型': 'WWPO_TYPE',
    '储罐类型': 'TANK_TYPE',
    '充装介质': 'FILL_MEDIA',
    '容积': 'TANK_VOL',
    '外包材类型': 'OUTER_TYPE',
    '外包材材质': 'OUTER_MAT',
    '包装规格': 'PKG_SPEC',
    '装卸类型': 'LOAD_TYPE',
    '入库方向': 'IN_DIR',
    '出库方向': 'OUT_DIR',
    '物流厂区': 'LG_PLANT',
    '盘点类型': 'ST_TYPE',
    '盘点方式': 'ST_MODE',
    '环保排放阶段': 'EMIT_STAGE',
    '经营范围': 'VEH_SCOPE',
    '车型': 'VEH_MODEL',
    '计费单位': 'FEE_UNIT',
    '事件大类': 'EVT_MAJOR',
    '事件等级': 'EVT_LEVEL',
    '领料类型': 'PROD_ISSUE_PICK_TYPE',
    'wh-prod-issue|领料类型': 'PROD_ISSUE_PICK_TYPE',
    'wh-prod-in|业务类型': 'PROD_IN_BIZ',
    'wh-po-in|单据类型': 'DOC_PO_IN_NOTICE',
    'wh-po-in|tab1|单据类型': 'DOC_PO_IN_NOTICE',
    'wh-po-in|tab2|单据类型': 'DOC_PO_IN_ORDER',
    'wh-po-ret|单据类型': 'DOC_PO_RET_NOTICE',
    'wh-po-ret|tab1|单据类型': 'DOC_PO_RET_NOTICE',
    'wh-po-ret|tab2|单据类型': 'DOC_PO_RET_OUT',
    'wh-os-issue|单据类型': 'DOC_OS_ISSUE_NOTICE',
    'wh-os-issue|tab1|单据类型': 'DOC_OS_ISSUE_NOTICE',
    'wh-os-issue|tab2|单据类型': 'DOC_OS_ISSUE_OUT',
    'wh-os-ret-mat|单据类型': 'DOC_OS_RET_NOTICE',
    'wh-os-ret-mat|tab1|单据类型': 'DOC_OS_RET_NOTICE',
    'wh-os-ret-mat|tab2|单据类型': 'DOC_OS_RET_IN',
    'wh-os-recv|单据类型': 'DOC_OS_RECV_NOTICE',
    'wh-os-recv|tab1|单据类型': 'DOC_OS_RECV_NOTICE',
    'wh-os-recv|tab2|单据类型': 'DOC_OS_RECV_IN',
    'wh-os-ret-goods|单据类型': 'DOC_OS_RMA_NOTICE',
    'wh-os-ret-goods|tab1|单据类型': 'DOC_OS_RMA_NOTICE',
    'wh-os-ret-goods|tab2|单据类型': 'DOC_OS_RMA_OUT',
    'wh-prod-issue|单据类型': 'DOC_PROD_ISSUE_NOTICE',
    'wh-prod-issue|tab1|单据类型': 'DOC_PROD_ISSUE_NOTICE',
    'wh-prod-issue|tab2|单据类型': 'DOC_PROD_ISSUE_OUT',
    'wh-prod-ret|单据类型': 'DOC_PROD_RET_NOTICE',
    'wh-prod-ret|tab1|单据类型': 'DOC_PROD_RET_NOTICE',
    'wh-prod-ret|tab2|单据类型': 'DOC_PROD_RET_IN',
    'wh-prod-in|单据类型': 'DOC_PROD_IN_NOTICE',
    'wh-prod-in|tab1|单据类型': 'DOC_PROD_IN_NOTICE',
    'wh-prod-in|tab2|单据类型': 'DOC_PROD_IN_ORDER',
    'wh-cs-recv|单据类型': 'DOC_CS_RECV_NOTICE',
    'wh-cs-ret|单据类型': 'DOC_CS_RET_NOTICE',
    'wh-so-prep|单据类型': 'DOC_SO_PREP',
    'wh-so-preout|单据类型': 'DOC_SO_PREOUT_NOTICE',
    'wh-so-preout|tab1|单据类型': 'DOC_SO_PREOUT_NOTICE',
    'wh-so-preout|tab2|单据类型': 'DOC_SO_PREOUT_OUT',
    'wh-so-ship|单据类型': 'DOC_SO_SHIP_NOTICE',
    'wh-so-ret|单据类型': 'DOC_SO_RET_NOTICE',
    'wh-so-ret|tab2|单据类型': 'DOC_SO_RET_IN',
    'wh-other-in|单据类型': 'DOC_OTH_IN_NOTICE',
    'wh-other-out|单据类型': 'DOC_OTH_OUT_NOTICE',
    'wh-load|单据类型': 'DOC_LOAD_NOTICE',
    'wh-transfer|单据类型': 'DOC_XFER',
    'wh-direct-xfer|单据类型': 'DOC_DIRECT_XFER',
    'wh-seq|单据类型': 'DOC_SEQ',
    'bc-scrap-proc|单据类型': 'DOC_SCRAP',
    'bc-freeze|单据类型': 'DOC_FREEZE',
    'bc-unfreeze|单据类型': 'DOC_UNFREEZE',
    'bc-outer-split|单据类型': 'DOC_OUTER_SPLIT',
  };

  const appFlows = {
    DOC_PO_IN_NOTICE: ['po-in-serial', 'po-in-count', 'po-in-tank'],
    DOC_PO_RET_NOTICE: ['po-ret-serial', 'po-ret-count'],
    DOC_OS_ISSUE_NOTICE: ['os-issue-serial', 'os-issue-count'],
    DOC_OS_RET_NOTICE: ['os-ret-serial', 'os-ret-count'],
    DOC_OS_RECV_NOTICE: ['os-recv-serial', 'os-recv-count', 'os-recv-tank'],
    DOC_OS_RMA_NOTICE: ['os-rma-serial', 'os-rma-count'],
    DOC_PROD_ISSUE_NOTICE: ['prod-pick-serial', 'prod-pick-count', 'prod-pick-tank'],
    DOC_PROD_RET_NOTICE: ['prod-ret-serial', 'prod-ret-count', 'prod-ret-tank'],
    DOC_PROD_IN_NOTICE: ['prod-in-serial', 'prod-in-count'],
    DOC_CS_RECV_NOTICE: ['trust-recv-serial', 'trust-recv-count', 'trust-recv-tank'],
    DOC_CS_RET_NOTICE: ['trust-ret-serial', 'trust-ret-count'],
    DOC_SO_SHIP_NOTICE: ['so-ship-serial', 'so-ship-count'],
    DOC_SO_RET_NOTICE: ['so-rma-serial', 'so-rma-count'],
    DOC_OTH_IN_NOTICE: ['oth-in-serial', 'oth-in-count', 'oth-in-tank'],
    DOC_OTH_OUT_NOTICE: ['oth-out-serial', 'oth-out-count', 'oth-out-tank'],
    DOC_LOAD_NOTICE: ['wh-load'],
    DOC_XFER: ['inner-move'],
    DOC_SEQ: ['inner-xfer'],
    ST_TYPE: ['stock-take'],
    DOC_SCRAP: ['pkg-scrap'],
    DOC_FREEZE: ['pkg-freeze'],
    DOC_UNFREEZE: ['pkg-unfreeze'],
    DOC_OUTER_SPLIT: ['pkg-outer'],
  };
  Object.keys(appFlows).forEach(function (code) {
    appFlows[code].forEach(function (fid) {
      binds[fid + '|单据类型'] = code;
    });
  });
  binds['stock-take|盘点类型'] = 'ST_TYPE';
  binds['wh-load|装卸类型'] = 'LOAD_TYPE';
  ['prod-pick-serial', 'prod-pick-count', 'prod-pick-tank'].forEach(function (fid) {
    binds[fid + '|领料类型'] = 'PROD_ISSUE_PICK_TYPE';
  });

  function liveDict(mockDict) {
    if (mockDict && Array.isArray(mockDict.types) && mockDict.types.length) return mockDict;
    return { types: types, main: items };
  }
  function typeIdOf(code, dict) {
    const hit = (dict.types || []).find(function (x) { return x.编码 === code; });
    return hit ? hit.id : '';
  }
  function enabledNames(code, mockDict) {
    const dict = liveDict(mockDict);
    const tid = typeIdOf(code, dict);
    if (!tid) return [];
    const names = [];
    (dict.main || []).forEach(function (r) {
      if (r.typeId !== tid) return;
      if (r['启用状态'] === '禁用') return;
      const n = String(r['名称'] || '').trim();
      if (n && names.indexOf(n) < 0) names.push(n);
    });
    return names;
  }
  function resolveCode(pageId, field, tab) {
    if (!field) return '';
    const p = String(pageId || '');
    const tb = String(tab || '');
    if (p && tb && binds[p + '|' + tb + '|' + field]) return binds[p + '|' + tb + '|' + field];
    if (p && binds[p + '|' + field]) return binds[p + '|' + field];
    return binds[field] || '';
  }
  function optionsFor(pageId, field, tab, mockDict) {
    const code = resolveCode(pageId, field, tab);
    if (!code) return null;
    return enabledNames(code, mockDict);
  }
  function firstOption(pageId, field, tab, mockDict) {
    const opts = optionsFor(pageId, field, tab, mockDict) || [];
    return opts[0] || '';
  }
  function mergeInto(target) {
    if (!target) return false;
    if (!target.dict) target.dict = { types: [], main: [] };
    const dict = target.dict;
    dict.types = Array.isArray(dict.types) ? dict.types : [];
    dict.main = Array.isArray(dict.main) ? dict.main : [];
    const before = JSON.stringify({ types: dict.types, main: dict.main });
    const byId = {};
    const byCode = {};
    dict.types.forEach(function (row) {
      if (!row) return;
      if (row.id) byId[row.id] = row;
      if (row.编码) byCode[row.编码] = row;
    });
    types.forEach(function (seed) {
      const exist = byId[seed.id] || byCode[seed.编码];
      if (exist) {
        exist.id = seed.id;
        exist.编码 = seed.编码;
        exist.名称 = seed.名称;
        exist.上级字典 = seed.上级字典;
        exist.系统开发 = true;
        exist.分组节点 = !!seed.分组节点;
        if (!exist.备注) exist.备注 = seed.备注;
        byId[seed.id] = exist;
        byCode[seed.编码] = exist;
      } else {
        const row = Object.assign({}, seed);
        dict.types.push(row);
        byId[row.id] = row;
        byCode[row.编码] = row;
      }
    });
    const itemByKey = {};
    dict.main.forEach(function (row) {
      if (!row) return;
      itemByKey[row.id] = row;
      itemByKey[(row.typeId || '') + '#' + (row.编码 || '')] = row;
    });
    items.forEach(function (seed) {
      const liveType = byId[seed.typeId];
      const liveTypeId = liveType ? liveType.id : seed.typeId;
      const exist = itemByKey[seed.id] || itemByKey[liveTypeId + '#' + seed.编码];
      if (exist) {
        exist.typeId = liveTypeId;
        if (!exist.编码) exist.编码 = seed.编码;
        if (!exist.名称) exist.名称 = seed.名称;
      } else {
        const row = Object.assign({}, seed, { typeId: liveTypeId });
        dict.main.push(row);
        itemByKey[row.id] = row;
      }
    });
    const knownParent = {};
    types.forEach(function (seed) { knownParent[seed.编码] = seed.上级字典; });
    dict.types.forEach(function (row) {
      if (row.分组节点 && !row.上级字典) return;
      const want = knownParent[row.编码];
      if (want != null) row.上级字典 = want;
    });
    return before !== JSON.stringify({ types: dict.types, main: dict.main });
  }

  return {
    types: types,
    items: items,
    binds: binds,
    enabledNames: enabledNames,
    resolveCode: resolveCode,
    optionsFor: optionsFor,
    firstOption: firstOption,
    mergeInto: mergeInto,
  };
})();

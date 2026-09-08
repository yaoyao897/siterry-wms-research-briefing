#!/usr/bin/env python3
"""Generate mock-rows.js for 思特瑞 WMS Demo prototype.

Run: python3 generate_mock_rows.py
Output: mock-rows.js (same directory)
"""
from __future__ import annotations

import copy
import json
import re
from pathlib import Path

VERSION = "1.3.309"
OUT_DIR = Path(__file__).resolve().parent
OUT_FILE = OUT_DIR / "mock-rows.js"
SEED_FILE = OUT_DIR / "mock-rows.js"

MODULE_TABS: dict[str, list[str]] = {
    "mat-list": ["main"],
    "mat-uom": ["main"],
    "mat-medium": ["main"],
    "customer": ["main"],
    "supplier": ["main"],
    "unit": ["main"],
    "dict": ["types", "main"],
    "warehouse": ["tab1", "tab2"],
    "line-side": ["main"],
    "stock-warn": ["tab1", "tab2"],
    "insp-proc": ["main"],
    "insp-craft": ["main"],
    "po": ["main", "detailLines"],
    "so": ["main", "detailLines"],
    "wwpo": ["main", "detailLines"],
    "wh-insp-scheme": ["main"],
    "wh-insp-plan": ["tab1", "tab2"],
    "serial-arch": ["main"],
    "tank-arch": ["main"],
    "app-view-cfg": ["main"],
    "pkg-proc": ["main"],
    "pkg-craft": ["main"],
    "outer-serial": ["main", "detailLines"],
    "label-ds": ["main"],
    "label-cfg": ["main"],
    "print-task": ["main"],
    "form-ds": ["main"],
    "form-designer": ["main"],
    "wh-po-in": ["tab1", "tab2", "tab3"],
    "wh-po-ret": ["tab1", "tab2", "tab3", "detailLines"],
    "wh-os-issue": ["tab1", "tab2", "tab3", "detailLines"],
    "wh-os-ret-mat": ["tab1", "tab2", "tab3", "detailLines"],
    "wh-os-recv": ["tab1", "tab2", "tab3", "detailLines"],
    "wh-os-ret-goods": ["tab1", "tab2", "tab3", "detailLines"],
    "wh-prod-issue": ["tab1", "tab2", "tab3", "detailLines"],
    "wh-prod-ret": ["tab1", "tab2", "tab3", "detailLines"],
    "wh-prod-in": ["tab1", "tab2", "tab3", "detailLines"],
    "wh-cs-recv": ["tab1", "tab2", "tab3", "detailLines"],
    "wh-cs-ret": ["tab1", "tab2", "tab3", "detailLines"],
    "wh-so-prep": ["main", "detailLines"],
    "wh-so-preout": ["tab1", "tab2", "tab3", "detailLines"],
    "wh-so-ship": ["tab1", "tab2", "tab3", "detailLines"],
    "wh-so-ret": ["tab1", "tab2", "tab3", "detailLines"],
    "wh-other-in": ["tab1", "tab2", "tab3", "detailLines"],
    "wh-other-out": ["tab1", "tab2", "tab3", "detailLines"],
    "wh-load": ["tab1", "tab2", "tab3"],
    "wh-direct-xfer": ["tab1", "tab2", "tab3", "detailLines"],
    "wh-transfer": ["tab1", "tab2"],
    "wh-seq": ["tab1", "tab2"],
    "wh-stocktake": ["main", "stockInvLines", "stockBarcodeLines"],
    "count-inv": ["main"],
    "wh-inv-rpt": ["tab1", "tab2", "tab3", "tab4", "tab5"],
    "carrier": ["main"],
    "vehicle": ["main"],
    "driver": ["main"],
    "freight": ["main"],
    "lg-dispatch": ["main", "detailLines"],
    "lg-ship": ["main", "detailLines"],
    "lg-waybill": ["main", "detailLines", "enrouteLines"],
    "lg-pickup": ["main"],
    "lg-sign": ["main"],
    "lg-gatepass": ["main"],
    "lg-carrier-evt": ["main"],
    "lg-kpi-scheme": ["main"],
    "lg-kpi-plan": ["main"],
    "lg-kpi-record": ["main"],
    "bc-tank-hist": ["main"],
    "bc-serial-split": ["main"],
    "bc-serial-merge": ["main"],
    "bc-outer-split": ["main"],
    "bc-scrap-list": ["main"],
    "bc-scrap-proc": ["tab1", "tab2"],
    "bc-freeze-list": ["main"],
    "bc-freeze": ["tab1", "tab2"],
    "bc-unfreeze": ["tab1", "tab2"],
    "qc-ledger": ["main"],
}

STATUSES = ["待执行", "执行中", "已完成", "已关闭", "待审核"]
AUDIT_STATUSES = ["待审核", "已通过", "已驳回"]
WAYBILL_STATUSES = ["待派车", "待运输", "运输中", "已完成", "已关闭"]
QC_JUDGMENTS = ["待判定", "合格", "不合格"]

SUPPLIERS = [
    ("V-天齐锂业", "天齐锂业股份"),
    ("V-赣锋锂业", "赣锋锂业股份"),
    ("V-雅化集团", "雅化集团"),
    ("V-盐湖股份", "盐湖股份"),
    ("V-中化蓝天", "中化蓝天"),
]

CUSTOMERS = [
    ("C-宁德时代", "宁德时代新能源"),
    ("C-比亚迪", "比亚迪锂电"),
    ("C-国轩高科", "国轩高科"),
    ("C-亿纬锂能", "亿纬锂能"),
    ("C-蜂巢能源", "蜂巢能源"),
]

MATERIALS = {
    "RM-Li2CO3-BG": ("电池级碳酸锂", "Li2CO3≥99.5%", "锂盐原料"),
    "RM-LiOH-BG": ("电池级氢氧化锂", "LiOH·H2O", "锂盐原料"),
    "RM-Li2SO4-BG": ("电池级硫酸锂", "Li2SO4·H2O", "锂盐原料"),
    "FG-Li2CO3-BG": ("电池级碳酸锂成品", "吨袋1T", "锂盐成品"),
    "RM-H2SO4": ("工业浓硫酸", "98%", "危化原料"),
    "RM-NaOH": ("液碱", "32%", "危化原料"),
    "PM-TONBAG": ("吨袋", "1T", "包材"),
    "RM-NMP": ("NMP溶剂", "电子级", "辅料"),
}

CREATORS = ["王强", "李敏", "陈伟", "赵丽", "周杰", "张三", "李四"]

# Cross-link demo chain constants
PO_NO = "CGDD202608120001"
DISPATCH_NO = "PCSQ202608080005"
SHIP_NO = "FHD202608080005"
WAYBILL_NO = "YD202608080004"
NOTICE_NO = "CGST202608080005"
PREP_NO = "BHT202608150006"
PREOUT_DISPATCH_NO = "PCSQ202608120002"

SPLIT_BATCHES = [
    ("10-1", "10", "20260809001", "30.00", "30.00", "0.00", "已完成"),
    ("10-2", "10", "20260809002", "35.00", "35.00", "0.00", "已完成"),
    ("10-3", "10", "20260809003", "35.00", "0.00", "35.00", "待执行"),
]


def mat_info(code: str) -> str:
    name, spec, kind = MATERIALS[code]
    return f"{code} / {name} / {spec} / {kind}"


def qty(n: float | int) -> str:
    return f"{float(n):.2f}"


def date_str(day: int) -> str:
    return f"2026-08-{day:02d}"


def load_seed() -> dict:
    if not SEED_FILE.exists():
        return build_skeleton()
    text = SEED_FILE.read_text(encoding="utf-8")
    text = re.sub(r"^/\*.*?\*/\s*", "", text, flags=re.S)
    text = text.replace("window.WMS_MOCK_ROWS = ", "", 1).strip().rstrip(";")
    return json.loads(text)


def build_skeleton() -> dict:
    """Minimal scaffold when no seed file exists."""
    data: dict[str, dict[str, list]] = {}
    for mod, tabs in MODULE_TABS.items():
        data[mod] = {tab: [] for tab in tabs}
    return data


def ensure_tab_structure(data: dict) -> None:
    for mod, tabs in MODULE_TABS.items():
        if mod not in data:
            data[mod] = {}
        for tab in tabs:
            if tab not in data[mod] or not isinstance(data[mod][tab], list):
                data[mod][tab] = data[mod].get(tab) or []


def clone_with_index(row: dict, idx: int, id_fields: tuple[str, ...] = ("id",)) -> dict:
    out = copy.deepcopy(row)
    for field in id_fields:
        if field in out:
            base = str(out[field])
            out[field] = f"{base}-g{idx + 1}"
    for key, val in list(out.items()):
        if isinstance(val, str):
            if re.fullmatch(r"\d{4}-\d{2}-\d{2}", val):
                day = min(28, (idx % 28) + 1)
                out[key] = date_str(day)
            elif re.fullmatch(r"2026-08-\d{2}", val):
                day = min(28, ((idx + int(val[-2:])) % 28) + 1)
                out[key] = date_str(day)
            elif "状态" in key and val in STATUSES + AUDIT_STATUSES + WAYBILL_STATUSES:
                pool = STATUSES if val in STATUSES else (AUDIT_STATUSES if val in AUDIT_STATUSES else WAYBILL_STATUSES)
                out[key] = pool[idx % len(pool)]
            elif val.endswith(".00") and re.match(r"^-?\d+\.\d+$", val):
                out[key] = qty((idx + 1) * 10000)
            elif re.search(r"(单号|编号|编码|号)$", key) and val not in ("—", "/", ""):
                out[key] = re.sub(r"(\d+)(?!.*\d)", lambda m: str(int(m.group(1)) + idx + 1), val, count=1)
    return out


def min_rows_for_tab(tab: str) -> int:
    if tab == "detailLines":
        return 1
    if tab in ("enrouteLines", "stockInvLines", "stockBarcodeLines"):
        return 3
    return 5


def pad_tab_rows(rows: list, tab: str, max_detail: int = 2, template: dict | None = None) -> list:
    target = min_rows_for_tab(tab)
    if tab == "detailLines":
        if not rows and template:
            rows = [copy.deepcopy(template)]
        target = min(max(len(rows), 1), max_detail)
        if len(rows) >= target:
            return rows[:max_detail]
    if len(rows) >= target:
        return rows
    if not rows:
        return rows
    out = list(rows)
    template = rows[0]
    i = len(rows)
    while len(out) < target:
        out.append(clone_with_index(template, i))
        i += 1
    return out


def order_detail_template(main_rows: list) -> dict | None:
    for row in main_rows:
        lines = row.get("_lines") or []
        if lines:
            return lines[0]
    return None


def pad_all_modules(data: dict) -> None:
    for mod, tabs in MODULE_TABS.items():
        for tab in tabs:
            rows = data[mod].get(tab, [])
            template = None
            if tab == "detailLines" and mod in ("po", "so", "wwpo"):
                template = order_detail_template(data[mod].get("main", []))
            data[mod][tab] = pad_tab_rows(rows, tab, template=template)


def apply_mat_list(data: dict) -> None:
    rows = []
    for i, (code, (name, spec, kind)) in enumerate(MATERIALS.items(), 1):
        rows.append(
            {
                "id": str(i),
                "物料编码": code,
                "物料名称": name,
                "物料规格": spec,
                "物料种类": kind,
                "有效期": "24" if code != "RM-NMP" else "6",
                "有效期单位": "月",
                "基本单位": "KG" if code != "PM-TONBAG" else "个",
                "库存单位": "KG" if code != "PM-TONBAG" else "个",
                "生产单位": "KG" if code != "PM-TONBAG" else "个",
                "采购单位": "KG" if code != "PM-TONBAG" else "个",
                "销售单位": "KG" if code != "PM-TONBAG" else "个",
                "管理方式": "计数管理" if code == "PM-TONBAG" else "条码管理",
                "备注": "—",
                "启用状态": "启用",
                "创建人": CREATORS[i % len(CREATORS)],
                "创建时间": f"2026-07-{9 + i:02d} 09:30:00",
            }
        )
    data["mat-list"]["main"] = rows


def po_line(code: str, line_no: str, qty_plan: str, received: str, status: str) -> dict:
    recv = float(received)
    plan = float(qty_plan)
    return {
        "物料编码": code,
        "物料信息": mat_info(code),
        "采购单位": "KG",
        "计划件数": "10" if line_no == "10" else "",
        "计划数量": qty_plan,
        "已入库数量": received,
        "未入库数量": qty(str(max(plan - recv, 0))),
        "行状态": status,
        "备注": "—",
        "行号": line_no,
    }


def apply_order_detail_lines(data: dict, mod: str, line_builder) -> None:
    main = data[mod]["main"]
    lines = []
    for row in main[:1]:
        for ln in row.get("_lines") or []:
            lines.append(copy.deepcopy(ln))
            if len(lines) >= 2:
                break
        if lines:
            break
    if not lines:
        lines = [line_builder("10")]
    data[mod]["detailLines"] = lines[:2]


def apply_po(data: dict) -> None:
    main = data["po"]["main"]
    hero = None
    for row in main:
        if row.get("采购订单号") == PO_NO:
            hero = row
            break
    if hero is None:
        hero = {
            "id": "1",
            "采购订单号": PO_NO,
            "订单状态": "执行中",
            "采购类型": "标准采购",
            "供应商编码": SUPPLIERS[0][0],
            "供应商名称": SUPPLIERS[0][1],
            "合同号": "LY-CG-F-2026080001",
            "采购部门": "采购一部",
            "采购员": "王强",
            "订单日期": "2026-08-12",
            "预计到货日期": "2026-08-20",
            "备注": "—",
            "_lines": [],
        }
        main.insert(0, hero)

    hero["_lines"] = [
        po_line("RM-Li2CO3-BG", "10", "100", "65", "执行中"),
        po_line("RM-LiOH-BG", "20", "50", "0", "待执行"),
        po_line("RM-Li2SO4-BG", "30", "80", "0", "待执行"),
    ]

    if len(main) < 5:
        extras = []
        for i, (vcode, vname) in enumerate(SUPPLIERS[1:], 2):
            extras.append(
                {
                    "id": str(i),
                    "采购订单号": f"CGDD20260812000{i}",
                    "订单状态": STATUSES[(i - 1) % len(STATUSES)],
                    "采购类型": ["长协采购", "紧急采购", "标准采购", "长协采购"][i - 2],
                    "供应商编码": vcode,
                    "供应商名称": vname,
                    "合同号": f"LY-CG-F-202608000{i}",
                    "采购部门": "采购一部" if i % 2 else "采购二部",
                    "采购员": CREATORS[i % len(CREATORS)],
                    "订单日期": date_str(10 + i),
                    "预计到货日期": date_str(18 + i),
                    "备注": "—",
                    "_lines": [po_line("RM-Li2CO3-BG", "10", "100", "0", "待执行")],
                }
            )
        main.extend(extras[: max(0, 5 - len(main))])

    apply_order_detail_lines(data, "po", lambda n: po_line("RM-Li2CO3-BG", n, "100", "65", "执行中"))


def split_line_template(row_no: str, order_line: str, batch: str, plan: str, done: str, remain: str, status: str, mat: str) -> dict:
    return {
        "id": f"{NOTICE_NO}-l{row_no}",
        "行号": row_no,
        "_orderLineNo": order_line,
        "行状态": status,
        "物料信息": mat,
        "库存单位": "KG",
        "管理方式": "条码管理",
        "计划件数": "3" if row_no == "10-1" else "4",
        "计划数量": plan,
        "已完成数量": done,
        "未完成数量": remain,
        "批号": batch,
        "生产日期": "2026-08-09",
        "有效期": "12",
        "生产厂家": SUPPLIERS[0][1],
        "备注": f"第{row_no.split('-')[-1]}批",
    }


def apply_so_wwpo(data: dict) -> None:
    def so_line(n: str) -> dict:
        return {
            "物料编码": "FG-Li2CO3-BG",
            "物料信息": mat_info("FG-Li2CO3-BG"),
            "销售单位": "KG",
            "计划件数": "10",
            "计划数量": "100",
            "已出库数量": "0",
            "未出库数量": "100",
            "行状态": "待执行",
            "备注": "—",
            "行号": n,
        }

    def ww_line(n: str) -> dict:
        return {
            "物料编码": "RM-Li2CO3-BG",
            "物料信息": mat_info("RM-Li2CO3-BG"),
            "发料单位": "KG",
            "计划件数": "5",
            "计划数量": "500",
            "已发料数量": "0",
            "未发料数量": "500",
            "行状态": "待执行",
            "备注": "—",
            "行号": n,
        }

    apply_order_detail_lines(data, "so", so_line)
    apply_order_detail_lines(data, "wwpo", ww_line)


def apply_wh_po_in(data: dict) -> None:
    tab1 = data["wh-po-in"]["tab1"]
    hero = None
    for row in tab1:
        if row.get("单号") == NOTICE_NO:
            hero = row
            break
    mat = mat_info("RM-Li2CO3-BG")
    split_lines = [
        split_line_template(r, ol, b, p, d, rem, st, mat)
        for r, ol, b, p, d, rem, st in SPLIT_BATCHES
    ]
    if hero is None:
        hero = {
            "id": "6",
            "单据状态": "执行中",
            "单号": NOTICE_NO,
            "单据类型": "标准采购入库",
            "计划执行日期": "2026-08-09",
            "物料信息": mat,
            "备注": "订单行10拆三批入库演示",
            "ERP单据号": "ERP-CGST-080005",
            "关联采购订单": PO_NO,
            "供应商名称": SUPPLIERS[0][1],
            "关联运单": WAYBILL_NO,
            "关联发货单": SHIP_NO,
            "包装规格": "吨袋+托架",
            "车牌号": "川C55667",
            "车挂号": "—",
            "司机姓名": "赵六",
            "司机电话": "13900000001",
            "司机身份证号": "51010419880512001X",
            "_lines": split_lines,
        }
        tab1.append(hero)
    else:
        hero["_lines"] = split_lines
        hero["关联采购订单"] = PO_NO
        hero["关联运单"] = WAYBILL_NO
        hero["关联发货单"] = SHIP_NO

    # Ensure at least one multi-line notice besides split demo
    multi = None
    for row in tab1:
        if row.get("单号") != NOTICE_NO and len(row.get("_lines") or []) > 1:
            multi = row
            break
    if multi is None:
        tab1.append(
            {
                "id": "ml-1",
                "单据状态": "待执行",
                "单号": "CGST202608120020",
                "单据类型": "标准采购入库",
                "计划执行日期": "2026-08-12",
                "物料信息": mat_info("RM-LiOH-BG"),
                "备注": "多行通知演示",
                "ERP单据号": "ERP-CGST-020",
                "关联采购订单": "CGDD202608120002",
                "供应商名称": SUPPLIERS[1][1],
                "关联运单": "—",
                "关联发货单": "—",
                "包装规格": "吨袋+托架",
                "车牌号": "川A11223",
                "车挂号": "—",
                "司机姓名": "王五",
                "司机电话": "13800138001",
                "司机身份证号": "510101199001011111",
                "_lines": [
                    {
                        "id": "ml-1-l1",
                        "行状态": "待执行",
                        "物料信息": mat_info("RM-LiOH-BG"),
                        "库存单位": "KG",
                        "管理方式": "条码管理",
                        "计划件数": "10",
                        "计划数量": qty(50000),
                        "已完成数量": qty(0),
                        "未完成数量": qty(50000),
                        "批号": "20260812001",
                        "生产日期": "2026-08-12",
                        "有效期": "12",
                        "生产厂家": SUPPLIERS[1][1],
                        "备注": "行1",
                    },
                    {
                        "id": "ml-1-l2",
                        "行状态": "待执行",
                        "物料信息": mat_info("RM-Li2SO4-BG"),
                        "库存单位": "KG",
                        "管理方式": "条码管理",
                        "计划件数": "8",
                        "计划数量": qty(40000),
                        "已完成数量": qty(0),
                        "未完成数量": qty(40000),
                        "批号": "20260812002",
                        "生产日期": "2026-08-12",
                        "有效期": "12",
                        "生产厂家": SUPPLIERS[1][1],
                        "备注": "行2",
                    },
                ],
            }
        )

    # Unique mat+lot within each notice line set
    seen: set[tuple[str, str]] = set()
    for notice in tab1:
        for line in notice.get("_lines") or []:
            key = (line.get("物料信息", ""), line.get("批号", ""))
            if key in seen and key != ("", ""):
                suffix = len(seen)
                line["批号"] = f"{line.get('批号', 'LOT')}-{suffix}"
                key = (line.get("物料信息", ""), line.get("批号", ""))
            seen.add(key)


def apply_lg_ship(data: dict) -> None:
    main = data["lg-ship"]["main"]
    hero = None
    for row in main:
        if row.get("发货单号") == SHIP_NO:
            hero = row
            break
    mat = mat_info("RM-Li2CO3-BG")
    ship_lines = []
    for row_no, order_line, batch, plan, done, _, _ in SPLIT_BATCHES:
        ship_lines.append(
            {
                "行号": row_no,
                "_orderLineNo": order_line,
                "物料信息": mat,
                "发货数量": plan.split(".")[0],
                "已签收数量": done.split(".")[0],
                "体积(长*宽*高)": "1.1*1.1*1.4",
                "单位": "KG",
                "行备注": f"第{row_no.split('-')[-1]}批",
                "批号": batch,
            }
        )
    if hero is None:
        hero = {
            "id": "5",
            "发货单号": SHIP_NO,
            "状态": "已调度",
            "来源派车单号": DISPATCH_NO,
            "申请部门": "采购部",
            "申请人": "王芳",
            "用车类型": "提货",
            "配送类型": "我方配送",
            "物料信息": mat,
            "发货数量": "100",
            "已签收数量": "65",
            "关联运单": WAYBILL_NO,
            "关联仓储通知单": NOTICE_NO,
            "签收状态": "部分签收",
            "创建时间": "2026-08-08 15:10",
            "备注": "订单行10拆三批：10-1/10-2/10-3",
            "_lines": ship_lines,
            "订单号": f"{PO_NO} / {SUPPLIERS[0][1]}",
            "合同号": "LY-CG-F-2026080001",
            "采购订单": PO_NO,
            "仓库业务类型": "采购入库",
        }
        main.append(hero)
    else:
        hero["_lines"] = ship_lines
        hero["关联运单"] = WAYBILL_NO
        hero["关联仓储通知单"] = NOTICE_NO
        hero["来源派车单号"] = DISPATCH_NO
        hero["采购订单"] = PO_NO

    if not data["lg-ship"].get("detailLines"):
        data["lg-ship"]["detailLines"] = [copy.deepcopy(ship_lines[0])]


def apply_lg_dispatch(data: dict) -> None:
    main = data["lg-dispatch"]["main"]
    biz_types = ["采购入库", "销售发货", "销售预出货", "销售退货", "委外"]
    audits = ["待审核", "已通过", "已驳回", "已通过", "已通过"]

    for i, row in enumerate(main[:5]):
        if i < len(biz_types):
            row["仓库业务类型"] = biz_types[i]
        if i < len(audits):
            row["审核状态"] = audits[i]

    for row in main:
        if row.get("编号") == PREOUT_DISPATCH_NO:
            row["关联销售备货单"] = PREP_NO
            row["仓库业务类型"] = "销售预出货"
            row["关联仓储业务"] = "销售预出货"
        if row.get("编号") == DISPATCH_NO:
            row["关联发货单"] = SHIP_NO
            row["关联运单"] = WAYBILL_NO
            row["订单号"] = f"{PO_NO} / {SUPPLIERS[0][1]}"
            row["仓库业务类型"] = "采购入库"

    if len(main) < 5:
        extras = []
        for i in range(len(main), 5):
            code = list(MATERIALS.keys())[i % len(MATERIALS)]
            extras.append(
                {
                    "id": str(i + 1),
                    "编号": f"PCSQ2026081200{i + 1:02d}",
                    "日期": date_str(8 + i),
                    "申请部门": "仓储部",
                    "申请人": CREATORS[i % len(CREATORS)],
                    "用车类型": "发货",
                    "配送类型": "我方配送",
                    "车型要求": "厢式",
                    "是否带托盘": "是",
                    "特殊要求": "—",
                    "装货地点": "思特瑞原料仓",
                    "装货联系人": "王五",
                    "装货联系电话": "13800001111",
                    "卸货地点": "苏州园区卸货区",
                    "卸货联系人": "收货员",
                    "卸货联系电话": "0512-66660002",
                    "计划装车时间": f"2026-08-{10 + i} 08:00",
                    "要求送达时间": f"2026-08-{12 + i} 18:00",
                    "物料信息": mat_info(code),
                    "总数量": "20 吨",
                    "关联发货单": "—",
                    "关联运单": "—",
                    "审核状态": audits[i % len(audits)],
                    "状态": "待执行",
                    "备注": "—",
                    "_lines": [
                        {
                            "行号": "10",
                            "物料信息": mat_info(code),
                            "需求数量": "20",
                            "已拆数量": "0",
                            "已拆未签收数量": "0",
                            "已签收数量": "0",
                            "未拆数量": "20",
                            "体积(长*宽*高)": "1.1*1.1*1.4",
                            "单位": "吨",
                            "行备注": "—",
                        }
                    ],
                    "订单类型": "销售订单",
                    "订单号": f"XSDD20260812000{i} / {CUSTOMERS[i % len(CUSTOMERS)][1]}",
                    "合同号": f"LY-XS-F-202608000{i}",
                    "采购订单": "",
                    "仓库业务类型": biz_types[i % len(biz_types)],
                }
            )
        main.extend(extras)

    if not data["lg-dispatch"].get("detailLines"):
        data["lg-dispatch"]["detailLines"] = [
            {
                "物料信息": mat_info("RM-Li2CO3-BG"),
                "需求数量": "20",
                "已拆数量": "0",
                "已拆未签收数量": "0",
                "已签收数量": "0",
                "未拆数量": "20",
                "体积(长*宽*高)": "1.1*1.1*1.4",
                "单位": "吨",
                "行备注": "模板行",
            }
        ]


def apply_lg_waybill(data: dict) -> None:
    main = data["lg-waybill"]["main"]
    present = {row.get("状态") for row in main}
    for i, status in enumerate(WAYBILL_STATUSES):
        if status in present:
            continue
        main.append(
            {
                "id": f"wb-{i + 1}",
                "运单号": f"YD2026081500{i + 1:02d}",
                "状态": status,
                "结算状态": "/" if status in ("待派车", "待运输", "运输中") else "待结算",
                "关联发货单": SHIP_NO if status == "已完成" else "—",
                "关联订单类型": "采购订单",
                "关联订单号": PO_NO,
                "物料信息": mat_info("RM-Li2CO3-BG"),
                "总数量": "100 KG",
                "申请部门": "仓储部",
                "申请人": "张三",
                "用车类型": "提货",
                "运输类型": "专车",
                "装货点": "供应商仓库A",
                "卸货点": "思特瑞原料仓",
                "承运商名称": "顺丰物流",
                "车牌号": "川A12345",
                "司机姓名": "赵六",
                "司机电话": "13900000001",
                "创建时间": f"2026-08-15 {8 + i:02d}:00",
                "仓库业务类型": "采购入库",
                "订单号": f"{PO_NO} / {SUPPLIERS[0][1]}",
            }
        )

    for row in main:
        if row.get("运单号") == WAYBILL_NO:
            row["关联发货单"] = SHIP_NO
            row["关联订单号"] = PO_NO
            row["状态"] = "已完成"

    if len(data["lg-waybill"].get("enrouteLines") or []) < 3:
        data["lg-waybill"]["enrouteLines"] = [
            {
                "节点": "装货点出发",
                "时间": "2026-08-09 07:30",
                "位置": "供应商仓库A",
                "备注": "—",
            },
            {
                "节点": "途中",
                "时间": "2026-08-09 12:00",
                "位置": "成绵高速",
                "备注": "—",
            },
            {
                "节点": "到达卸货点",
                "时间": "2026-08-09 17:45",
                "位置": "思特瑞原料仓",
                "备注": "—",
            },
        ]

    if not data["lg-waybill"].get("detailLines"):
        data["lg-waybill"]["detailLines"] = [
            {
                "关联发货单号": SHIP_NO,
                "关联仓储通知单": NOTICE_NO,
                "装货点": "供应商仓库A",
                "卸货点": "思特瑞原料仓",
                "物料信息": mat_info("RM-Li2CO3-BG"),
                "发货数量": "100",
            }
        ]


def apply_serial_arch(data: dict) -> None:
    rows = data["serial-arch"]["main"]
    use_states = ["在用", "闲置", "停用"]
    insp_states = ["合格", "待检", "不合格"]
    stock_states = ["仓库", "线边", "厂外"]
    bht_refs = ["BHT202608180002", "BHT202608170003", "BHT202608190005", PREP_NO, "BHT202608200004"]

    while len(rows) < 15:
        i = len(rows)
        code = list(MATERIALS.keys())[i % len(MATERIALS)]
        bht = bht_refs[i % len(bht_refs)] if i % 3 == 0 else "—"
        rows.append(
            {
                "id": f"sa-{i + 1}",
                "使用状态": use_states[i % len(use_states)],
                "检验状态": insp_states[i % len(insp_states)],
                "库存状态": stock_states[i % len(stock_states)],
                "存储位置": f"WH-FG-{(i % 5) + 1:02d}",
                "条码号": f"TM2026081901{i + 1:02d}",
                "包装规格": "1吨/袋",
                "来源单号": "SCRK202608010001",
                "来源条码号": "—",
                "物料信息": mat_info(code),
                "物料批号": f"LOT-PREP-202608{(i % 9) + 1:02d}",
                "客户批号": "CUS-LOT-PREP",
                "建档数量": qty(1 + (i % 10)),
                "当前数量": qty(1 + (i % 10)),
                "库存单位": "吨",
                "供应商信息": SUPPLIERS[i % len(SUPPLIERS)][1],
                "生产厂家": "思特瑞锂业",
                "生产日期": "2026-07-15",
                "有效期": "24 月",
                "失效日期": "2028-07-15",
                "绑定状态": "未绑定",
                "当前绑定外包材": "—",
                "当前步骤": "备货" if bht != "—" else "—",
                "当前单据号": bht,
                "所属阶段": "—",
                "最新操作人": CREATORS[i % len(CREATORS)],
                "最新操作时间": f"2026-08-18 {10 + (i % 8):02d}:00:00",
                "创建时间": f"2026-08-15 {8 + (i % 8):02d}:00:00",
            }
        )
    data["serial-arch"]["main"] = rows[:15]


def apply_tank_arch(data: dict) -> None:
    rows = data["tank-arch"]["main"]
    empty = {
        "id": "empty-1",
        "条码号": "TM202608050099",
        "储罐编号": "TK-STR-099",
        "储罐类型": "固定罐",
        "充装介质": "—",
        "容积": "100m³",
        "使用状态": "在用",
        "检验状态": "合格",
        "库存状态": "库内",
        "库存位置": "—",
        "物料信息": "—",
        "物料批号": "—",
        "建档数量": "0",
        "当前数量": "0",
        "库存单位": "—",
        "供应商信息": "—",
        "生产厂家": "—",
        "生产日期": "—",
        "有效期": "—",
        "失效日期": "—",
        "当前步骤": "—",
        "当前单据号": "—",
        "所属阶段": "—",
        "最新操作人": "—",
        "最新操作时间": "—",
        "备注": "空罐演示（在用，物料信息=—）",
        "创建时间": "2026-08-08 10:00:00",
        "_lines": [],
    }
    if not any(r.get("物料信息") == "—" and r.get("使用状态") == "在用" for r in rows):
        rows.append(empty)
    while len(rows) < 6:
        i = len(rows)
        code = list(MATERIALS.keys())[i % 3]
        rows.append(
            {
                "id": str(i + 1),
                "条码号": f"TM2026080500{i + 1:02d}",
                "储罐编号": f"TK-STR-00{i + 1}",
                "储罐类型": "固定罐" if i % 2 == 0 else "移动罐",
                "充装介质": "高纯碳酸锂料浆",
                "容积": f"{50 + i * 10}m³",
                "使用状态": "在用",
                "检验状态": ["合格", "待检", "不合格"][i % 3],
                "库存状态": "库内",
                "库存位置": f"WH-RAW-A0{i + 1}",
                "物料信息": mat_info(code),
                "物料批号": f"LOT-TK-2026080{i + 1}",
                "建档数量": qty(1000 + i * 100),
                "当前数量": qty(800 + i * 100),
                "库存单位": "KG",
                "供应商信息": SUPPLIERS[i % len(SUPPLIERS)][1],
                "生产厂家": "思特瑞锂业",
                "生产日期": date_str(1 + i),
                "有效期": "12",
                "失效日期": date_str(365),
                "当前步骤": "—",
                "当前单据号": "—",
                "所属阶段": "—",
                "最新操作人": CREATORS[i % len(CREATORS)],
                "最新操作时间": f"2026-08-0{i + 1} 10:00:00",
                "备注": "—",
                "创建时间": f"2026-08-0{i + 1} 09:00:00",
                "_lines": [],
            }
        )
    data["tank-arch"]["main"] = rows[:6]


def pick_line_from_serial(row: dict, pid: str) -> dict:
    return {
        "id": pid,
        "存储位置": row.get("存储位置", "WH-FG-01"),
        "条码号": row.get("条码号", ""),
        "包装规格": row.get("包装规格", "1吨/袋"),
        "来源单号": row.get("来源单号", "SCRK202608010001"),
        "来源条码号": row.get("来源条码号", "—"),
        "物料信息": row.get("物料信息", mat_info("RM-Li2CO3-BG")),
        "物料批号": row.get("物料批号", "LOT-PREP-20260801"),
        "客户批号": row.get("客户批号", "CUS-LOT-PREP"),
        "当前数量": row.get("当前数量", "1.000"),
        "库存单位": row.get("库存单位", "吨"),
        "供应商信息": row.get("供应商信息", "思特瑞锂业"),
        "生产厂家": row.get("生产厂家", "思特瑞锂业"),
        "生产日期": row.get("生产日期", "2026-07-15"),
        "有效期": row.get("有效期", "24 月"),
        "失效日期": row.get("失效日期", "2028-07-15"),
        "绑定状态": row.get("绑定状态", "未绑定"),
        "当前绑定外包材": row.get("当前绑定外包材", "—"),
    }


def apply_wh_so_prep(data: dict) -> None:
    serials = data["serial-arch"]["main"]
    linked = [s for s in serials if s.get("当前单据号", "").startswith("BHT")]
    main = data["wh-so-prep"]["main"]
    for row in main:
        bht = row.get("备货通知单号", "")
        picks = [s for s in linked if s.get("当前单据号") == bht][:3]
        if picks:
            row["_pickLines"] = [pick_line_from_serial(s, f"p{j + 1}") for j, s in enumerate(picks)]
        elif bht == PREP_NO and len(linked) >= 2:
            row["_pickLines"] = [pick_line_from_serial(linked[0], "p1"), pick_line_from_serial(linked[1], "p2")]

    if not any(r.get("备货通知单号") == PREP_NO for r in main):
        main.append(
            {
                "id": "prep-link",
                "备货状态": "执行中",
                "备货通知单号": PREP_NO,
                "单据类型": "紧急备货",
                "计划日期": "2026-08-15",
                "关联销售订单": "XSDD202608180002",
                "客户名称": CUSTOMERS[1][1],
                "物料信息": mat_info("RM-Li2CO3-BG"),
                "备货数量": qty(20),
                "单位": "吨",
                "已备数量": qty(2),
                "订单要求": "吨袋双层",
                "制单人": "李四",
                "制单时间": "2026-08-15 08:10:00",
                "备注": "关联派车 PCSQ202608120002",
                "_pickLines": [pick_line_from_serial(linked[0], "p1")] if linked else [],
            }
        )


def apply_wh_so_preout(data: dict) -> None:
    prep_nos = [r.get("备货通知单号") for r in data["wh-so-prep"]["main"] if r.get("备货通知单号")]
    tab1 = data["wh-so-preout"]["tab1"]
    for i, row in enumerate(tab1):
        if not row.get("关联备货通知单") or row.get("关联备货通知单") == "—":
            row["关联备货通知单"] = prep_nos[i % len(prep_nos)] if prep_nos else PREP_NO


def apply_qc_ledger(data: dict) -> None:
    tab1 = data["wh-po-in"]["tab1"]
    auto_rows: list[dict] = []
    seq = 1
    for notice in tab1:
        notice_no = notice.get("单号", "")
        for line in notice.get("_lines") or []:
            batch = line.get("批号", "")
            auto_rows.append(
                {
                    "id": f"auto-{seq}",
                    "_autoFromPoIn": True,
                    "检验单号": f"QC{notice_no[-10:]}{str(line.get('行号', seq)).replace('-', '')}",
                    "关联单号": notice_no,
                    "检验类型": "来料检验",
                    "物料信息": line.get("物料信息", mat_info("RM-Li2CO3-BG")),
                    "批次号": batch,
                    "物料批次号": batch,
                    "抽样数量": "100",
                    "报检时间": f"2026-08-10 {7 + (seq % 12):02d}:00",
                    "报检人": CREATORS[seq % len(CREATORS)],
                    "检验日期": f"2026-08-10 {9 + (seq % 8):02d}:30" if seq % 3 else "",
                    "质检员": CREATORS[(seq + 1) % len(CREATORS)] if seq % 3 else "",
                    "检验判定": QC_JUDGMENTS[seq % len(QC_JUDGMENTS)],
                    "备注": "采购入库自动生成",
                }
            )
            seq += 1

    manual_rows = [
        {
            "id": "manual-1",
            "检验单号": "QC2026081101",
            "关联单号": "INV20260811",
            "检验类型": "库内检验",
            "物料信息": mat_info("RM-LiOH-BG"),
            "批次号": "20260811001",
            "物料批次号": "20260811001",
            "抽样数量": "50",
            "报检时间": "2026-08-11 10:00",
            "报检人": "王五",
            "检验日期": "",
            "质检员": "",
            "检验判定": "待判定",
            "备注": "库内复检",
        },
        {
            "id": "manual-2",
            "检验单号": "QC2026081102",
            "关联单号": "SCRK20260811001",
            "检验类型": "成品检验",
            "物料信息": mat_info("FG-Li2CO3-BG"),
            "批次号": "20260811002",
            "物料批次号": "20260811002",
            "抽样数量": "80",
            "报检时间": "2026-08-11 14:00",
            "报检人": "张三",
            "检验日期": "2026-08-11 16:45",
            "质检员": "王强",
            "检验判定": "不合格",
            "备注": "水分超标",
        },
        {
            "id": "manual-3",
            "检验单号": "QC2026081103",
            "关联单号": "INV20260812",
            "检验类型": "库内检验",
            "物料信息": mat_info("RM-NMP"),
            "批次号": "20260812001",
            "物料批次号": "20260812001",
            "抽样数量": "20",
            "报检时间": "2026-08-12 11:00",
            "报检人": "李敏",
            "检验日期": "2026-08-12 14:10",
            "质检员": "李敏",
            "检验判定": "合格",
            "备注": "—",
        },
    ]

    merged = auto_rows + manual_rows
    # Ensure judgment coverage
    for j, judgment in enumerate(QC_JUDGMENTS):
        if not any(r.get("检验判定") == judgment for r in merged):
            merged.append(
                {
                    **copy.deepcopy(manual_rows[0]),
                    "id": f"coverage-{j}",
                    "检验单号": f"QC202608119{j}",
                    "检验判定": judgment,
                }
            )

    while len(merged) < 8:
        i = len(merged)
        merged.append(
            {
                "id": f"extra-{i}",
                "检验单号": f"QC20260812{i:02d}",
                "关联单号": NOTICE_NO,
                "检验类型": "来料检验",
                "物料信息": mat_info("RM-Li2CO3-BG"),
                "批次号": f"20260812{i:03d}",
                "物料批次号": f"20260812{i:03d}",
                "抽样数量": "30",
                "报检时间": f"2026-08-12 {8 + i}:00",
                "报检人": CREATORS[i % len(CREATORS)],
                "检验日期": f"2026-08-12 {10 + i}:00",
                "质检员": CREATORS[(i + 2) % len(CREATORS)],
                "检验判定": QC_JUDGMENTS[i % len(QC_JUDGMENTS)],
                "备注": "—",
            }
        )

    data["qc-ledger"]["main"] = merged


def apply_cross_links(data: dict) -> None:
    """Ensure PO→dispatch→ship→waybill→pickup→sign→wh-po-in chain."""
    chain = {
        "po": PO_NO,
        "dispatch": DISPATCH_NO,
        "ship": SHIP_NO,
        "waybill": WAYBILL_NO,
        "notice": NOTICE_NO,
    }
    for row in data["lg-pickup"]["main"]:
        if row.get("关联运单号") == WAYBILL_NO or row.get("关联发货单号") == SHIP_NO:
            row["关联派车单号"] = DISPATCH_NO
    for row in data["lg-sign"]["main"]:
        if row.get("关联运单") == WAYBILL_NO or row.get("关联发货单") == SHIP_NO:
            row["关联采购订单"] = PO_NO
    for tab in ("tab2", "tab3"):
        for row in data["wh-po-in"].get(tab, []):
            if row.get("关联发货单") == SHIP_NO or row.get("单号", "").startswith("CGRK"):
                row.setdefault("关联运单", WAYBILL_NO)
                row.setdefault("关联采购订单", PO_NO)
    _ = chain


def apply_supplier_customer(data: dict) -> None:
    sup_rows = []
    for i, (code, name) in enumerate(SUPPLIERS, 1):
        sup_rows.append(
            {
                "id": str(i),
                "供应商编码": code,
                "供应商名称": name,
                "供应商类型": "生产商",
                "联系人": CREATORS[i % len(CREATORS)],
                "联系电话": f"028-8888{i:04d}",
                "地址": f"四川省成都市高新区{i}号",
                "启用状态": "启用",
                "创建人": CREATORS[i % len(CREATORS)],
                "创建时间": f"2026-07-{10 + i:02d} 09:00:00",
            }
        )
    if len(data["supplier"]["main"]) < 5:
        data["supplier"]["main"] = sup_rows

    cust_rows = []
    for i, (code, name) in enumerate(CUSTOMERS, 1):
        cust_rows.append(
            {
                "id": str(i),
                "客户编码": code,
                "客户名称": name,
                "客户类型": "国内客户",
                "联系人": CREATORS[(i + 1) % len(CREATORS)],
                "联系电话": f"0512-6666{i:04d}",
                "地址": f"江苏省苏州市园区{i}号",
                "启用状态": "启用",
                "创建人": CREATORS[i % len(CREATORS)],
                "创建时间": f"2026-07-{15 + i:02d} 09:00:00",
            }
        )
    if len(data["customer"]["main"]) < 5:
        data["customer"]["main"] = cust_rows


def apply_stocktake(data: dict) -> None:
    mod = data["wh-stocktake"]
    if len(mod.get("stockInvLines") or []) < 3:
        mod["stockInvLines"] = [
            {
                "id": f"si-{i + 1}",
                "仓库": "原料仓",
                "库位": f"WH-RAW-0{i + 1}",
                "物料信息": mat_info(list(MATERIALS.keys())[i % 3]),
                "账面数量": qty(10000 * (i + 1)),
                "实盘数量": qty(10000 * (i + 1) - 100),
                "差异数量": qty(-100),
            }
            for i in range(3)
        ]
    if len(mod.get("stockBarcodeLines") or []) < 3:
        mod["stockBarcodeLines"] = [
            {
                "id": f"sb-{i + 1}",
                "条码号": f"TM202608300{i + 1}",
                "物料信息": mat_info(list(MATERIALS.keys())[i % 3]),
                "存储位置": f"WH-RAW-0{i + 1}",
                "当前数量": qty(1000 * (i + 1)),
            }
            for i in range(3)
        ]


def generate() -> dict:
    data = load_seed()
    ensure_tab_structure(data)

    apply_mat_list(data)
    apply_supplier_customer(data)
    apply_po(data)
    apply_so_wwpo(data)
    apply_wh_po_in(data)
    apply_lg_ship(data)
    apply_lg_dispatch(data)
    apply_lg_waybill(data)
    apply_serial_arch(data)
    apply_tank_arch(data)
    apply_wh_so_prep(data)
    apply_wh_so_preout(data)
    apply_qc_ledger(data)
    apply_cross_links(data)
    apply_stocktake(data)
    pad_all_modules(data)

    return data


def write_js(data: dict) -> None:
    body = json.dumps(data, ensure_ascii=False, indent=2)
    content = f"/* auto-generated mock rows v{VERSION} */\nwindow.WMS_MOCK_ROWS = {body};\n"
    OUT_FILE.write_text(content, encoding="utf-8")


def count_summary(data: dict) -> tuple[dict, list[str]]:
    summary: dict[str, dict[str, int]] = {}
    under: list[str] = []
    for mod, tabs in MODULE_TABS.items():
        summary[mod] = {}
        for tab in tabs:
            n = len(data.get(mod, {}).get(tab, []))
            summary[mod][tab] = n
            need = min_rows_for_tab(tab)
            if tab == "detailLines" and n > 2:
                pass
            elif n < need:
                under.append(f"{mod}.{tab}: {n} < {need}")
    return summary, under


def main() -> None:
    data = generate()
    write_js(data)
    summary, under = count_summary(data)
    size = OUT_FILE.stat().st_size
    print(f"Wrote {OUT_FILE.name} ({size:,} bytes), version v{VERSION}")
    print(f"Modules: {len(MODULE_TABS)}")
    for mod in sorted(summary):
        parts = ", ".join(f"{tab}={summary[mod][tab]}" for tab in MODULE_TABS[mod])
        print(f"  {mod}: {parts}")
    if under:
        print("Below minimum:")
        for line in under:
            print(f"  - {line}")
    else:
        print("All tabs meet minimum row counts.")


if __name__ == "__main__":
    main()

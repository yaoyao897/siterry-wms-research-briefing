#!/usr/bin/env python3
"""Scan PRD list/edit/detail pages → page-configs.js + mock-rows.js"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
PRD_PC = ROOT / "03-项目PRD" / "01-PC"
OUT_DIR = Path(__file__).resolve().parent

# id, title, group path labels, prd relative under 01-PC
PAGES = [
    # 基础数据
    ("mat-list", "物料列表", ["基础数据", "基础资料"], "01-基础数据/01-基础资料/01-物料列表"),
    ("mat-uom", "物料单位换算", ["基础数据", "基础资料"], "01-基础数据/01-基础资料/02-物料单位换算"),
    ("customer", "客户列表", ["基础数据", "基础资料"], "01-基础数据/01-基础资料/03-客户列表"),
    ("supplier", "供应商列表", ["基础数据", "基础资料"], "01-基础数据/01-基础资料/04-供应商列表"),
    ("unit", "单位列表", ["基础数据", "基础资料"], "01-基础数据/01-基础资料/05-单位列表"),
    ("dict", "数据字典", ["基础数据", "基础资料"], "01-基础数据/01-基础资料/06-数据字典"),
    ("warehouse", "仓库列表", ["基础数据", "仓储资料"], "01-基础数据/02-仓储资料/01-仓库列表"),
    ("stock-warn", "库存预警", ["基础数据", "仓储资料"], "01-基础数据/02-仓储资料/02-库存预警"),
    ("insp-proc", "检查工序", ["基础数据", "仓储资料"], "01-基础数据/02-仓储资料/03-检查工序"),
    ("insp-craft", "检查工艺", ["基础数据", "仓储资料"], "01-基础数据/02-仓储资料/04-检查工艺"),
    ("po", "采购订单", ["基础数据", "订单资料"], "01-基础数据/03-订单资料/01-采购订单"),
    ("so", "销售订单", ["基础数据", "订单资料"], "01-基础数据/03-订单资料/02-销售订单"),
    ("serial-arch", "流水码档案", ["基础数据", "包材资料"], "01-基础数据/04-包材资料/01-流水码档案"),
    ("tank-arch", "储罐档案", ["基础数据", "包材资料", "固定包材档案"], "01-基础数据/04-包材资料/02-固定包材档案/01-储罐档案"),
    ("app-view-cfg", "APP信息查看配置", ["基础数据", "包材资料"], "01-基础数据/04-包材资料/03-APP信息查看配置"),
    ("pkg-proc", "包材工序", ["基础数据", "包材资料"], "01-基础数据/04-包材资料/04-包材工序"),
    ("pkg-craft", "包材工艺", ["基础数据", "包材资料"], "01-基础数据/04-包材资料/05-包材工艺"),
    ("outer-serial", "流水外包材档案", ["基础数据", "外包材资料"], "01-基础数据/06-外包材资料/01-流水外包材档案"),
    ("outer-fixed", "固定外包材档案", ["基础数据", "外包材资料"], "01-基础数据/06-外包材资料/02-固定外包材档案"),
    ("label-ds", "标签数据源", ["基础数据", "标签配置"], "01-基础数据/05-标签配置/01-标签数据源"),
    ("label-cfg", "标签配置", ["基础数据", "标签配置"], "01-基础数据/05-标签配置/02-标签配置"),
    ("print-task", "打印任务", ["基础数据", "标签配置"], "01-基础数据/05-标签配置/03-打印任务"),
    ("form-ds", "表单数据源", ["基础数据", "表单配置"], "01-基础数据/07-表单配置/01-表单数据源"),
    ("form-designer", "表单设计器", ["基础数据", "表单配置"], "01-基础数据/07-表单配置/02-表单设计器"),
    ("carrier", "承运商列表", ["基础数据", "物流资料"], "01-基础数据/08-物流资料/01-承运商列表"),
    ("vehicle", "车辆列表", ["基础数据", "物流资料"], "01-基础数据/08-物流资料/02-车辆列表"),
    ("driver", "司机列表", ["基础数据", "物流资料"], "01-基础数据/08-物流资料/03-司机列表"),
    ("freight", "运费参照表", ["基础数据", "物流资料"], "01-基础数据/08-物流资料/04-运费参照表"),
    # 仓储管理
    ("wh-po-in", "采购入库", ["仓储管理", "采购"], "02-仓储管理/01-采购/01-采购入库"),
    ("wh-po-ret", "采购退料", ["仓储管理", "采购"], "02-仓储管理/01-采购/02-采购退料"),
    ("wh-os-issue", "委外发料", ["仓储管理", "委外"], "02-仓储管理/02-委外/01-委外发料"),
    ("wh-os-ret-mat", "委外退料", ["仓储管理", "委外"], "02-仓储管理/02-委外/02-委外退料"),
    ("wh-os-recv", "委外收货", ["仓储管理", "委外"], "02-仓储管理/02-委外/03-委外收货"),
    ("wh-os-ret-goods", "委外退货", ["仓储管理", "委外"], "02-仓储管理/02-委外/04-委外退货"),
    ("wh-prod-issue", "生产领料", ["仓储管理", "生产"], "02-仓储管理/03-生产/01-生产领料"),
    ("wh-prod-ret", "生产退料", ["仓储管理", "生产"], "02-仓储管理/03-生产/02-生产退料"),
    ("wh-prod-in", "生产入库", ["仓储管理", "生产"], "02-仓储管理/03-生产/03-生产入库"),
    ("wh-cs-recv", "受托收料", ["仓储管理", "受托"], "02-仓储管理/04-受托/01-受托收料"),
    ("wh-cs-ret", "受托退料", ["仓储管理", "受托"], "02-仓储管理/04-受托/02-受托退料"),
    ("wh-cs-in", "受托入库", ["仓储管理", "受托"], "02-仓储管理/04-受托/03-受托入库"),
    ("wh-so-prep", "销售备货", ["仓储管理", "销售"], "02-仓储管理/05-销售/01-销售备货"),
    ("wh-so-ship", "销售发货", ["仓储管理", "销售"], "02-仓储管理/05-销售/02-销售发货"),
    ("wh-so-ret", "销售退货", ["仓储管理", "销售"], "02-仓储管理/05-销售/03-销售退货"),
    ("wh-other-in", "其他入库", ["仓储管理", "其他"], "02-仓储管理/06-其他/01-其他入库"),
    ("wh-other-out", "其他出库", ["仓储管理", "其他"], "02-仓储管理/06-其他/02-其他出库"),
    ("wh-load", "装卸货", ["仓储管理", "装卸"], "02-仓储管理/07-装卸/01-装卸货"),
    ("wh-transfer", "库内转移", ["仓储管理", "库内"], "02-仓储管理/08-库内/01-库内转移"),
    ("wh-seq", "库内转序", ["仓储管理", "库内"], "02-仓储管理/08-库内/02-库内转序"),
    ("wh-stocktake", "库存全盘", ["仓储管理", "盘点"], "02-仓储管理/09-盘点/01-库存全盘"),
    ("wh-inv-rpt", "仓库库存", ["仓储管理", "报表统计"], "02-仓储管理/10-报表统计/01-仓库库存"),
]


def parse_md_table(text: str, header_hint: str | None = None) -> list[dict]:
    lines = [ln for ln in text.splitlines() if ln.strip().startswith("|")]
    if not lines:
        return []
    # find header
    start = 0
    if header_hint:
        for i, ln in enumerate(lines):
            if header_hint in ln:
                start = i
                break
    header = [c.strip() for c in lines[start].strip("|").split("|")]
    rows = []
    for ln in lines[start + 1 :]:
        if re.match(r"^\|\s*---", ln):
            continue
        cells = [c.strip() for c in ln.strip("|").split("|")]
        if len(cells) < 2:
            continue
        # stop if next section-looking header with fewer semantic cols
        row = {}
        for i, h in enumerate(header):
            if i < len(cells):
                row[h] = cells[i]
        rows.append(row)
    return rows


def extract_section(text: str, title_pat: str) -> str:
    m = re.search(title_pat, text)
    if not m:
        return ""
    start = m.end()
    nxt = re.search(r"\n## |\n### \d", text[start:])
    end = start + nxt.start() if nxt else len(text)
    return text[start:end]


def parse_tabs(list_md: str) -> list[dict]:
    # Tab 栏 table
    sec = ""
    m = re.search(r"## Tab 栏\n+(.*?)(?=\n---|\n## )", list_md, re.S)
    if m:
        sec = m.group(1)
    tabs = []
    for row in parse_md_table(sec):
        label = row.get("Tab 标签") or row.get("Tab") or ""
        if not label:
            continue
        tabs.append({
            "name": f"tab{len(tabs)+1}",
            "label": label,
            "default": row.get("默认", "") in ("是", "Y", "true", "True"),
        })
    return tabs


def parse_query_from_section(sec: str) -> tuple[list[dict], list[str], list[str]]:
    """Return fields, defaultNames, moreNames.

    Supports both table shapes:
    1) columns named 左侧（查询条件） / 本页特例
    2) | 区域 | 说明 | rows where 区域 is 左侧（查询条件）/本页特例
    """
    fields: list[dict] = []
    default_names: list[str] = []
    more_names: list[str] = []

    def split_field_list(text: str) -> list[str]:
        """Split by顿号/逗号 but keep parentheses groups intact."""
        parts, buf, depth = [], [], 0
        for ch in text:
            if ch in "（(":
                depth += 1
                buf.append(ch)
            elif ch in "）)":
                depth = max(0, depth - 1)
                buf.append(ch)
            elif ch in "、，," and depth == 0:
                parts.append("".join(buf).strip())
                buf = []
            else:
                buf.append(ch)
        if buf:
            parts.append("".join(buf).strip())
        return [p for p in parts if p]

    def add_fields_from_text(left: str) -> None:
        for p in split_field_list(left):
            p = p.strip()
            if not p or p.startswith("无"):
                continue
            # 状态下拉 / 盘点类型下拉（无括号）
            if re.search(r"下拉$", p) and "（" not in p and "(" not in p:
                name = re.sub(r"下拉$", "", p).strip()
                fields.append({"name": name, "type": "select", "options": []})
                continue
            if "区间" in p or "起止" in p:
                name = re.sub(r"(区间筛选|区间|筛选)$", "", p).strip()
                fields.append({"name": name or p, "type": "daterange", "options": []})
                continue
            m = re.match(r"(.+?)（(.+)）$", p)
            if m:
                name, tip = m.group(1).strip(), m.group(2).strip()
            else:
                name, tip = p, "文本"
            ftype = "select" if "下拉" in tip else (
                "daterange" if ("区间" in tip or "范围" in tip) else ("date" if "日期" in tip else "input")
            )
            if "模糊" in tip:
                ftype = "input"
            options = []
            if "：" in tip or ":" in tip:
                enum_part = re.split(r"[：:]", tip, 1)[-1]
                options = [
                    x.strip()
                    for x in re.split(r"[/／]", enum_part)
                    if x.strip() and x.strip() not in ("字典", "字典表")
                ]
            fields.append({"name": name, "type": ftype, "options": options})

    def parse_special(special: str) -> None:
        nonlocal default_names, more_names
        m1 = re.search(r"默认一行展示[：:]([^；;]+)", special)
        m2 = re.search(r"更多展开(?:后)?增加[：:]?([^；;\n]+)", special)
        if m1:
            default_names = [x.strip() for x in re.split(r"[、，,]", m1.group(1)) if x.strip() and x.strip() != "无"]
        if m2:
            more_names = [x.strip() for x in re.split(r"[、，,]", m2.group(1)) if x.strip() and x.strip() != "无"]

    for row in parse_md_table(sec):
        left = row.get("左侧（查询条件）") or ""
        special = row.get("本页特例") or ""
        # Shape: | 区域 | 说明 |
        area = row.get("区域") or ""
        desc = row.get("说明") or ""
        if area.startswith("左侧") and desc:
            left = desc
        if area.startswith("本页特例") and desc:
            special = desc
        if left:
            add_fields_from_text(left)
        if special:
            parse_special(special)

    seen = set()
    uniq = []
    for f in fields:
        if f["name"] not in seen:
            seen.add(f["name"])
            uniq.append(f)
    return uniq, default_names, more_names


def parse_toolbar(sec: str) -> list[dict]:
    btns = []
    for row in parse_md_table(sec):
        name = row.get("按钮") or ""
        if not name or name.startswith("（") or name == "列设置":
            continue
        desc = row.get("说明") or ""
        # PRD 写「不提供」时跳过该按钮
        if "不提供" in desc or desc.strip() == "-":
            continue
        btns.append({
            "name": name,
            "type": "primary" if name in ("新增",) else ("danger" if "删除" in name else "default"),
            "desc": desc,
        })
    return btns


def parse_columns(sec: str) -> list[dict]:
    cols = []
    for row in parse_md_table(sec):
        name = row.get("列名") or ""
        if not name or name in ("勾选列", "序号"):
            continue
        if name == "行操作":
            cols.append({"field": "_actions", "title": "操作", "width": 140, "fixed": "right", "slot": "row_actions"})
            continue
        width = row.get("宽度") or "120px"
        w = int(re.sub(r"\D", "", width) or "120")
        field = re.sub(r"[^\w\u4e00-\u9fff]+", "_", name)
        col = {"field": field, "title": name, "width": w}
        if "标签" in (row.get("内容说明") or ""):
            col["slot"] = "tag"
        cols.append(col)
    return cols


def parse_row_ops(sec: str) -> list[dict]:
    ops = []
    for row in parse_md_table(sec):
        name = row.get("操作") or ""
        if not name or name == "无":
            continue
        ops.append({"name": name, "desc": row.get("说明") or ""})
    return ops


def parse_list_tabs_blocks(list_md: str) -> list[dict]:
    """Split by ## Tab N： or single page"""
    tabs_meta = parse_tabs(list_md)
    blocks = list(re.finditer(r"## Tab\s*\d+[：:]\s*(.+)\n", list_md))
    result = []
    if not blocks:
        # single page
        q_sec = extract_section(list_md, r"##\s*3[、.．]?\s*查询区")
        if not q_sec:
            q_sec = extract_section(list_md, r"###\s*3[、.．]?\s*查询区")
        t_sec = extract_section(list_md, r"##\s*4[、.．]?\s*工具条")
        if not t_sec:
            t_sec = extract_section(list_md, r"###\s*4[、.．]?\s*工具条")
        c_sec = extract_section(list_md, r"####?\s*5\.?1\s*列定义|###\s*5\.1\s*列定义|##\s*5[、.．]?\s*列表区")
        # better: find 列定义
        mcol = re.search(r"####?\s*5\.1\s*列定义|###\s*5\.1\s*列定义", list_md)
        if mcol:
            c_sec = extract_section(list_md[mcol.start():], r"####?\s*5\.1\s*列定义|###\s*5\.1\s*列定义")
        ro_sec = ""
        mro = re.search(r"####?\s*5\.3\s*行操作|###\s*5\.3\s*行操作", list_md)
        if mro:
            ro_sec = extract_section(list_md[mro.start():], r"####?\s*5\.3\s*行操作|###\s*5\.3\s*行操作")
        fields, defaults, mores = parse_query_from_section(q_sec)
        result.append({
            "name": "main",
            "label": "",
            "queryFields": fields,
            "queryDefault": defaults,
            "queryMore": mores,
            "toolbar": parse_toolbar(t_sec),
            "columns": parse_columns(c_sec if c_sec else list_md),
            "rowOps": parse_row_ops(ro_sec),
        })
        return result

    for i, b in enumerate(blocks):
        label = b.group(1).strip()
        start = b.end()
        end = blocks[i + 1].start() if i + 1 < len(blocks) else len(list_md)
        chunk = list_md[start:end]
        q_sec = ""
        for pat in [r"###\s*\d+[、.．]?\s*查询区", r"###\s*查询区"]:
            q_sec = extract_section(chunk, pat)
            if q_sec:
                break
        t_sec = ""
        for pat in [r"###\s*\d+[、.．]?\s*工具条", r"###\s*工具条"]:
            t_sec = extract_section(chunk, pat)
            if t_sec:
                break
        c_sec = ""
        mcol = re.search(r"列定义", chunk)
        if mcol:
            c_sec = chunk[mcol.start(): mcol.start() + 2500]
        ro_sec = ""
        mro = re.search(r"行操作", chunk)
        if mro:
            ro_sec = chunk[mro.start(): mro.start() + 800]
        fields, defaults, mores = parse_query_from_section(q_sec)
        name = f"tab{i+1}"
        if tabs_meta and i < len(tabs_meta):
            name = tabs_meta[i]["name"]
            label = tabs_meta[i]["label"] or label
        result.append({
            "name": name,
            "label": label,
            "queryFields": fields,
            "queryDefault": defaults,
            "queryMore": mores,
            "toolbar": parse_toolbar(t_sec),
            "columns": parse_columns(c_sec),
            "rowOps": parse_row_ops(ro_sec),
        })
    return result


def fallback_columns_from_fields(field_md: str) -> list[dict]:
    cols = []
    for line in field_md.splitlines():
        if not line.startswith("|") or "所属模块" in line or line.startswith("| ---"):
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        if len(cells) < 8:
            continue
        module, name, list_show = cells[0], cells[1], cells[7]
        if list_show != "是":
            continue
        if "明细" in module or "流水" in module:
            # prefer 主表 / 通知单-主表 only for fallback single list
            if "主表" not in module and "通知" not in module:
                continue
            if "明细" in module:
                continue
        if "流水" in module and "通知" not in module:
            continue
        field = re.sub(r"[^\w\u4e00-\u9fff]+", "_", name)
        cols.append({"field": field, "title": name, "width": 120})
        if len(cols) >= 12:
            break
    if cols and not any(c.get("field") == "_actions" for c in cols):
        cols.append({"field": "_actions", "title": "操作", "width": 140, "fixed": "right", "slot": "row_actions"})
    return cols


def parse_form_fields(edit_md: str) -> list[dict]:
    fields = []
    # 3.1 字段与控件 table
    m = re.search(r"###\s*3\.1\s*字段与控件(.*?)(?=\n### |\n## )", edit_md, re.S)
    sec = m.group(1) if m else ""
    for row in parse_md_table(sec):
        name = row.get("字段") or ""
        if not name:
            continue
        ctrl = row.get("控件类型（新增）") or row.get("控件类型") or "手动输入（文本）"
        req = row.get("必填性") or "否"
        ftype = "select" if "下拉" in ctrl else ("date" if "日期" in ctrl else ("picker" if "弹窗" in ctrl else ("readonly" if "自动" in ctrl or "只读" in ctrl or "系统" in ctrl else "input")))
        fields.append({"name": name, "type": ftype, "required": req == "是", "ctrl": ctrl})
    return fields


def parse_detail_header(detail_md: str) -> list[dict]:
    fields = []
    m = re.search(r"##\s*3[、.．]?\s*头信息(.*?)(?=\n## )", detail_md, re.S)
    sec = m.group(1) if m else ""
    for row in parse_md_table(sec):
        name = row.get("字段名称") or row.get("字段") or ""
        if name:
            fields.append({"name": name, "spec": row.get("展示规格") or ""})
    return fields


def make_mock_rows(columns: list[dict], n: int = 5) -> list[dict]:
    rows = []
    biz_cols = [c for c in columns if c.get("field") not in ("_actions",) and c.get("type") not in ("checkbox", "seq")]
    for i in range(n):
        row = {"id": str(i + 1)}
        for j, c in enumerate(biz_cols):
            title = c.get("title", "")
            field = c["field"]
            if "状态" in title:
                row[field] = ["待执行", "执行中", "已完成", "已关闭"][i % 4]
            elif "单号" in title or "编号" in title:
                row[field] = f"DEMO{1000 + i}"
            elif "日期" in title:
                row[field] = f"2026-08-{(i % 28) + 1:02d}"
            elif "时间" in title:
                row[field] = f"2026-08-0{(i % 9) + 1} 10:{i:02d}:00"
            elif "数量" in title or "件数" in title:
                row[field] = (i + 1) * 10
            elif "供应商" in title or "客户" in title:
                row[field] = f"示例{'供应商' if '供应' in title else '客户'}{i + 1}"
            elif "物料" in title:
                row[field] = f"物料A-{i + 1} / 规格"
            else:
                row[field] = f"{title or '值'}{i + 1}"
        rows.append(row)
    return rows


def build_menu(pages: list[dict]) -> list[dict]:
    root: list[dict] = []
    for p in pages:
        parent = root
        path_idx: list[str] = []
        for g in p["groups"]:
            path_idx.append(g)
            idx = "/".join(path_idx)
            found = None
            for it in parent:
                if it.get("title") == g and "children" in it:
                    found = it
                    break
            if not found:
                found = {"title": g, "index": f"g-{idx}", "children": []}
                parent.append(found)
            parent = found["children"]
        parent.append({"title": p["title"], "index": p["id"], "pageId": p["id"]})
    return root


def main():
    pages_out = []
    mock_out = {}
    for pid, title, groups, rel in PAGES:
        folder = PRD_PC / rel
        list_path = folder / "列表页.md"
        edit_path = folder / "新增编辑页.md"
        detail_path = folder / "详情页.md"
        field_path = folder / "字段备注清单.md"
        list_md = list_path.read_text(encoding="utf-8") if list_path.exists() else ""
        edit_md = edit_path.read_text(encoding="utf-8") if edit_path.exists() else ""
        detail_md = detail_path.read_text(encoding="utf-8") if detail_path.exists() else ""
        field_md = field_path.read_text(encoding="utf-8") if field_path.exists() else ""

        tab_blocks = parse_list_tabs_blocks(list_md) if list_md else []
        tabs_meta = parse_tabs(list_md) if list_md else []
        # ensure columns
        for tb in tab_blocks:
            if not tb.get("columns"):
                tb["columns"] = fallback_columns_from_fields(field_md)
            if not tb.get("toolbar"):
                tb["toolbar"] = [{"name": "导出", "type": "default", "desc": ""}]
            if not any(c.get("field") == "_actions" for c in tb["columns"]) and tb.get("rowOps"):
                tb["columns"].append({"field": "_actions", "title": "操作", "width": 140, "fixed": "right", "slot": "row_actions"})

        form_fields = parse_form_fields(edit_md) if edit_md else []
        detail_fields = parse_detail_header(detail_md) if detail_md else []

        page = {
            "id": pid,
            "title": title,
            "groups": groups,
            "breadcrumb": groups + [title],
            "tabs": [{"name": t["name"], "label": t["label"] or title} for t in (tabs_meta if tabs_meta else [{"name": "main", "label": ""}])],
            "tabViews": tab_blocks,
            "formFields": form_fields,
            "detailFields": detail_fields,
            "hasEdit": bool(form_fields),
            "hasDetail": bool(detail_fields) or any(tb.get("rowOps") for tb in tab_blocks),
            "stub": "待补充" in list_md or len(list_md.splitlines()) < 90,
        }
        # if single tabViews with name main and no tabs labels
        if len(page["tabViews"]) == 1 and page["tabViews"][0]["name"] == "main":
            page["tabs"] = []
        pages_out.append(page)

        # mock per tab
        mock_out[pid] = {}
        for tb in page["tabViews"]:
            mock_out[pid][tb["name"]] = make_mock_rows(tb["columns"], 5)

    menu = build_menu(pages_out)

    # write JS
    cfg = {"menu": menu, "pages": {p["id"]: p for p in pages_out}, "pageList": [{"id": p["id"], "title": p["title"], "groups": p["groups"]} for p in pages_out]}
    (OUT_DIR / "page-configs.js").write_text(
        "/* auto-generated from PRD — do not edit by hand; re-run generate_page_configs.py */\n"
        "window.WMS_PAGE_CONFIGS = " + json.dumps(cfg, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )
    (OUT_DIR / "mock-rows.js").write_text(
        "/* auto-generated mock rows */\n"
        "window.WMS_MOCK_ROWS = " + json.dumps(mock_out, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8",
    )
    print(f"pages={len(pages_out)} menu_roots={len(menu)}")
    for p in pages_out:
        tvs = p["tabViews"]
        print(f"  {p['id']}: tabs={len(p['tabs'])} views={len(tvs)} cols0={len(tvs[0]['columns']) if tvs else 0} stub={p['stub']}")


if __name__ == "__main__":
    main()

"""
KKU SecurityScorecard Analytics Processor
This script reads a SecurityScorecard CSV and a master domain mapping file,
normalizes URLs, matches domains to organizations, computes analytics, and
outputs a JSON payload for the backend.
"""

import json
import os
import re
import sys
from urllib.parse import urlparse
import ipaddress
import numpy as np

import pandas as pd
import tldextract
import math

# Force UTF-8 output on Windows consoles to avoid UnicodeEncodeError when printing JSON
if sys.stdout.encoding is None or sys.stdout.encoding.lower().startswith("cp"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
if sys.stderr.encoding is None or sys.stderr.encoding.lower().startswith("cp"):
    try:
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

TH_PUBLIC_SUFFIX = {"ac.th", "co.th", "go.th", "or.th", "in.th", "mi.th", "net.th", "sch.th"}
THAI_NOISE = [
    "และ","go to:", "goto:", "link:", "ลิ้ง", "ลิงค์", "เว็บไซต์",
    "เข้า:", "เข้าที่", "ไปที่", "ดูที่"
]

def read_table_auto(file_path: str) -> pd.DataFrame:
    ext = file_path.lower().split(".")[-1]
    if ext == "csv":
        return pd.read_csv(file_path, dtype=str, encoding="utf-8", na_values=["", "NA", "NaN"])
    elif ext in {"xlsx", "xls"}:
        return pd.read_excel(file_path, dtype=str)
    else:
        raise ValueError("Only CSV and XLSX files are supported")

def is_ip(value: str) -> bool:
    try:
        ipaddress.ip_address(value)
        return True
    except:
        return False

def clean_host(url: str) -> str | None:
    if not url or pd.isna(url):
        return None

    text = str(url).lower().strip()

    # ลบคำขยะภาษาไทย/อังกฤษ
    for noise in THAI_NOISE:
        text = text.replace(noise, "")
    text = text.strip()

    # ตัดเครื่องหมายที่ห่อ URL
    text = text.strip('''"'()[]<>.,''')

    # แก้ protocol พัง
    text = text.replace("https//", "https://")
    text = text.replace("http//", "http://")
    text = text.replace("hxxps://", "https://")
    text = text.replace("hxxp://", "http://")

    # เติม protocol ถ้าไม่มี จะได้ใช้ urlparse ได้
    if not text.startswith("http"):
        text = "http://" + text

    parsed = urlparse(text)
    host = parsed.hostname or text
    host = host.replace("www.", "").split(":")[0].rstrip("/")
    
    if not host:
        return None

    # IMPORTANT: check IP first
    if is_ip(host):
        return host

    # check single hostname (no dot)
    if "." not in host:
        return host
    
    extr = tldextract.extract(host)

    # no suffix → internal domain (corp.local etc.)
    if not extr.suffix:
        return host
    
    if extr.subdomain:
        host = f"{extr.subdomain}.{extr.domain}.{extr.suffix}"
    else:
        host = f"{extr.domain}.{extr.suffix}"
    
    return host

def extract_asset_host(row) -> tuple[str, str]:
    """
    return (asset_host, asset_type)
    priority:
    FINAL URL → INITIAL URL → HOSTNAME → SUBDOMAIN → TARGET → IP → GLOBAL
    """

    def get_host(val):
        h = clean_host(val)
        return h if h else None

    # 1 FINAL URL (ส่วนใหญ่ของระบบ)
    if pd.notna(row.get("FINAL URL")):
        h = get_host(row["FINAL URL"])
        if h:
            return h, "web"

    # 2 INITIAL URL (redirect scan)
    if pd.notna(row.get("INITIAL URL")):
        h = get_host(row["INITIAL URL"])
        if h:
            return h, "web"

    # 3 HOSTNAME (DNS / leaked / browser log)
    if pd.notna(row.get("HOSTNAME")):
        h = get_host(row["HOSTNAME"])
        if h:
            return h, "dns"

    # 4 SUBDOMAIN
    if pd.notna(row.get("SUBDOMAIN")):
        h = get_host(row["SUBDOMAIN"])
        if h:
            return h, "dns"

    # 5 TARGET (network scan)
    if pd.notna(row.get("TARGET")):
        h = get_host(row["TARGET"])
        if h:
            return h, "network"

    # 6 IP ADDRESS
    ip = row.get("IP ADDRESSES")
    if pd.notna(ip) and str(ip).strip() != "":
        return str(ip).strip(), "ip"

    # 7 GLOBAL (patching / typosquat)
    return "GLOBAL_ASSET", "global"

def match_org(host: str, master_domains: list[str]) -> str | None:
    if not host or pd.isna(host):
        return None

    matches = [
        domain for domain in master_domains
        if not pd.isna(domain) and (host == domain or host.endswith("." + domain))
    ]
    # เอา domain ที่ยาวที่สุด (เฉพาะสุด)
    return max(matches, key=len) if matches else None

def is_root_domain(domain):
    if pd.isna(domain):
        return True
    
    # IP = ใช้ได้
    if re.match(r'^\d+\.\d+\.\d+\.\d+$', domain):
        return False
    
    parts = domain.split(".")
    
    if len(parts) < 2:
        return True
    
    suffix = ".".join(parts[-2:])   # ac.th
    
    # ถ้าเป็นโดเมนไทย
    if suffix in TH_PUBLIC_SUFFIX:
        # kku.ac.th → length = 3 → root
        if len(parts) == 3:
            return True
        else:
            return False
    
    # โดเมนทั่วไป google.com
    if len(parts) == 2:
        return True
    
    return False

def df_to_records(df: pd.DataFrame):
    return df.where(pd.notna(df), None).to_dict(orient="records")


def process_files(score_file: str, master_file: str) -> dict:
    SEC_COLS_SHOW = [
        "FACTOR NAME",
        "ISSUE TYPE TITLE",
        "ISSUE TYPE SEVERITY",
        "FINAL URL",
        "HEADERS",
        "ISSUE TYPE SCORE IMPACT"
    ]
    
    SEC_COLS = [
    "FACTOR NAME",
    "ISSUE TYPE TITLE",
    "ISSUE TYPE SEVERITY",
    "IP ADDRESSES", "HOSTNAME", "SUBDOMAIN", "TARGET", "PORTS",
    "INITIAL URL","FINAL URL",
    "HEADERS",
    "ISSUE TYPE SCORE IMPACT",
    ]

    SEC_COLS_for_test = [
        "FACTOR NAME",
        "ISSUE TYPE TITLE",
        "ISSUE TYPE SEVERITY",
        "IP ADDRESSES", "HOSTNAME", "SUBDOMAIN", "TARGET", "PORTS",
        "FINAL URL",
        "ISSUE TYPE SCORE IMPACT",
        "asset_host", "asset_type", "matched_domain", "Organization", "abbr_en",
    ]

    score_df = read_table_auto(score_file)
    for col in SEC_COLS:
        if col not in score_df.columns:
            score_df[col] = None
    score_df = score_df[SEC_COLS].copy()
    score_df = score_df.sort_values(by=["FINAL URL", "HEADERS"]).reset_index(drop=True)
    score_df["ID"] = score_df.index + 1

    master_df = read_table_auto(master_file)
    master_df = master_df.rename(columns={
        "URL ของเว็บไซต์": "URLWebsite",
        "เว็บไซต์ของส่วนงาน(คณะ/วิทยาลัย/สำนัก)": "Organization"
    })
    if "URLWebsite" not in master_df.columns and "urlwebsite" in [c.lower() for c in master_df.columns]:
        master_df.columns = [c if c.lower() != "urlwebsite" else "URLWebsite" for c in master_df.columns]

    master_org = [
        {"thai":"สำนักงานอธิการบดี","eng":"Central Administration Division:Office of the President","abbr_th":"","abbr_en":"OP"},
        {"thai":"สำนักงานสภามหาวิทยาลัย","eng":"Office of the University Council","abbr_th":"","abbr_en":"OUC"},
        {"thai":"สำนักเทคโนโลยีดิจิทัล","eng":"Office of Digital Technology","abbr_th":"","abbr_en":"ODT"},
        {"thai":"สำนักหอสมุด","eng":"Khon Kaen University Library","abbr_th":"","abbr_en":"KKUL"},
        {"thai":"สำนักบริการวิชาการ","eng":"Office of Academic Service KKU","abbr_th":"","abbr_en":"OAS"},
        {"thai":"สำนักบริหารและพัฒนาวิชาการ","eng":"Bureau of Academic Administration and Development","abbr_th":"","abbr_en":"REG"},
        
        {"thai":"คณะเทคนิคการแพทย์","eng":"Faculty of Associated Medical Sciences","abbr_th":"ทนพ.","abbr_en":"AMS"},
        {"thai":"คณะทันตแพทยศาสตร์","eng":"Faculty of Dentistry","abbr_th":"ทพ.","abbr_en":"DENT"},
        {"thai":"คณะพยาบาลศาสตร์","eng":"Faculty of Nursing","abbr_th":"พยบ.","abbr_en":"NU"},
        {"thai":"คณะแพทยศาสตร์","eng":"Faculty of Medicine","abbr_th":"พ.","abbr_en":"MD"},
        {"thai":"คณะเภสัชศาสตร์","eng":"Faculty of Pharmaceutical Sciences","abbr_th":"ภ.","abbr_en":"PS"},
        {"thai":"คณะสัตวแพทยศาสตร์","eng":"Faculty of Veterinary Medicine","abbr_th":"สพ.","abbr_en":"VM"},
        {"thai":"คณะสาธารณสุขศาสตร์","eng":"Faculty of Public Health","abbr_th":"สธ.","abbr_en":"PH"},
        
        {"thai":"คณะเกษตรศาสตร์","eng":"Faculty of Agriculture","abbr_th":"กษ.","abbr_en":"AG"},
        {"thai":"คณะเทคโนโลยี","eng":"Faculty of Technology","abbr_th":"ทล.","abbr_en":"TE"},
        {"thai":"คณะวิทยาศาสตร์","eng":"Faculty of Science","abbr_th":"วท.","abbr_en":"SCI"},
        {"thai":"คณะวิศวกรรมศาสตร์","eng":"Faculty of Engineering","abbr_th":"วศ.","abbr_en":"EN"},
        {"thai":"คณะสถาปัตยกรรมศาสตร์","eng":"Faculty of Architecture","abbr_th":"สถ.","abbr_en":"ARCH"},
        {"thai":"วิทยาลัยการคอมพิวเตอร์","eng":"College of Computing","abbr_th":"วค.","abbr_en":"CP"},
        
        {"thai":"คณะนิติศาสตร์","eng":"Faculty of Law","abbr_th":"นต.","abbr_en":"LW"},
        {"thai":"คณะบริหารธุรกิจและการบัญชี","eng":"Khon Kaen Business School","abbr_th":"บธ.","abbr_en":"KKBS"},
        {"thai":"คณะมนุษยศาสตร์และสังคมศาสตร์","eng":"Faculty of Humanities and Social Sciences","abbr_th":"มนส.","abbr_en":"HUSO"},
        {"thai":"คณะศิลปกรรมศาสตร์","eng":"Faculty of Fine and Applied Arts","abbr_th":"ศป.","abbr_en":"FA"},
        {"thai":"คณะศึกษาศาสตร์","eng":"Faculty of Education","abbr_th":"ศษ.","abbr_en":"ED"},
        {"thai":"คณะเศรษฐศาสตร์","eng":"Faculty of Economics","abbr_th":"ศ.","abbr_en":"ECON"},
        
        {"thai":"วิทยาลัยการปกครองท้องถิ่น","eng":"College of Local Administration","abbr_th":"วปท.","abbr_en":"COLA"},
        {"thai":"วิทยาลัยนานาชาติ","eng":"International College","abbr_th":"","abbr_en":"KKUIC"},
        {"thai":"วิทยาลัยบัณฑิตศึกษาการจัดการ","eng":"College of Graduate Study in Management","abbr_th":"","abbr_en":"MBA"},
        {"thai":"คณะสหวิทยาการ","eng":"Faculty of Interdisciplinary Studies","abbr_th":"สห.","abbr_en":"IS"},
        {"thai":"บัณฑิตวิทยาลัย","eng":"Graduate School","abbr_th":"บว.","abbr_en":"GS"},
        
        {"thai":"โรงเรียนสาธิต","eng":"Khon Kaen University Demonstration School","abbr_th":"","abbr_en":"SATIT"},
        {"thai":"หน่วยงานอื่น(โปรดระบุชื่อหน่วยงานในข้อหน่วยงานย่อย)","eng":"Other Organization","abbr_th":"","abbr_en":"OTHER"},
    ]

    org_df = pd.DataFrame(master_org)

    org_df["search_keys"] = (
        org_df["thai"] + "|" +
        org_df["eng"] + "|" +
        org_df["abbr_th"] + "|" +
        org_df["abbr_en"]
    ).str.lower()
    
    master_df = master_df.merge(
        org_df[["thai","abbr_en"]],
        left_on="Organization",
        right_on="thai",
        how="left",
    )
    master_df = master_df.drop(columns="thai")
        
    # print("🌐 Cleaning domains...", file=sys.stderr)
    # 1) clean host score_df
    score_df[["asset_host", "asset_type"]] = score_df.apply(extract_asset_host, axis=1, result_type="expand")
    # 2) clean host master_df
    master_df["master_domain"] = master_df["URLWebsite"].apply(clean_host)
    
    # unique domain ทั้งหมดจาก master_df และ เอา root domain (kku.ac.th) ออก
    master_list = [d for d in master_df["master_domain"].dropna().unique() if not is_root_domain(d)]
    
    # print("🔗 Matching domains...", file=sys.stderr)
    # 3) match host จาก score_df กับ master domain
    score_df["matched_domain"] = score_df["asset_host"].apply(lambda x: match_org(x, master_list) if x not in ["GLOBAL_ASSET"] else None)    

    result = score_df.merge(
        master_df[["Organization","abbr_en","master_domain"]],
        left_on="matched_domain",
        right_on="master_domain",
        how="left"
    )
    result["abbr_en"] = (result["abbr_en"].fillna(""))

    maskNoAsset = result["asset_host"].isna()
    result.loc[maskNoAsset, ["asset_host","matched_domain","Organization","master_domain"]] = "no data"

    maskUnknown = (
        result["asset_host"].notna() &
        result["asset_host"].ne("no data") &
        result["matched_domain"].isna()
    )
    result.loc[maskUnknown, ["matched_domain", "Organization", "master_domain"]] = "unknown"
    result["abbr_en"] = result["abbr_en"].fillna("")
    
    # 3 count issue severity by type (high, medium, low, info)
    severity_order = ["HIGH", "MEDIUM", "LOW", "INFO"]
    severity_count = result["ISSUE TYPE SEVERITY"].value_counts().reindex(severity_order, fill_value=0)
    # 4 total issue count per factor and issue type and score impact per issue
    issue_type_df = result[["FACTOR NAME", "ISSUE TYPE TITLE", "ISSUE TYPE SCORE IMPACT"]].drop_duplicates().reset_index(drop=True)
    issue_count = result.groupby(["FACTOR NAME", "ISSUE TYPE TITLE"]).size().reset_index(name="TOTAL_ISSUES")
    issue_score = issue_type_df.merge(issue_count, on=["FACTOR NAME", "ISSUE TYPE TITLE"], how="left")
    issue_score["SCORE_PER_ISSUE"] = issue_score["ISSUE TYPE SCORE IMPACT"].astype(float) / issue_score["TOTAL_ISSUES"].astype(float)
    issue_score = issue_score.sort_values(["FACTOR NAME", "ISSUE TYPE TITLE"]).reset_index(drop=True)

    # 1 issue total count per org
    org_total_issues = result.groupby("Organization").size().reset_index(name="total_issues").sort_values("total_issues", ascending=False)
    # 2 issue count (high, medium, low, info, total) per org
    org_severity = result.groupby(["Organization", "ISSUE TYPE SEVERITY"]).size().unstack(fill_value=0).reindex(columns=severity_order, fill_value=0).reset_index()
    for col in severity_order:
        if col not in org_severity.columns:
            org_severity[col] = 0
    org_severity = org_severity.merge(org_total_issues, on="Organization", how="left")
    org_severity = org_severity[["Organization"] + severity_order + ["total_issues"]]
    
    # 5 score per issue by org
    df_scored = result.merge(
        issue_score[["FACTOR NAME", "ISSUE TYPE TITLE", "SCORE_PER_ISSUE"]],
        on=["FACTOR NAME", "ISSUE TYPE TITLE"],
        how="left"
    )
    
    # 6 risk by assets and total issues show wiyh org
    risk_by_host = (
        df_scored.groupby("asset_host", as_index=False)
        .agg(
            TOTAL_RISK_SCORE=("SCORE_PER_ISSUE", "sum"),
            TOTAL_ISSUES=("asset_host", "count"),
            ORGANIZATION=("Organization", "first")
        )
        .sort_values(by=["TOTAL_ISSUES", "TOTAL_RISK_SCORE"], ascending=[False, False])
        .head(10)
    )
    
    # 7 issue count by org | factor name | issue type
    org_issue_type = result.groupby(["Organization", "FACTOR NAME", "ISSUE TYPE TITLE"]
        ).size().reset_index(name="count").sort_values(["Organization", "count"], ascending=[True, False])
    
    # 8.1.1 score per issue [solution 1.1]
    org_score = df_scored.groupby("Organization")["SCORE_PER_ISSUE"].sum().reset_index(name="TOTAL_DEDUCTION")
    org_score["SECURITY_SCORE"] = (100 - org_score["TOTAL_DEDUCTION"]).clip(lower=0)
    
    # 8.1.2 score per issue [solution 1.2]
    df_factory_score = org_score.merge(org_severity, on="Organization", how="left")
    df_factory_score = df_factory_score.sort_values("SECURITY_SCORE")
    
    # 5.4 score per issue [solution 4]
    TOTAL_DEDUCTION_ALL = df_scored["SCORE_PER_ISSUE"].sum()
    UNIVERSITY_SCORE = 100 - TOTAL_DEDUCTION_ALL

    org_deduction = (
        df_scored
        .groupby("Organization")["SCORE_PER_ISSUE"]
        .sum()
        .reset_index(name="ORG_DEDUCTION")
    )
    
    if TOTAL_DEDUCTION_ALL == 0:
        org_deduction["RISK_SHARE"] = 0
    else:
        org_deduction["RISK_SHARE"] = (
            org_deduction["ORG_DEDUCTION"] / TOTAL_DEDUCTION_ALL
        )
        
    # คำนวณคะแนนคณะจากคะแนนมหาลัย
    # คณะเสียคะแนน = UNIVERSITY_SCORE × RISK_SHARE 
    # // อิงคะแนนจากคะแนนมหาลัย ไม่ใช่อิงจากคะแนน 100 โดยตรง 
    # // คณะไหนทำเสีย คะแนนก็จะน้อยกว่าของมหาลัย ,แต่ถ้าไม่ไม่ได้เสียคะแนนมันก็จะเท่าของมหาลัย
    # คณะเหลือคะแนน = UNIVERSITY_SCORE × (1 − RISK_SHARE)
    org_deduction["SECURITY_SCORE"] = (
        UNIVERSITY_SCORE * (1 - org_deduction["RISK_SHARE"])
    )
    
    org_deduction["SECURITY_SCORE"] = (
        100 - (org_deduction["RISK_SHARE"] * TOTAL_DEDUCTION_ALL)
    )
    org_deduction = org_deduction.sort_values("SECURITY_SCORE", ascending=True)
    # col Organization	ORG_DEDUCTION	RISK_SHARE	SECURITY_SCORE
    org_score = org_deduction[["Organization", "SECURITY_SCORE"]].copy()

    issue_domain_count = (
        df_scored.groupby("ISSUE TYPE TITLE")["asset_host"]
        .count()
        .reset_index(name="DOMAIN_COUNT")
    )
    

    cols_export = [
        "ID",
        "Organization",
        "FACTOR NAME",
        "ISSUE TYPE TITLE",
        "ISSUE TYPE SEVERITY",
        "FINAL URL",
        "HEADERS",
        "matched_domain",
        "ISSUE TYPE SCORE IMPACT",
        "asset_host",
        "asset_type",
    ]

    used_domains = result["matched_domain"].dropna().unique()
    unused_master = master_df[~master_df["master_domain"].isin(used_domains)].copy()
    all_not_in_domain = result[result["matched_domain"].isna()].copy()
    all_not_in_domain = all_not_in_domain[cols_export].sort_values(by=["FINAL URL", "HEADERS"])
    url_not_in_domain = result[(result["matched_domain"].isna()) & 
                               (result["FINAL URL"].notna()) & 
                               (result["FINAL URL"].str.strip() != "")].copy()
    url_not_in_domain = url_not_in_domain[cols_export].sort_values(by=["FINAL URL", "HEADERS"])
    url_not_in_domain_unique = url_not_in_domain.drop_duplicates(subset=["FINAL URL"])
    
    # Create a DataFrame for organizations
    organization = master_df["Organization"].drop_duplicates().unique().copy()
    organization = pd.DataFrame(organization, columns=["organization"])
    undefinedOrg = pd.DataFrame({"organization": ["โรงเรียนสาธิต", "no data", "unknown"]})
    organization = pd.concat([organization, undefinedOrg], ignore_index=True)
    
    # asset_inventory: all SSC-detected assets (every row has at least 1 issue)
    asset_inventory = (
        df_scored.groupby(["asset_host", "asset_type", "Organization"], as_index=False)
        .agg(
            total_issues=("asset_host", "count"),
            critical_issues=("ISSUE TYPE SEVERITY", lambda x: (x == "HIGH").sum()),
            risk_score=("SCORE_PER_ISSUE", "sum"),
        )
    )
    asset_inventory["status"] = "issue"

    # healthy_assets: master_df domains that never appeared in the SSC report
    issue_hosts = set(asset_inventory["asset_host"].dropna().unique())
    healthy_assets = master_df[
        master_df["master_domain"].notna() &
        ~master_df["master_domain"].isin(issue_hosts)
    ].copy()
    healthy_assets = healthy_assets.rename(columns={"master_domain": "asset_host"})
    healthy_assets["asset_type"] = "web"
    healthy_assets["total_issues"] = 0
    healthy_assets["critical_issues"] = 0
    healthy_assets["risk_score"] = 0.0
    healthy_assets["status"] = "healthy"
    healthy_assets = healthy_assets[[
        "asset_host", "asset_type", "Organization",
        "total_issues", "critical_issues", "risk_score", "status"
    ]]

    asset_inventory_full = pd.concat(
        [asset_inventory, healthy_assets],
        ignore_index=True
    )

    asset_summary = {
        "total_assets": int(asset_inventory_full.shape[0]),
        "issue_assets": int((asset_inventory_full["status"] == "issue").sum()),
        "healthy_assets": int((asset_inventory_full["status"] == "healthy").sum()),
        "unknown_assets": int((asset_inventory_full["Organization"] == "unknown").sum()),
        "by_type": {
            "web": int((asset_inventory_full["asset_type"] == "web").sum()),
            "dns": int((asset_inventory_full["asset_type"] == "dns").sum()),
            "ip": int((asset_inventory_full["asset_type"] == "ip").sum()),
            "network": int((asset_inventory_full["asset_type"] == "network").sum()),
            "global": int((asset_inventory_full["asset_type"] == "global").sum()),
        },
    }

    return {
        "factory_score": df_to_records(df_factory_score),
        "org_severity": df_to_records(org_severity),
        "org_issue_type": df_to_records(org_issue_type),
        "severity_count": severity_count.to_dict(),
        "issue_score": df_to_records(issue_score),
        "org_score": df_to_records(org_score),
        "raw_result": df_to_records(result[cols_export].sort_values("Organization")),
        # "main_units": df_to_records(result[~(mask_satit | mask_president)][cols_export].sort_values("Organization")),
        # "special_units": df_to_records(result[mask_satit | mask_president][cols_export].sort_values("Organization")),
        "unused_master": df_to_records(unused_master),
        "all_not_in_domain": df_to_records(all_not_in_domain),
        "url_not_in_domain_unique": df_to_records(url_not_in_domain_unique),
        "organization": df_to_records(organization),
        "risk_by_host": df_to_records(risk_by_host),
        "asset_summary": asset_summary,
        "asset_inventory": df_to_records(asset_inventory_full),
        # "asset_type_distribution": asset_type_distribution,
        # "coverage": coverage,
    }


def df_to_records(df):
    return (
        df.astype(object)
          .replace({np.nan: None})
          .to_dict(orient="records")
    )
# def df_to_records(dataframe: pd.DataFrame):
#     return dataframe.where(pd.notna(dataframe), None).to_dict(orient="records")


def find_bad_values(obj, path="root"):
    if isinstance(obj, dict):
        for k, v in obj.items():
            find_bad_values(v, f"{path}.{k}")

    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            find_bad_values(v, f"{path}[{i}]")

    elif isinstance(obj, float):
        if math.isnan(obj):
            print(f"NaN at {path}", file=sys.stderr)

        elif math.isinf(obj):
            print(f"Infinity at {path}: {obj}", file=sys.stderr)

def main():
    if len(sys.argv) < 3:
        print("Usage: python codeProcessData.py <securityscorecard.csv> <master_domains.csv>", file=sys.stderr)
        sys.exit(1)

    score_file = sys.argv[1]
    master_file = sys.argv[2]

    result = process_files(score_file, master_file)
    find_bad_values(result)
    sys.stdout.buffer.write(
        json.dumps(
            result,
            ensure_ascii=False,
            allow_nan=False
        ).encode("utf-8")
    )
    sys.stdout.buffer.write(b"\n")


if __name__ == "__main__":
    main()

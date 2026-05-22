"""
generate_agencies_seed.py
=========================
Generates V010__seed_agencies.sql from a structured Python dataset of Thai
government agencies. Run this script whenever you want to expand the seed.

Usage:
    python3 generate_agencies_seed.py > ../migrations/V010__seed_agencies.sql

Conventions:
    UUIDs use a stable, human-readable scheme so referencing is easy:
        ministries:        00000001-0000-4001-8000-{seq:012d}
        departments:       00000001-0000-4002-8000-{seq:012d}
        state_enterprises: 00000001-0000-4003-8000-{seq:012d}
        universities:      00000001-0000-4004-8000-{seq:012d}
        local_admins:      00000001-0000-4005-8000-{seq:012d}
        independent:       00000001-0000-4006-8000-{seq:012d}
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional


def mid(kind: int, seq: int) -> str:
    """Build a stable UUID for an agency."""
    return f"00000001-0000-4{kind:03d}-8000-{seq:012d}"


@dataclass
class Agency:
    name_th: str
    agency_type: str
    short_name: Optional[str] = None
    name_en: Optional[str] = None
    parent_seq: Optional[int] = None  # within its ministry
    parent_kind: Optional[int] = None
    aliases: list[str] = field(default_factory=list)


# ----------------------------------------------------------------------------
# Ministries (20)
# ----------------------------------------------------------------------------
MINISTRIES = [
    ("สำนักนายกรัฐมนตรี", "นร.", "Office of the Prime Minister", ["สนร.", "สำนักนายก"]),
    ("กระทรวงกลาโหม", "กห.", "Ministry of Defence", ["MoD"]),
    ("กระทรวงการคลัง", "กค.", "Ministry of Finance", ["MoF"]),
    ("กระทรวงการต่างประเทศ", "กต.", "Ministry of Foreign Affairs", ["MFA"]),
    ("กระทรวงการท่องเที่ยวและกีฬา", "กก.", "Ministry of Tourism and Sports", ["MoTS"]),
    ("กระทรวงการพัฒนาสังคมและความมั่นคงของมนุษย์", "พม.", "Ministry of Social Development and Human Security", []),
    ("กระทรวงการอุดมศึกษา วิทยาศาสตร์ วิจัยและนวัตกรรม", "อว.", "Ministry of Higher Education, Science, Research and Innovation", ["MHESI"]),
    ("กระทรวงเกษตรและสหกรณ์", "กษ.", "Ministry of Agriculture and Cooperatives", ["MoAC"]),
    ("กระทรวงคมนาคม", "คค.", "Ministry of Transport", ["MoT"]),
    ("กระทรวงดิจิทัลเพื่อเศรษฐกิจและสังคม", "ดศ.", "Ministry of Digital Economy and Society", ["MDES", "ดีอี"]),
    ("กระทรวงทรัพยากรธรรมชาติและสิ่งแวดล้อม", "ทส.", "Ministry of Natural Resources and Environment", ["MNRE"]),
    ("กระทรวงพลังงาน", "พน.", "Ministry of Energy", []),
    ("กระทรวงพาณิชย์", "พณ.", "Ministry of Commerce", ["MoC"]),
    ("กระทรวงมหาดไทย", "มท.", "Ministry of Interior", ["MoI"]),
    ("กระทรวงยุติธรรม", "ยธ.", "Ministry of Justice", ["MoJ"]),
    ("กระทรวงแรงงาน", "รง.", "Ministry of Labour", []),
    ("กระทรวงวัฒนธรรม", "วธ.", "Ministry of Culture", []),
    ("กระทรวงศึกษาธิการ", "ศธ.", "Ministry of Education", ["MoE"]),
    ("กระทรวงสาธารณสุข", "สธ.", "Ministry of Public Health", ["MoPH"]),
    ("กระทรวงอุตสาหกรรม", "อก.", "Ministry of Industry", []),
]


# ----------------------------------------------------------------------------
# Departments — keyed by ministry sequence number (1-based as above)
# ----------------------------------------------------------------------------
DEPARTMENTS: dict[int, list[tuple]] = {
    # 1 - สำนักนายกรัฐมนตรี
    1: [
        ("สำนักงานปลัดสำนักนายกรัฐมนตรี", "สปน."),
        ("สำนักเลขาธิการคณะรัฐมนตรี", "สลค."),
        ("สำนักเลขาธิการนายกรัฐมนตรี", "สลน."),
        ("สำนักงานคณะกรรมการกฤษฎีกา", "สคก."),
        ("สำนักงานคณะกรรมการพัฒนาระบบราชการ", "ก.พ.ร."),
        ("สำนักงาน ก.พ.", "ก.พ."),
        ("กรมประชาสัมพันธ์", "กปส."),
        ("สำนักข่าวกรองแห่งชาติ", "สขช."),
        ("สำนักงบประมาณ", "สงป."),
        ("สำนักงานสภาพัฒนาการเศรษฐกิจและสังคมแห่งชาติ", "สศช."),
    ],
    # 2 - กระทรวงกลาโหม
    2: [
        ("สำนักงานปลัดกระทรวงกลาโหม", "สป.กห."),
        ("กองทัพบก", "ทบ."),
        ("กองทัพเรือ", "ทร."),
        ("กองทัพอากาศ", "ทอ."),
        ("กองบัญชาการกองทัพไทย", "บก.ทท."),
    ],
    # 3 - กระทรวงการคลัง
    3: [
        ("สำนักงานปลัดกระทรวงการคลัง", "สป.กค."),
        ("กรมธนารักษ์", "ธร."),
        ("กรมบัญชีกลาง", "บก."),
        ("กรมศุลกากร", "ศก."),
        ("กรมสรรพากร", "สรพ."),
        ("กรมสรรพสามิต", "สรส."),
        ("สำนักงานเศรษฐกิจการคลัง", "สศค."),
        ("สำนักงานคณะกรรมการนโยบายรัฐวิสาหกิจ", "สคร."),
        ("สำนักงานบริหารหนี้สาธารณะ", "สบน."),
    ],
    # 4 - กระทรวงการต่างประเทศ
    4: [
        ("สำนักงานปลัดกระทรวงการต่างประเทศ", "สป.กต."),
        ("กรมเศรษฐกิจระหว่างประเทศ", "ศป."),
        ("กรมการกงสุล", "กงล."),
        ("กรมสารนิเทศ", "สน."),
    ],
    # 5 - กระทรวงการท่องเที่ยวและกีฬา
    5: [
        ("สำนักงานปลัดกระทรวงการท่องเที่ยวและกีฬา", "สป.กก."),
        ("กรมการท่องเที่ยว", "กทท."),
        ("กรมพลศึกษา", "กพล."),
    ],
    # 6 - กระทรวงการพัฒนาสังคมและความมั่นคงของมนุษย์
    6: [
        ("สำนักงานปลัดกระทรวงการพัฒนาสังคมและความมั่นคงของมนุษย์", "สป.พม."),
        ("กรมกิจการเด็กและเยาวชน", "ดย."),
        ("กรมกิจการผู้สูงอายุ", "ผส."),
        ("กรมกิจการสตรีและสถาบันครอบครัว", "สค."),
        ("กรมพัฒนาสังคมและสวัสดิการ", "พส."),
        ("กรมส่งเสริมและพัฒนาคุณภาพชีวิตคนพิการ", "พก."),
    ],
    # 7 - กระทรวงการอุดมศึกษา
    7: [
        ("สำนักงานปลัดกระทรวงการอุดมศึกษาฯ", "สป.อว."),
        ("สำนักงานคณะกรรมการการอุดมศึกษา", "สกอ."),
        ("กรมวิทยาศาสตร์บริการ", "วศ."),
        ("สำนักงานปรมาณูเพื่อสันติ", "ปส."),
        ("สำนักงานพัฒนาวิทยาศาสตร์และเทคโนโลยีแห่งชาติ", "สวทช."),
    ],
    # 8 - กระทรวงเกษตรและสหกรณ์
    8: [
        ("สำนักงานปลัดกระทรวงเกษตรและสหกรณ์", "สป.กษ."),
        ("กรมการข้าว", "กข."),
        ("กรมประมง", "กป."),
        ("กรมปศุสัตว์", "ปศ."),
        ("กรมพัฒนาที่ดิน", "พด."),
        ("กรมวิชาการเกษตร", "วก."),
        ("กรมส่งเสริมการเกษตร", "สกษ."),
        ("กรมส่งเสริมสหกรณ์", "กสส."),
        ("กรมชลประทาน", "ชป."),
        ("กรมการค้าข้าวและสินค้าเกษตร", None),
        ("สำนักงานเศรษฐกิจการเกษตร", "สศก."),
        ("สำนักงานการปฏิรูปที่ดินเพื่อเกษตรกรรม", "ส.ป.ก."),
    ],
    # 9 - กระทรวงคมนาคม
    9: [
        ("สำนักงานปลัดกระทรวงคมนาคม", "สป.คค."),
        ("กรมการขนส่งทางบก", "ขบ."),
        ("กรมเจ้าท่า", "จท."),
        ("กรมท่าอากาศยาน", "ทย."),
        ("กรมทางหลวง", "ทล."),
        ("กรมทางหลวงชนบท", "ทช."),
        ("กรมการบินพลเรือน", "บพ."),
        ("กรมการขนส่งทางราง", "ขร."),
        ("สำนักงานนโยบายและแผนการขนส่งและจราจร", "สนข."),
    ],
    # 10 - กระทรวงดิจิทัล
    10: [
        ("สำนักงานปลัดกระทรวงดิจิทัลเพื่อเศรษฐกิจและสังคม", "สป.ดศ."),
        ("สำนักงานคณะกรรมการดิจิทัลเพื่อเศรษฐกิจและสังคมแห่งชาติ", "สดช."),
        ("กรมอุตุนิยมวิทยา", "อต."),
        ("สำนักงานสถิติแห่งชาติ", "สสช."),
        ("สำนักงานพัฒนาธุรกรรมทางอิเล็กทรอนิกส์", "สพธอ."),
    ],
    # 11 - กระทรวงทรัพยากรธรรมชาติ
    11: [
        ("สำนักงานปลัดกระทรวงทรัพยากรธรรมชาติและสิ่งแวดล้อม", "สป.ทส."),
        ("กรมทรัพยากรน้ำ", "ทน."),
        ("กรมทรัพยากรธรณี", "ทธ."),
        ("กรมทรัพยากรทางทะเลและชายฝั่ง", "ทช."),
        ("กรมป่าไม้", "ปม."),
        ("กรมอุทยานแห่งชาติ สัตว์ป่า และพันธุ์พืช", "อส."),
        ("กรมควบคุมมลพิษ", "คพ."),
        ("กรมส่งเสริมคุณภาพสิ่งแวดล้อม", "สส."),
        ("กรมทรัพยากรน้ำบาดาล", "ทบ."),
    ],
    # 12 - กระทรวงพลังงาน
    12: [
        ("สำนักงานปลัดกระทรวงพลังงาน", "สป.พน."),
        ("กรมเชื้อเพลิงธรรมชาติ", "ชธ."),
        ("กรมธุรกิจพลังงาน", "ธพ."),
        ("กรมพัฒนาพลังงานทดแทนและอนุรักษ์พลังงาน", "พพ."),
        ("สำนักงานนโยบายและแผนพลังงาน", "สนพ."),
    ],
    # 13 - กระทรวงพาณิชย์
    13: [
        ("สำนักงานปลัดกระทรวงพาณิชย์", "สป.พณ."),
        ("กรมการค้าต่างประเทศ", "คต."),
        ("กรมการค้าภายใน", "คน."),
        ("กรมเจรจาการค้าระหว่างประเทศ", "จร."),
        ("กรมทรัพย์สินทางปัญญา", "ทป."),
        ("กรมพัฒนาธุรกิจการค้า", "พค."),
        ("กรมส่งเสริมการค้าระหว่างประเทศ", "สค."),
    ],
    # 14 - กระทรวงมหาดไทย
    14: [
        ("สำนักงานปลัดกระทรวงมหาดไทย", "สป.มท."),
        ("กรมการปกครอง", "ปค."),
        ("กรมการพัฒนาชุมชน", "พช."),
        ("กรมที่ดิน", "ทด."),
        ("กรมป้องกันและบรรเทาสาธารณภัย", "ปภ."),
        ("กรมโยธาธิการและผังเมือง", "ยผ."),
        ("กรมส่งเสริมการปกครองท้องถิ่น", "สถ."),
    ],
    # 15 - กระทรวงยุติธรรม
    15: [
        ("สำนักงานปลัดกระทรวงยุติธรรม", "สป.ยธ."),
        ("กรมคุมประพฤติ", "คป."),
        ("กรมบังคับคดี", "บค."),
        ("กรมพินิจและคุ้มครองเด็กและเยาวชน", "พด.ย."),
        ("กรมราชทัณฑ์", "รท."),
        ("กรมสอบสวนคดีพิเศษ", "DSI"),
        ("สำนักงานคณะกรรมการป้องกันและปราบปรามยาเสพติด", "ป.ป.ส."),
    ],
    # 16 - กระทรวงแรงงาน
    16: [
        ("สำนักงานปลัดกระทรวงแรงงาน", "สป.รง."),
        ("กรมการจัดหางาน", "กจ."),
        ("กรมพัฒนาฝีมือแรงงาน", "พร."),
        ("กรมสวัสดิการและคุ้มครองแรงงาน", "กสร."),
        ("สำนักงานประกันสังคม", "สปส."),
    ],
    # 17 - กระทรวงวัฒนธรรม
    17: [
        ("สำนักงานปลัดกระทรวงวัฒนธรรม", "สป.วธ."),
        ("กรมศิลปากร", "ศก."),
        ("กรมส่งเสริมวัฒนธรรม", "สวธ."),
        ("กรมการศาสนา", "ศน."),
    ],
    # 18 - กระทรวงศึกษาธิการ
    18: [
        ("สำนักงานปลัดกระทรวงศึกษาธิการ", "สป.ศธ."),
        ("สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน", "สพฐ."),
        ("สำนักงานคณะกรรมการการอาชีวศึกษา", "สอศ."),
        ("สำนักงานคณะกรรมการส่งเสริมการศึกษาเอกชน", "สช."),
        ("สำนักงานเลขาธิการสภาการศึกษา", "สกศ."),
    ],
    # 19 - กระทรวงสาธารณสุข
    19: [
        ("สำนักงานปลัดกระทรวงสาธารณสุข", "สป.สธ."),
        ("กรมการแพทย์", "พ."),
        ("กรมควบคุมโรค", "คร."),
        ("กรมการแพทย์แผนไทยและการแพทย์ทางเลือก", "พท."),
        ("กรมวิทยาศาสตร์การแพทย์", "วพ."),
        ("กรมสนับสนุนบริการสุขภาพ", "สบส."),
        ("กรมสุขภาพจิต", "สจ."),
        ("กรมอนามัย", "อน."),
        ("สำนักงานคณะกรรมการอาหารและยา", "อย."),
    ],
    # 20 - กระทรวงอุตสาหกรรม
    20: [
        ("สำนักงานปลัดกระทรวงอุตสาหกรรม", "สป.อก."),
        ("กรมโรงงานอุตสาหกรรม", "กรอ."),
        ("กรมส่งเสริมอุตสาหกรรม", "กสอ."),
        ("กรมอุตสาหกรรมพื้นฐานและการเหมืองแร่", "กพร."),
        ("สำนักงานคณะกรรมการอ้อยและน้ำตาลทราย", "สอน."),
        ("สำนักงานมาตรฐานผลิตภัณฑ์อุตสาหกรรม", "สมอ."),
    ],
}


# ----------------------------------------------------------------------------
# State Enterprises
# ----------------------------------------------------------------------------
STATE_ENTERPRISES = [
    ("การไฟฟ้านครหลวง", "กฟน.", "Metropolitan Electricity Authority", "MEA"),
    ("การไฟฟ้าส่วนภูมิภาค", "กฟภ.", "Provincial Electricity Authority", "PEA"),
    ("การไฟฟ้าฝ่ายผลิตแห่งประเทศไทย", "กฟผ.", "Electricity Generating Authority of Thailand", "EGAT"),
    ("การประปานครหลวง", "กปน.", "Metropolitan Waterworks Authority", "MWA"),
    ("การประปาส่วนภูมิภาค", "กปภ.", "Provincial Waterworks Authority", "PWA"),
    ("บริษัท ไปรษณีย์ไทย จำกัด", "ปณท.", "Thailand Post", None),
    ("บริษัท โทรคมนาคมแห่งชาติ จำกัด (มหาชน)", "NT", "National Telecom", "NT"),
    ("การรถไฟแห่งประเทศไทย", "รฟท.", "State Railway of Thailand", "SRT"),
    ("การรถไฟฟ้าขนส่งมวลชนแห่งประเทศไทย", "รฟม.", "Mass Rapid Transit Authority of Thailand", "MRTA"),
    ("การท่าเรือแห่งประเทศไทย", "กทท.", "Port Authority of Thailand", "PAT"),
    ("การทางพิเศษแห่งประเทศไทย", "กทพ.", "Expressway Authority of Thailand", "EXAT"),
    ("บริษัท ขนส่ง จำกัด", "บขส.", "The Transport Co., Ltd.", None),
    ("บริษัท ท่าอากาศยานไทย จำกัด (มหาชน)", "ทอท.", "Airports of Thailand", "AOT"),
    ("บริษัท วิทยุการบินแห่งประเทศไทย จำกัด", "บวท.", "Aeronautical Radio of Thailand", "AEROTHAI"),
    ("บริษัท การบินไทย จำกัด (มหาชน)", "TG", "Thai Airways International", "THAI"),
    ("ธนาคารกรุงไทย จำกัด (มหาชน)", "KTB", "Krungthai Bank", "KTB"),
    ("ธนาคารออมสิน", None, "Government Savings Bank", "GSB"),
    ("ธนาคารอาคารสงเคราะห์", "ธอส.", "Government Housing Bank", "GHB"),
    ("ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร", "ธ.ก.ส.", "Bank for Agriculture and Agricultural Cooperatives", "BAAC"),
    ("ธนาคารพัฒนาวิสาหกิจขนาดกลางและขนาดย่อมแห่งประเทศไทย", "SME Bank", "SME Development Bank of Thailand", "SME Bank"),
    ("ธนาคารเพื่อการส่งออกและนำเข้าแห่งประเทศไทย", "EXIM", "Export-Import Bank of Thailand", "EXIM"),
    ("ธนาคารอิสลามแห่งประเทศไทย", "iBank", "Islamic Bank of Thailand", "iBank"),
    ("การยาสูบแห่งประเทศไทย", "ยสท.", "Tobacco Authority of Thailand", "TOAT"),
    ("การกีฬาแห่งประเทศไทย", "กกท.", "Sports Authority of Thailand", "SAT"),
    ("การท่องเที่ยวแห่งประเทศไทย", "ททท.", "Tourism Authority of Thailand", "TAT"),
    ("องค์การเภสัชกรรม", "อภ.", "Government Pharmaceutical Organization", "GPO"),
    ("องค์การคลังสินค้า", "อคส.", "Public Warehouse Organization", "PWO"),
    ("สำนักงานสลากกินแบ่งรัฐบาล", None, "Government Lottery Office", "GLO"),
    ("การนิคมอุตสาหกรรมแห่งประเทศไทย", "กนอ.", "Industrial Estate Authority of Thailand", "IEAT"),
    ("องค์การสวนสัตว์แห่งประเทศไทย", "อสส.", "Zoological Park Organization", "ZPO"),
]


# ----------------------------------------------------------------------------
# Universities (state)
# ----------------------------------------------------------------------------
UNIVERSITIES = [
    ("จุฬาลงกรณ์มหาวิทยาลัย", "จุฬาฯ", "Chulalongkorn University", "CU"),
    ("มหาวิทยาลัยธรรมศาสตร์", "มธ.", "Thammasat University", "TU"),
    ("มหาวิทยาลัยเกษตรศาสตร์", "มก.", "Kasetsart University", "KU"),
    ("มหาวิทยาลัยมหิดล", "มม.", "Mahidol University", "MU"),
    ("มหาวิทยาลัยศิลปากร", "มศก.", "Silpakorn University", "SU"),
    ("มหาวิทยาลัยศรีนครินทรวิโรฒ", "มศว", "Srinakharinwirot University", "SWU"),
    ("มหาวิทยาลัยรามคำแหง", "ม.ราม", "Ramkhamhaeng University", "RU"),
    ("มหาวิทยาลัยสุโขทัยธรรมาธิราช", "มสธ.", "Sukhothai Thammathirat Open University", "STOU"),
    ("มหาวิทยาลัยเชียงใหม่", "มช.", "Chiang Mai University", "CMU"),
    ("มหาวิทยาลัยขอนแก่น", "มข.", "Khon Kaen University", "KKU"),
    ("มหาวิทยาลัยสงขลานครินทร์", "มอ.", "Prince of Songkla University", "PSU"),
    ("มหาวิทยาลัยบูรพา", "ม.บูรพา", "Burapha University", "BUU"),
    ("มหาวิทยาลัยนเรศวร", "มน.", "Naresuan University", "NU"),
    ("มหาวิทยาลัยมหาสารคาม", "มมส", "Mahasarakham University", "MSU"),
    ("มหาวิทยาลัยทักษิณ", "ม.ทักษิณ", "Thaksin University", "TSU"),
    ("มหาวิทยาลัยอุบลราชธานี", "มอบ.", "Ubon Ratchathani University", "UBU"),
    ("มหาวิทยาลัยแม่โจ้", "ม.แม่โจ้", "Maejo University", "MJU"),
    ("มหาวิทยาลัยแม่ฟ้าหลวง", "มฟล.", "Mae Fah Luang University", "MFU"),
    ("มหาวิทยาลัยพะเยา", "ม.พะเยา", "University of Phayao", "UP"),
    ("มหาวิทยาลัยวลัยลักษณ์", "ม.วลัยลักษณ์", "Walailak University", "WU"),
    ("มหาวิทยาลัยนราธิวาสราชนครินทร์", "ม.นราธิวาส", "Princess of Naradhiwas University", "PNU"),
    ("มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี", "มจธ.", "King Mongkut's University of Technology Thonburi", "KMUTT"),
    ("สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง", "สจล.", "King Mongkut's Institute of Technology Ladkrabang", "KMITL"),
    ("มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ", "มจพ.", "King Mongkut's University of Technology North Bangkok", "KMUTNB"),
    ("มหาวิทยาลัยเทคโนโลยีสุรนารี", "มทส.", "Suranaree University of Technology", "SUT"),
    ("มหาวิทยาลัยเทคโนโลยีราชมงคลธัญบุรี", "มทร.ธัญบุรี", "Rajamangala University of Technology Thanyaburi", "RMUTT"),
    ("มหาวิทยาลัยเทคโนโลยีราชมงคลกรุงเทพ", "มทร.กรุงเทพ", "Rajamangala University of Technology Krungthep", "RMUTK"),
    ("มหาวิทยาลัยเทคโนโลยีราชมงคลรัตนโกสินทร์", "มทร.รัตนโกสินทร์", "Rajamangala University of Technology Rattanakosin", "RMUTR"),
    ("มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา", "มทร.ล้านนา", "Rajamangala University of Technology Lanna", "RMUTL"),
    ("มหาวิทยาลัยเทคโนโลยีราชมงคลอีสาน", "มทร.อีสาน", "Rajamangala University of Technology Isan", "RMUTI"),
    ("มหาวิทยาลัยเทคโนโลยีราชมงคลตะวันออก", "มทร.ตะวันออก", "Rajamangala University of Technology Tawan-ok", "RMUTTO"),
    ("มหาวิทยาลัยเทคโนโลยีราชมงคลศรีวิชัย", "มทร.ศรีวิชัย", "Rajamangala University of Technology Srivijaya", "RMUTSV"),
    ("มหาวิทยาลัยเทคโนโลยีราชมงคลสุวรรณภูมิ", "มทร.สุวรรณภูมิ", "Rajamangala University of Technology Suvarnabhumi", "RMUTSB"),
    ("มหาวิทยาลัยราชภัฏสวนสุนันทา", "มร.สส.", "Suan Sunandha Rajabhat University", "SSRU"),
    ("มหาวิทยาลัยราชภัฏธนบุรี", "มรภ.ธนบุรี", "Dhonburi Rajabhat University", "DRU"),
    ("มหาวิทยาลัยราชภัฏจันทรเกษม", "มจษ.", "Chandrakasem Rajabhat University", "CRU"),
    ("มหาวิทยาลัยราชภัฏบ้านสมเด็จเจ้าพระยา", "มบส.", "Bansomdejchaopraya Rajabhat University", "BSRU"),
    ("มหาวิทยาลัยราชภัฏพระนคร", "มรภ.พระนคร", "Phranakhon Rajabhat University", "PNRU"),
    ("มหาวิทยาลัยราชภัฏพระนครศรีอยุธยา", "มรภ.อยุธยา", "Phranakhon Si Ayutthaya Rajabhat University", "ARU"),
    ("มหาวิทยาลัยราชภัฏเชียงราย", "มร.ชร.", "Chiang Rai Rajabhat University", "CRRU"),
]


# ----------------------------------------------------------------------------
# Local Administrations
# ----------------------------------------------------------------------------
SPECIAL_LOCAL = [
    ("กรุงเทพมหานคร", "กทม.", "Bangkok Metropolitan Administration", "BMA"),
    ("เมืองพัทยา", None, "Pattaya City", None),
]

# Major provincial administrations (อบจ.) - 30 sample provinces
PROVINCIAL_ADMINS = [
    "เชียงใหม่", "เชียงราย", "ลำปาง", "ลำพูน", "พะเยา",
    "น่าน", "แพร่", "สุโขทัย", "พิษณุโลก", "เพชรบูรณ์",
    "นครราชสีมา", "ขอนแก่น", "อุดรธานี", "อุบลราชธานี", "บุรีรัมย์",
    "สุรินทร์", "ศรีสะเกษ", "ร้อยเอ็ด", "กาฬสินธุ์", "มหาสารคาม",
    "ชลบุรี", "ระยอง", "จันทบุรี", "ตราด", "ฉะเชิงเทรา",
    "นนทบุรี", "ปทุมธานี", "สมุทรปราการ", "สมุทรสาคร", "นครปฐม",
    "ราชบุรี", "เพชรบุรี", "ประจวบคีรีขันธ์", "สุพรรณบุรี", "กาญจนบุรี",
    "นครศรีธรรมราช", "สุราษฎร์ธานี", "ภูเก็ต", "กระบี่", "พังงา",
    "สงขลา", "ตรัง", "พัทลุง", "สตูล", "ปัตตานี", "ยะลา", "นราธิวาส",
]

# Municipal cities (เทศบาลนคร) - sample of 30
MUNICIPAL_CITIES = [
    "เทศบาลนครเชียงใหม่", "เทศบาลนครเชียงราย", "เทศบาลนครลำปาง",
    "เทศบาลนครพิษณุโลก", "เทศบาลนครนครสวรรค์", "เทศบาลนครอุดรธานี",
    "เทศบาลนครขอนแก่น", "เทศบาลนครนครราชสีมา", "เทศบาลนครอุบลราชธานี",
    "เทศบาลนครสกลนคร", "เทศบาลนครยะลา", "เทศบาลนครหาดใหญ่",
    "เทศบาลนครสงขลา", "เทศบาลนครภูเก็ต", "เทศบาลนครตรัง",
    "เทศบาลนครสุราษฎร์ธานี", "เทศบาลนครนครศรีธรรมราช", "เทศบาลนครระยอง",
    "เทศบาลนครเจ้าพระยาสุรศักดิ์", "เทศบาลนครแหลมฉบัง", "เทศบาลนครรังสิต",
    "เทศบาลนครนนทบุรี", "เทศบาลนครปากเกร็ด", "เทศบาลนครสมุทรปราการ",
    "เทศบาลนครสมุทรสาคร", "เทศบาลนครนครปฐม", "เทศบาลนครเจ้าพระยา",
    "เทศบาลนครแม่สอด", "เทศบาลนครพระนครศรีอยุธยา", "เทศบาลนครอ้อมน้อย",
]

# Municipal towns (เทศบาลเมือง) - sample of 25
MUNICIPAL_TOWNS = [
    "เทศบาลเมืองกาญจนบุรี", "เทศบาลเมืองเพชรบุรี", "เทศบาลเมืองราชบุรี",
    "เทศบาลเมืองหัวหิน", "เทศบาลเมืองชะอำ", "เทศบาลเมืองประจวบคีรีขันธ์",
    "เทศบาลเมืองเลย", "เทศบาลเมืองหนองคาย", "เทศบาลเมืองนครพนม",
    "เทศบาลเมืองมุกดาหาร", "เทศบาลเมืองยโสธร", "เทศบาลเมืองอำนาจเจริญ",
    "เทศบาลเมืองชัยภูมิ", "เทศบาลเมืองหนองบัวลำภู", "เทศบาลเมืองบึงกาฬ",
    "เทศบาลเมืองน่าน", "เทศบาลเมืองแพร่", "เทศบาลเมืองสุโขทัย",
    "เทศบาลเมืองตาก", "เทศบาลเมืองกำแพงเพชร", "เทศบาลเมืองพิจิตร",
    "เทศบาลเมืองอุทัยธานี", "เทศบาลเมืองสิงห์บุรี", "เทศบาลเมืองอ่างทอง",
    "เทศบาลเมืองลพบุรี",
]


# ----------------------------------------------------------------------------
# Independent and special agencies (other category)
# ----------------------------------------------------------------------------
INDEPENDENT = [
    ("สำนักงานคณะกรรมการป้องกันและปราบปรามการทุจริตแห่งชาติ", "ป.ป.ช."),
    ("สำนักงานคณะกรรมการการเลือกตั้ง", "กกต."),
    ("สำนักงานผู้ตรวจการแผ่นดิน", "ผตช."),
    ("สำนักงานคณะกรรมการสิทธิมนุษยชนแห่งชาติ", "กสม."),
    ("สำนักงานคณะกรรมการตรวจเงินแผ่นดิน", "สตง."),
    ("ศาลฎีกา", None),
    ("ศาลปกครองสูงสุด", None),
    ("ศาลรัฐธรรมนูญ", None),
    ("สำนักงานอัยการสูงสุด", "อสส."),
    ("สำนักงานเลขาธิการสภาผู้แทนราษฎร", None),
    ("สำนักงานเลขาธิการวุฒิสภา", None),
    ("สำนักงานตำรวจแห่งชาติ", "สตช."),
    ("สำนักงานคณะกรรมการกำกับและส่งเสริมการประกอบธุรกิจประกันภัย", "คปภ."),
    ("สำนักงานคณะกรรมการกำกับหลักทรัพย์และตลาดหลักทรัพย์", "ก.ล.ต."),
    ("สำนักงานคณะกรรมการกิจการกระจายเสียง กิจการโทรทัศน์ และกิจการโทรคมนาคมแห่งชาติ", "กสทช."),
    ("ธนาคารแห่งประเทศไทย", "ธปท."),
    ("สำนักงานคณะกรรมการคุ้มครองผู้บริโภค", "สคบ."),
    ("สำนักงานหลักประกันสุขภาพแห่งชาติ", "สปสช."),
    ("สถาบันมาตรวิทยาแห่งชาติ", "มว."),
    ("สำนักงานรับรองมาตรฐานและประเมินคุณภาพการศึกษา", "สมศ."),
]


# ----------------------------------------------------------------------------
# SQL generation
# ----------------------------------------------------------------------------
def quote(s: Optional[str]) -> str:
    if s is None:
        return "NULL"
    return "'" + s.replace("'", "''") + "'"


def render_agency_insert(
    aid: str,
    name_th: str,
    short_name: Optional[str],
    name_en: Optional[str],
    agency_type: str,
    parent_id: Optional[str],
    province: Optional[str] = None,
) -> str:
    parent = quote(parent_id) if parent_id else "NULL"
    return (
        f"  ({quote(aid)}, {quote(name_th)}, {quote(short_name)}, "
        f"{quote(name_en)}, {quote(agency_type)}::agency_type, "
        f"{parent}, {quote(province)}, 'data.go.th')"
    )


def render_alias_insert(agency_id: str, alias: str, source: str = "abbreviation") -> str:
    return f"  ({quote(agency_id)}, {quote(alias)}, {quote(source)}::alias_source)"


def main() -> None:
    out: list[str] = []
    out.append("-- =============================================================================")
    out.append("-- V010__seed_agencies.sql")
    out.append("-- =============================================================================")
    out.append("-- Government agency seed data based on data.go.th sample")
    out.append("-- Generated by database/seed/generate_agencies_seed.py")
    out.append("-- DO NOT edit by hand — re-run the generator to update.")
    out.append("-- =============================================================================")
    out.append("")

    agency_rows: list[str] = []
    alias_rows: list[str] = []

    # Ministries
    ministry_ids: dict[int, str] = {}
    for i, (name, short, name_en, aliases) in enumerate(MINISTRIES, start=1):
        aid = mid(1, i)
        ministry_ids[i] = aid
        agency_rows.append(
            render_agency_insert(aid, name, short, name_en, "ministry", None)
        )
        if short:
            alias_rows.append(render_alias_insert(aid, short, "abbreviation"))
        for alias in aliases:
            alias_rows.append(render_alias_insert(aid, alias, "common"))

    # Departments
    dept_seq = 0
    for ministry_idx, depts in DEPARTMENTS.items():
        parent_id = ministry_ids[ministry_idx]
        for dept_data in depts:
            dept_seq += 1
            name, short = dept_data[0], dept_data[1]
            aid = mid(2, dept_seq)
            agency_rows.append(
                render_agency_insert(aid, name, short, None, "department", parent_id)
            )
            if short:
                alias_rows.append(render_alias_insert(aid, short, "abbreviation"))

    # State enterprises
    for i, (name, short, name_en, abbr) in enumerate(STATE_ENTERPRISES, start=1):
        aid = mid(3, i)
        agency_rows.append(
            render_agency_insert(aid, name, short, name_en, "state_enterprise", None)
        )
        if short:
            alias_rows.append(render_alias_insert(aid, short, "abbreviation"))
        if abbr and abbr != short:
            alias_rows.append(render_alias_insert(aid, abbr, "common"))

    # Universities
    for i, (name, short, name_en, abbr) in enumerate(UNIVERSITIES, start=1):
        aid = mid(4, i)
        agency_rows.append(
            render_agency_insert(aid, name, short, name_en, "university", None)
        )
        if short:
            alias_rows.append(render_alias_insert(aid, short, "abbreviation"))
        if abbr and abbr != short:
            alias_rows.append(render_alias_insert(aid, abbr, "common"))

    # Local administrations
    seq = 0
    # Special (กทม., พัทยา)
    for name, short, name_en, abbr in SPECIAL_LOCAL:
        seq += 1
        aid = mid(5, seq)
        agency_rows.append(
            render_agency_insert(aid, name, short, name_en, "local_admin", None)
        )
        if short:
            alias_rows.append(render_alias_insert(aid, short, "abbreviation"))
        if abbr and abbr != short:
            alias_rows.append(render_alias_insert(aid, abbr, "common"))

    # Provincial admins
    for province in PROVINCIAL_ADMINS:
        seq += 1
        aid = mid(5, seq)
        name = f"องค์การบริหารส่วนจังหวัด{province}"
        short = f"อบจ.{province}"
        agency_rows.append(
            render_agency_insert(aid, name, short, None, "local_admin", None, province)
        )
        alias_rows.append(render_alias_insert(aid, short, "abbreviation"))

    # Municipal cities
    for name in MUNICIPAL_CITIES:
        seq += 1
        aid = mid(5, seq)
        agency_rows.append(
            render_agency_insert(aid, name, None, None, "local_admin", None)
        )

    # Municipal towns
    for name in MUNICIPAL_TOWNS:
        seq += 1
        aid = mid(5, seq)
        agency_rows.append(
            render_agency_insert(aid, name, None, None, "local_admin", None)
        )

    # Independent agencies
    for i, (name, short) in enumerate(INDEPENDENT, start=1):
        aid = mid(6, i)
        agency_rows.append(
            render_agency_insert(aid, name, short, None, "other", None)
        )
        if short:
            alias_rows.append(render_alias_insert(aid, short, "abbreviation"))

    # Write the SQL
    out.append("-- ---------------------------------------------------------------------------")
    out.append(f"-- Agencies ({len(agency_rows)} records)")
    out.append("-- ---------------------------------------------------------------------------")
    out.append(
        "INSERT INTO agencies (id, official_name_th, short_name, official_name_en, "
        "agency_type, parent_agency_id, province, source) VALUES"
    )
    out.append(",\n".join(agency_rows) + ";")
    out.append("")

    out.append("-- ---------------------------------------------------------------------------")
    out.append(f"-- Aliases ({len(alias_rows)} records)")
    out.append("-- ---------------------------------------------------------------------------")
    out.append("INSERT INTO agency_aliases (agency_id, alias, source) VALUES")
    out.append(",\n".join(alias_rows) + ";")
    out.append("")

    out.append(f"-- Seed summary: {len(agency_rows)} agencies, {len(alias_rows)} aliases")

    print("\n".join(out))


if __name__ == "__main__":
    main()

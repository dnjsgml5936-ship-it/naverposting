// ============================================================
// 도메인 (Domain)
// ============================================================
export type PostDomain = 'insurance' | 'policy_fund' | 'iso_certification' | 'corporate_consulting' | 'smart_factory' | 'disabled_workplace' | 'bizinfo' | 'real_estate';

export const DOMAIN_LABELS: Record<PostDomain, string> = {
  insurance: '보험',
  policy_fund: '정책자금',
  iso_certification: 'ISO인증',
  corporate_consulting: '법인컨설팅',
  smart_factory: '스마트공장',
  disabled_workplace: '장애인표준사업장',
  bizinfo: '기업마당',
  real_estate: '부동산',
};

// ============================================================
// 보험 카테고리
// ============================================================
export type InsuranceCategory =
  | 'whole_life'
  | 'pension'
  | 'variable_annuity'
  | 'health_special'
  | 'general';

export const INSURANCE_CATEGORY_LABELS: Record<InsuranceCategory, string> = {
  whole_life: '종신보험',
  pension: '연금보험',
  variable_annuity: '변액연금',
  health_special: '특판건강보험',
  general: '일반',
};

// 하위호환
export const CATEGORY_LABELS = INSURANCE_CATEGORY_LABELS;

// ============================================================
// 정책자금 카테고리 (기관 → 자금종류)
// ============================================================
export type PolicyFundOrg =
  | 'kibo'
  | 'kodit'
  | 'kosmes'
  | 'semas'
  | 'credit_foundation';

export const POLICY_FUND_ORG_LABELS: Record<PolicyFundOrg, string> = {
  kibo: '기술보증기금',
  kodit: '신용보증기금',
  kosmes: '중진공 (중소벤처기업진흥공단)',
  semas: '소진공 (소상공인시장진흥공단)',
  credit_foundation: '지역신용보증재단',
};

export interface PolicyFundType {
  key: string;
  label: string;
}

export const POLICY_FUND_TYPES: Record<PolicyFundOrg, PolicyFundType[]> = {
  kibo: [
    { key: 'kibo_new_tech', label: '신기술사업금융보증' },
    { key: 'kibo_venture', label: '벤처기업보증' },
    { key: 'kibo_innobiz', label: '이노비즈보증' },
    { key: 'kibo_startup', label: '창업기업보증' },
    { key: 'kibo_green', label: '녹색산업보증' },
    { key: 'kibo_culture', label: '문화산업완성보증' },
    { key: 'kibo_ip', label: 'IP(지식재산)담보보증' },
    { key: 'kibo_general', label: '일반기술보증' },
  ],
  kodit: [
    { key: 'kodit_general', label: '일반신용보증' },
    { key: 'kodit_special', label: '특례보증' },
    { key: 'kodit_startup', label: '창업기업보증' },
    { key: 'kodit_export', label: '수출기업보증' },
    { key: 'kodit_green', label: '녹색보증' },
    { key: 'kodit_social', label: '사회적경제기업보증' },
    { key: 'kodit_emergency', label: '긴급경영안정보증' },
    { key: 'kodit_corporate', label: '회사채보증' },
  ],
  kosmes: [
    { key: 'kosmes_policy', label: '정책자금 직접대출' },
    { key: 'kosmes_startup', label: '창업자금' },
    { key: 'kosmes_innovation', label: '혁신성장자금' },
    { key: 'kosmes_emergency', label: '긴급경영안정자금' },
    { key: 'kosmes_export', label: '수출지원자금' },
    { key: 'kosmes_local', label: '지역경제활성화자금' },
    { key: 'kosmes_invest', label: '투융자복합금융' },
    { key: 'kosmes_micro', label: '소규모기업자금' },
  ],
  semas: [
    { key: 'semas_general', label: '일반경영안정자금' },
    { key: 'semas_special', label: '특별경영안정자금' },
    { key: 'semas_startup', label: '소상공인창업자금' },
    { key: 'semas_growth', label: '성장기반자금' },
    { key: 'semas_clean', label: '클린사업장조성자금' },
    { key: 'semas_online', label: '스마트소상공인자금' },
    { key: 'semas_disaster', label: '재해피해자금' },
  ],
  credit_foundation: [
    { key: 'cf_general', label: '일반보증' },
    { key: 'cf_startup', label: '창업보증' },
    { key: 'cf_policy', label: '정책연계보증' },
    { key: 'cf_special', label: '특별보증' },
    { key: 'cf_micro', label: '소기업소상공인보증' },
    { key: 'cf_youth', label: '청년창업보증' },
  ],
};

// ============================================================
// 기업마당 API (지원사업/금융)
// ============================================================
export interface GovSupportProgram {
  pblancId: string;
  pblancNm: string;
  jrsdInsttNm: string;
  reqstBeginEndDe: string;
  pblancUrl: string;
  bizPrchPttnNm: string;
  targetNm?: string;
  bsnsSumryCn?: string;
}

// ============================================================
// ISO인증 카테고리
// ============================================================
export interface IsoCertType {
  key: string;
  label: string;
  fullName: string;
  description: string;
}

export const ISO_CERT_TYPES: IsoCertType[] = [
  { key: 'iso_9001', label: 'ISO 9001', fullName: '품질경영시스템', description: '제품/서비스 품질관리 및 고객만족 향상' },
  { key: 'iso_14001', label: 'ISO 14001', fullName: '환경경영시스템', description: '환경영향 관리 및 지속가능한 경영' },
  { key: 'iso_45001', label: 'ISO 45001', fullName: '안전보건경영시스템', description: '산업재해 예방 및 근로자 안전보건 관리' },
  { key: 'iso_27001', label: 'ISO 27001', fullName: '정보보안경영시스템', description: '정보보안 관리체계 구축 및 인증' },
  { key: 'iso_22000', label: 'ISO 22000', fullName: '식품안전경영시스템', description: '식품 안전 관리 및 위해요소 제어' },
  { key: 'iso_13485', label: 'ISO 13485', fullName: '의료기기품질경영시스템', description: '의료기기 설계/제조 품질관리' },
  { key: 'iso_50001', label: 'ISO 50001', fullName: '에너지경영시스템', description: '에너지 효율 관리 및 비용 절감' },
  { key: 'iso_37001', label: 'ISO 37001', fullName: '부패방지경영시스템', description: '반부패 정책 수립 및 이행' },
  { key: 'iso_22301', label: 'ISO 22301', fullName: '비즈니스연속성경영시스템', description: '재난/위기 대응 및 업무 연속성 보장' },
  { key: 'iso_27701', label: 'ISO 27701', fullName: '개인정보보호경영시스템', description: '개인정보 보호 관리체계 (PIMS)' },
  { key: 'iatf_16949', label: 'IATF 16949', fullName: '자동차품질경영시스템', description: '자동차 산업 품질관리 국제표준' },
  { key: 'iso_integrated', label: '통합인증', fullName: '통합경영시스템 (IMS)', description: '품질+환경+안전보건 통합 인증' },
];

// ============================================================
// 법인컨설팅 주제
// ============================================================
export interface CorpConsultingTopic {
  key: string;
  label: string;
  description: string;
}

export interface CorpConsultingCategory {
  label: string;
  topics: CorpConsultingTopic[];
}

export const CORP_CONSULTING_CATEGORIES: CorpConsultingCategory[] = [
  {
    label: '법인 설립/전환',
    topics: [
      { key: 'corp_establish', label: '법인 설립 절차', description: '주식회사/유한회사 설립 A to Z' },
      { key: 'corp_convert', label: '개인사업자 → 법인전환', description: '법인전환 시기, 절차, 절세 효과' },
      { key: 'corp_type', label: '법인 형태 선택', description: '주식회사 vs 유한회사 vs 유한책임회사' },
      { key: 'corp_capital', label: '자본금 설계', description: '적정 자본금 산정 및 증자 전략' },
    ],
  },
  {
    label: '세무/절세 전략',
    topics: [
      { key: 'corp_tax_saving', label: '법인세 절세 전략', description: '합법적 절세 방법 총정리' },
      { key: 'corp_expense', label: '법인 경비처리', description: '비용 인정 항목 및 증빙 관리' },
      { key: 'corp_salary', label: '대표이사 급여 설계', description: '급여/상여/배당 최적 배분' },
      { key: 'corp_dividend', label: '배당 전략', description: '배당소득세 절감 및 이익잉여금 관리' },
      { key: 'corp_tax_credit', label: '세액공제/감면', description: 'R&D, 고용증대, 투자 세액공제 활용' },
      { key: 'corp_vat', label: '부가가치세 관리', description: '매입세액 공제 극대화 전략' },
    ],
  },
  {
    label: '자금/재무 관리',
    topics: [
      { key: 'corp_funding', label: '법인 자금조달', description: '대출/투자/정책자금 활용 전략' },
      { key: 'corp_account', label: '법인 통장/카드 관리', description: '법인 자금 흐름 관리 실무' },
      { key: 'corp_valuation', label: '기업가치 평가', description: '비상장법인 가치평가 방법' },
      { key: 'corp_financial', label: '재무제표 관리', description: '재무제표 읽기 및 건전성 관리' },
    ],
  },
  {
    label: '가지급금/가수금',
    topics: [
      { key: 'corp_temp_payment', label: '가지급금 정리', description: '가지급금 발생 원인 및 해소 방법' },
      { key: 'corp_temp_receipt', label: '가수금 처리', description: '가수금 정리 및 세무 이슈' },
      { key: 'corp_ceo_loan', label: '대표이사 대여금', description: '인정이자, 상여처분 리스크 관리' },
    ],
  },
  {
    label: '지분/주주 관리',
    topics: [
      { key: 'corp_equity', label: '지분 구조 설계', description: '최적 지분율 및 주주 구성' },
      { key: 'corp_equity_transfer', label: '지분 양도/양수', description: '주식 거래 절차 및 세금' },
      { key: 'corp_stock_option', label: '스톡옵션 설계', description: '핵심인재 유치를 위한 주식매수선택권' },
      { key: 'corp_family_equity', label: '가족 지분 관리', description: '가족법인, 명의신탁 리스크' },
    ],
  },
  {
    label: '승계/상속/증여',
    topics: [
      { key: 'corp_succession', label: '가업승계', description: '가업승계 세제 혜택 및 절차' },
      { key: 'corp_inheritance', label: '법인 상속 전략', description: '비상장주식 상속세 절감' },
      { key: 'corp_gift', label: '법인 활용 증여', description: '자녀 증여 시 법인 활용 전략' },
    ],
  },
  {
    label: '부동산/자산 관리',
    topics: [
      { key: 'corp_realestate', label: '법인 부동산 매입', description: '법인 명의 부동산 취득 장단점' },
      { key: 'corp_lease', label: '법인 임대사업', description: '법인 임대소득 과세 및 관리' },
      { key: 'corp_car', label: '법인 차량 관리', description: '업무용 승용차 비용 처리 기준' },
      { key: 'corp_asset', label: '법인 자산 관리', description: '감가상각, 자산 매각, 폐기 처리' },
    ],
  },
  {
    label: '법인 운영/컴플라이언스',
    topics: [
      { key: 'corp_board', label: '이사회/주주총회 운영', description: '의사록 작성 및 법적 요건' },
      { key: 'corp_register', label: '법인등기 관리', description: '변경등기 사유 및 과태료 방지' },
      { key: 'corp_compliance', label: '컴플라이언스', description: '내부통제 및 법규 준수 체계' },
      { key: 'corp_labor', label: '인사/노무 관리', description: '근로계약, 4대보험, 퇴직금 관리' },
    ],
  },
  {
    label: '법인 청산/구조조정',
    topics: [
      { key: 'corp_liquidation', label: '법인 청산/해산', description: '법인 청산 절차 및 잔여재산 분배' },
      { key: 'corp_ma', label: 'M&A 전략', description: '인수합병 절차 및 실사(DD)' },
      { key: 'corp_split', label: '회사 분할/합병', description: '인적분할, 물적분할, 합병 전략' },
    ],
  },
];

// ============================================================
// 스마트공장 카테고리
// ============================================================
export interface SmartFactoryCategory {
  label: string;
  topics: SmartFactoryTopic[];
}

export interface SmartFactoryTopic {
  key: string;
  label: string;
  description: string;
}

export const SMART_FACTORY_CATEGORIES: SmartFactoryCategory[] = [
  {
    label: '스마트공장 구축',
    topics: [
      { key: 'sf_gov_type', label: '정부형 스마트공장', description: 'ICT 융합 기획·설계·제조·판매, 솔루션+자동화설비 (최대 2억원, 50%)' },
      { key: 'sf_ministry_collab', label: '부처협업형 스마트공장', description: '11개 부처 연계 특화산업 스마트공장 구축 (최대 2.5억원)' },
      { key: 'sf_win_win', label: '대중소 상생형 스마트공장', description: '대기업-중소기업 협력 스마트공장 구축 (정부 30% 지원)' },
      { key: 'sf_ai_track', label: '대중소 상생형 AI트랙', description: 'AI 기반 스마트공장 민관협력 구축 (정부 50% 지원)' },
    ],
  },
  {
    label: '자동화 지원',
    topics: [
      { key: 'sf_automation', label: '자동화 공정 구축', description: '수작업 공정의 자동화 설비 도입 (최대 9,500만원, 50%)' },
      { key: 'sf_robot', label: '제조로봇 도입', description: '로봇 배치·공정설계·안전 컨설팅 포함 (최대 2.5억원, 50%)' },
    ],
  },
  {
    label: '스마트공장 수준/인증',
    topics: [
      { key: 'sf_level_check', label: '스마트공장 수준확인', description: '기초→중간1→중간2→고도화 수준 평가 및 인증' },
      { key: 'sf_cloud', label: '클라우드 제조솔루션', description: '중소기업용 클라우드 기반 종합 제조솔루션' },
      { key: 'sf_supplier_diag', label: '공급기업 역량진단', description: '스마트공장 솔루션 공급기업 역량 평가' },
    ],
  },
  {
    label: '부처협업 특화분야',
    topics: [
      { key: 'sf_food_safety', label: '식품/축산안전/GMP', description: '식약처 연계 HACCP, 스마트HACCP 도입' },
      { key: 'sf_industrial_complex', label: '산업단지', description: '산업통상자원부 연계 산업단지 입주기업 지원' },
      { key: 'sf_cosmetics', label: '화장품', description: '식약처 연계 화장품 GMP, K-뷰티 멘토링' },
      { key: 'sf_medical', label: '의약품/의료기기', description: '보건복지부 연계 헬스케어 산업 인력 양성' },
      { key: 'sf_industrial_safety', label: '산업안전', description: '고용노동부 연계 산업안전 교육·기술·재정 지원' },
      { key: 'sf_kfood', label: 'K-푸드', description: '농림축산식품부 연계 품질·위생 관리, 국산 농산물 활용' },
      { key: 'sf_defense', label: '방위산업', description: '방위사업청 연계 보안 컨설팅, 품질경영 지원' },
      { key: 'sf_security', label: '산업보안', description: '과기정통부 연계 정보보안 교육·훈련' },
      { key: 'sf_fishery', label: '수산식품', description: '해양수산부 연계 수출인증, 브랜딩 지원' },
      { key: 'sf_agriculture', label: '농산업', description: '한국농어촌공사 연계 농기계·농약·비료 스마트화' },
      { key: 'sf_shipbuilding', label: '조선해양기자재', description: '산업통상자원부 연계 수출지원, HSE 컨설팅' },
    ],
  },
  {
    label: '제조혁신/DX',
    topics: [
      { key: 'sf_dx_mentor', label: '제조DX 멘토단', description: '제조 디지털전환 전문 멘토 활용 지원' },
      { key: 'sf_data_product', label: '제조데이터 상품 가공', description: '제조 데이터 수집·분석·상품화 지원' },
      { key: 'sf_mes', label: 'MES 도입', description: '제조실행시스템 도입으로 생산관리 디지털화' },
      { key: 'sf_erp', label: 'ERP 도입', description: '전사적자원관리 시스템 구축' },
      { key: 'sf_iot_sensor', label: 'IoT/센서', description: 'IoT 센서 기반 실시간 모니터링 체계 구축' },
    ],
  },
];

// ============================================================
// 장애인표준사업장 카테고리
// ============================================================
export interface DisabledWorkplaceCategory {
  label: string;
  topics: DisabledWorkplaceTopic[];
}

export interface DisabledWorkplaceTopic {
  key: string;
  label: string;
  description: string;
}

export const DISABLED_WORKPLACE_CATEGORIES: DisabledWorkplaceCategory[] = [
  {
    label: '설립/인증',
    topics: [
      { key: 'dw_establish', label: '표준사업장 설립 절차', description: '장애인표준사업장 설립 요건, 인가 절차 A to Z' },
      { key: 'dw_certification', label: '표준사업장 인증 기준', description: '장애인 고용비율, 시설기준, 인증 요건 안내' },
      { key: 'dw_business_type', label: '업종 선택 가이드', description: '표준사업장에 적합한 업종 및 사업모델' },
      { key: 'dw_joint_venture', label: '공동출자 표준사업장', description: '대기업·공공기관 공동출자 설립 절차 및 사례' },
    ],
  },
  {
    label: '정부지원/혜택',
    topics: [
      { key: 'dw_subsidy', label: '설립지원금', description: '한국장애인고용공단 설립비용 지원 (시설·장비·토지)' },
      { key: 'dw_operation_support', label: '운영지원금', description: '무상지원, 유상지원, 경영안정자금 등 운영비 지원' },
      { key: 'dw_tax_benefit', label: '세제혜택', description: '법인세·소득세 감면, 부가세 면제, 재산세 감면 등' },
      { key: 'dw_employment_incentive', label: '고용장려금', description: '장애인 고용장려금, 연계고용 부담금 감면' },
      { key: 'dw_priority_purchase', label: '우선구매제도', description: '공공기관 장애인생산품 우선구매 의무(1% 이상)' },
    ],
  },
  {
    label: '고용/인사 관리',
    topics: [
      { key: 'dw_recruitment', label: '장애인 채용 가이드', description: '장애유형별 직무배치, 채용 프로세스' },
      { key: 'dw_job_coaching', label: '직무지도원 제도', description: '근로지원인·직무지도원 활용 및 신청방법' },
      { key: 'dw_workplace_env', label: '편의시설 설치', description: '장애인 근로환경 개선, 편의시설 설치 지원' },
      { key: 'dw_vocational_training', label: '직업훈련 지원', description: '장애인 맞춤형 직업훈련, 훈련비 지원' },
    ],
  },
  {
    label: '경영/운영',
    topics: [
      { key: 'dw_social_value', label: '사회적 가치 경영', description: 'ESG 경영과 장애인표준사업장의 사회적 가치' },
      { key: 'dw_linked_employment', label: '연계고용제도', description: '의무고용 미달 기업의 연계고용 부담금 감면' },
      { key: 'dw_success_case', label: '성공사례', description: '우수 장애인표준사업장 경영 사례 및 벤치마킹' },
      { key: 'dw_consulting', label: '경영컨설팅 지원', description: '한국장애인고용공단 무료 경영컨설팅 지원' },
    ],
  },
  {
    label: '관련 법규/제도',
    topics: [
      { key: 'dw_obligation', label: '장애인 의무고용제도', description: '상시근로자 50인 이상 사업장 의무고용률(3.1%)' },
      { key: 'dw_penalty', label: '고용부담금 제도', description: '미이행 시 부담금 부과 기준 및 산정방법' },
      { key: 'dw_disability_law', label: '장애인고용촉진법', description: '장애인고용촉진 및 직업재활법 주요 내용' },
      { key: 'dw_welfare_policy', label: '장애인 복지정책', description: '최신 장애인 고용·복지 정책 동향' },
    ],
  },
];

// ============================================================
// 부동산 카테고리
// ============================================================
export interface RealEstateTopic {
  key: string;
  label: string;
  description: string;
}

export interface RealEstateCategory {
  label: string;
  topics: RealEstateTopic[];
}

export const REAL_ESTATE_CATEGORIES: RealEstateCategory[] = [
  {
    label: '매물소개/분석',
    topics: [
      { key: 're_apt_listing', label: '아파트 매물 소개', description: '아파트 매매/전세/월세 매물 상세 분석 및 소개' },
      { key: 're_villa_listing', label: '빌라/다세대 매물', description: '빌라, 다세대, 다가구 매물 소개 및 장단점 분석' },
      { key: 're_officetel_listing', label: '오피스텔 매물', description: '오피스텔 매매/임대 매물 소개 및 수익률 분석' },
      { key: 're_luxury_listing', label: '고급 주거 매물', description: '고급 아파트, 주상복합, 타운하우스 등 프리미엄 매물 소개' },
    ],
  },
  {
    label: '전월세 가이드',
    topics: [
      { key: 're_jeonse_guide', label: '전세 계약 가이드', description: '전세 계약 시 체크리스트, 주의사항, 안전한 전세 찾기' },
      { key: 're_monthly_guide', label: '월세 계약 가이드', description: '월세 계약 조건 비교, 보증금/월세 비율, 관리비 확인' },
      { key: 're_contract_tips', label: '계약서 특약사항', description: '전월세 계약서 필수 특약, 분쟁 예방 조항 작성법' },
      { key: 're_tenant_rights', label: '임차인 권리보호', description: '임대차보호법, 대항력, 우선변제권, 전세보증보험' },
    ],
  },
  {
    label: '매매 가이드',
    topics: [
      { key: 're_purchase_process', label: '매매 절차 총정리', description: '부동산 매매 계약부터 잔금, 등기까지 단계별 가이드' },
      { key: 're_tax_guide', label: '부동산 세금 가이드', description: '취득세, 양도소득세, 종합부동산세 등 세금 완벽 정리' },
      { key: 're_loan_guide', label: '주택담보대출 가이드', description: 'LTV, DTI, DSR 규제 및 대출 조건 비교, 금리 분석' },
      { key: 're_first_home', label: '생애최초 주택 구매', description: '생애최초 주택 구매 혜택, 취득세 감면, 대출 우대' },
    ],
  },
  {
    label: '시장/지역 분석',
    topics: [
      { key: 're_market_trend', label: '부동산 시장 동향', description: '전국/수도권 부동산 시세 트렌드, 가격 전망 분석' },
      { key: 're_area_analysis', label: '지역 분석 리포트', description: '특정 지역(구/동) 부동산 시세, 개발호재, 투자가치 분석' },
      { key: 're_policy_impact', label: '부동산 정책 분석', description: '정부 부동산 규제/완화 정책이 시장에 미치는 영향' },
      { key: 're_redevelopment', label: '재개발/재건축 분석', description: '재개발·재건축 구역 진행 단계, 투자 포인트, 리스크' },
    ],
  },
  {
    label: '빌딩/상가 투자',
    topics: [
      { key: 're_small_building', label: '꼬마빌딩 투자', description: '소규모 빌딩(꼬마빌딩) 매매, 수익률 분석, 투자 전략' },
      { key: 're_commercial', label: '상가 투자 분석', description: '상가 매매/임대 수익률, 공실 리스크, 입지 분석' },
      { key: 're_office_invest', label: '사무실/사옥 매매', description: '사옥용 빌딩 매매, 사무실 임대 시장 분석' },
      { key: 're_rental_income', label: '임대 수익형 부동산', description: '원룸, 다가구, 상가 등 임대 수익 극대화 전략' },
    ],
  },
  {
    label: '임장/현장리뷰',
    topics: [
      { key: 're_apt_review', label: '아파트 단지 임장', description: '아파트 단지 현장 방문 후기, 입주 환경, 커뮤니티 분석' },
      { key: 're_new_complex', label: '신축 분양 단지 분석', description: '신축 아파트 분양 정보, 모델하우스 방문 후기, 청약 분석' },
      { key: 're_area_tour', label: '동네 탐방/생활권 분석', description: '학군, 교통, 편의시설 등 생활 인프라 현장 리뷰' },
      { key: 're_building_review', label: '빌딩/상가 현장 답사', description: '빌딩, 상가 현장 답사 후기, 건물 상태 및 입지 분석' },
    ],
  },
];

// ============================================================
// 네이버 뉴스 검색 결과
// ============================================================
export interface NaverNewsItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

// ============================================================
// 통합 카테고리 타입
// ============================================================
export type PostCategory = InsuranceCategory | string;

// ============================================================
// 블로그 포스트
// ============================================================
export interface BlogPost {
  id: string;
  title: string;
  content: string;
  htmlContent: string;
  keyword: string;
  domain: PostDomain;
  category: PostCategory;
  tags: string[];
  status: 'draft' | 'published' | 'scheduled';
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  // 이 글을 생성할 때 입력했던 원본 요청(키워드·톤·맥락 등). 과거 글은 없을 수 있음
  generationInput?: GenerateRequest;
}

export interface GenerateRequest {
  keyword: string;
  domain: PostDomain;
  category: PostCategory;
  tone: 'warm' | 'professional' | 'story' | 'casual' | 'authoritative';
  additionalContext?: string;
  targetAge?: string;
  painPoint?: string;
  // 정책자금 전용
  fundOrg?: PolicyFundOrg;
  fundType?: string;
  // 정부지원사업 전용
  govProgram?: GovSupportProgram;
  // ISO인증 전용
  isoType?: string;
  newsArticles?: NaverNewsItem[];
  // 법인컨설팅 전용
  corpTopic?: string;
  referenceUrls?: string[];
  // 스마트공장 전용
  smartFactoryTopic?: string;
  // 장애인표준사업장 전용
  disabledWorkplaceTopic?: string;
  // 부동산 전용
  realEstateTopic?: string;
}

export interface ImageCard {
  title: string;
  subtitle: string;
  body: string;
  emoji: string;
  theme: 'blue' | 'green' | 'purple' | 'orange' | 'teal';
  imagePrompt?: string;
  overlayText?: string;
}

export interface GenerateResponse {
  title: string;
  content: string;
  htmlContent: string;
  tags: string[];
  seoScore: number;
  tips: string[];
  imageCards: ImageCard[];
}

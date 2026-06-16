import { PostDomain } from '@/types';

export interface KeywordEntry {
  keyword: string;
  domain: PostDomain;
  category: string;
}

// 도메인별 키워드 DB (실제 검색량은 SA API에서 실시간 조회)

export const KEYWORD_DATABASE: KeywordEntry[] = [
  // ============================================================
  // 보험 도메인
  // ============================================================
  // 종신보험
  { keyword: '종신보험 추천', domain: 'insurance', category: 'whole_life' },
  { keyword: '종신보험 필요성', domain: 'insurance', category: 'whole_life' },
  { keyword: '종신보험 해지환급금', domain: 'insurance', category: 'whole_life' },
  { keyword: '종신보험 vs 정기보험', domain: 'insurance', category: 'whole_life' },
  { keyword: '30대 종신보험', domain: 'insurance', category: 'whole_life' },
  { keyword: '종신보험 상속세 대비', domain: 'insurance', category: 'whole_life' },
  { keyword: '종신보험 납입면제', domain: 'insurance', category: 'whole_life' },
  { keyword: '변액종신보험 장단점', domain: 'insurance', category: 'whole_life' },
  { keyword: '종신보험 보험료 비교', domain: 'insurance', category: 'whole_life' },
  { keyword: '종신보험 리모델링', domain: 'insurance', category: 'whole_life' },
  { keyword: '부부 종신보험', domain: 'insurance', category: 'whole_life' },
  { keyword: '사업자 종신보험 활용', domain: 'insurance', category: 'whole_life' },
  { keyword: '종신보험 가입시기', domain: 'insurance', category: 'whole_life' },
  { keyword: '40대 종신보험', domain: 'insurance', category: 'whole_life' },
  { keyword: '50대 종신보험 늦은가입', domain: 'insurance', category: 'whole_life' },

  // 연금보험
  { keyword: '연금보험 추천', domain: 'insurance', category: 'pension' },
  { keyword: '연금저축 vs 연금보험 차이', domain: 'insurance', category: 'pension' },
  { keyword: '비과세 연금보험', domain: 'insurance', category: 'pension' },
  { keyword: '노후준비 연금 설계', domain: 'insurance', category: 'pension' },
  { keyword: '연금보험 수령방식', domain: 'insurance', category: 'pension' },
  { keyword: '연금보험 세액공제', domain: 'insurance', category: 'pension' },
  { keyword: '40대 연금보험 가입', domain: 'insurance', category: 'pension' },
  { keyword: '연금보험 중도인출', domain: 'insurance', category: 'pension' },
  { keyword: '종신연금 vs 확정연금', domain: 'insurance', category: 'pension' },
  { keyword: '국민연금 부족분 대비', domain: 'insurance', category: 'pension' },
  { keyword: '연금보험 추천 상품', domain: 'insurance', category: 'pension' },
  { keyword: '연금개시 시점 전략', domain: 'insurance', category: 'pension' },
  { keyword: '30대 연금보험', domain: 'insurance', category: 'pension' },
  { keyword: '연금보험 수익률 비교', domain: 'insurance', category: 'pension' },

  // 변액연금
  { keyword: '변액연금 추천', domain: 'insurance', category: 'variable_annuity' },
  { keyword: '변액연금 수익률', domain: 'insurance', category: 'variable_annuity' },
  { keyword: '변액연금 펀드 선택', domain: 'insurance', category: 'variable_annuity' },
  { keyword: '변액연금 vs ETF', domain: 'insurance', category: 'variable_annuity' },
  { keyword: '변액연금 최저보증', domain: 'insurance', category: 'variable_annuity' },
  { keyword: '변액연금 사업비', domain: 'insurance', category: 'variable_annuity' },
  { keyword: '변액연금 비과세', domain: 'insurance', category: 'variable_annuity' },
  { keyword: '변액연금 자산배분', domain: 'insurance', category: 'variable_annuity' },
  { keyword: '변액연금 10년 유지', domain: 'insurance', category: 'variable_annuity' },
  { keyword: '변액연금 리스크 관리', domain: 'insurance', category: 'variable_annuity' },
  { keyword: '변액연금 장단점', domain: 'insurance', category: 'variable_annuity' },
  { keyword: '변액보험 환급률', domain: 'insurance', category: 'variable_annuity' },

  // 특판건강보험
  { keyword: '특판건강보험 가입', domain: 'insurance', category: 'health_special' },
  { keyword: '3대질병 보험 추천', domain: 'insurance', category: 'health_special' },
  { keyword: '암보험 비교', domain: 'insurance', category: 'health_special' },
  { keyword: '비갱신형 건강보험', domain: 'insurance', category: 'health_special' },
  { keyword: '실손보험 보완 보험', domain: 'insurance', category: 'health_special' },
  { keyword: '특판보험 한정판매', domain: 'insurance', category: 'health_special' },
  { keyword: '건강보험 리모델링', domain: 'insurance', category: 'health_special' },
  { keyword: '갱신형 vs 비갱신형', domain: 'insurance', category: 'health_special' },
  { keyword: '순수보장형 건강보험', domain: 'insurance', category: 'health_special' },
  { keyword: '뇌혈관질환 보험', domain: 'insurance', category: 'health_special' },
  { keyword: '심장질환 보험', domain: 'insurance', category: 'health_special' },
  { keyword: '특판건강보험 가성비', domain: 'insurance', category: 'health_special' },

  // 보험 일반
  { keyword: '보험 가입 순서', domain: 'insurance', category: 'general' },
  { keyword: '보험료 절약 방법', domain: 'insurance', category: 'general' },
  { keyword: '보험 리모델링 시기', domain: 'insurance', category: 'general' },
  { keyword: '생애주기별 보험 설계', domain: 'insurance', category: 'general' },
  { keyword: '보험 해지 주의사항', domain: 'insurance', category: 'general' },
  { keyword: '보험 보장분석 방법', domain: 'insurance', category: 'general' },

  // ============================================================
  // 정책자금 도메인
  // ============================================================
  { keyword: '기보 보증 신청방법', domain: 'policy_fund', category: 'kibo_general' },
  { keyword: '기술보증기금 자격조건', domain: 'policy_fund', category: 'kibo_general' },
  { keyword: '기보 신기술사업금융', domain: 'policy_fund', category: 'kibo_new_tech' },
  { keyword: '벤처기업 기보 보증', domain: 'policy_fund', category: 'kibo_venture' },
  { keyword: '이노비즈 인증 기보', domain: 'policy_fund', category: 'kibo_innobiz' },
  { keyword: '기보 창업기업보증', domain: 'policy_fund', category: 'kibo_startup' },
  { keyword: '기술보증기금 보증료', domain: 'policy_fund', category: 'kibo_general' },
  { keyword: 'IP담보보증 신청', domain: 'policy_fund', category: 'kibo_ip' },
  { keyword: '기보 보증한도 늘리기', domain: 'policy_fund', category: 'kibo_general' },
  { keyword: '신보 보증 신청', domain: 'policy_fund', category: 'kodit_general' },
  { keyword: '신용보증기금 자격요건', domain: 'policy_fund', category: 'kodit_general' },
  { keyword: '신보 특례보증', domain: 'policy_fund', category: 'kodit_special' },
  { keyword: '신보 창업기업보증', domain: 'policy_fund', category: 'kodit_startup' },
  { keyword: '수출기업 신보 보증', domain: 'policy_fund', category: 'kodit_export' },
  { keyword: '신보 보증 서류', domain: 'policy_fund', category: 'kodit_general' },
  { keyword: '긴급경영안정 보증', domain: 'policy_fund', category: 'kodit_emergency' },
  { keyword: '신보 vs 기보 차이', domain: 'policy_fund', category: 'kodit_general' },
  { keyword: '중진공 정책자금 신청', domain: 'policy_fund', category: 'kosmes_policy' },
  { keyword: '중소기업 정책자금 2026', domain: 'policy_fund', category: 'kosmes_policy' },
  { keyword: '중진공 창업자금', domain: 'policy_fund', category: 'kosmes_startup' },
  { keyword: '혁신성장자금 신청', domain: 'policy_fund', category: 'kosmes_innovation' },
  { keyword: '중진공 긴급경영안정', domain: 'policy_fund', category: 'kosmes_emergency' },
  { keyword: '중진공 금리 이자', domain: 'policy_fund', category: 'kosmes_policy' },
  { keyword: '투융자복합금융', domain: 'policy_fund', category: 'kosmes_invest' },
  { keyword: '소상공인 정책자금', domain: 'policy_fund', category: 'semas_general' },
  { keyword: '소진공 대출 신청', domain: 'policy_fund', category: 'semas_general' },
  { keyword: '소상공인 창업자금', domain: 'policy_fund', category: 'semas_startup' },
  { keyword: '소진공 성장기반자금', domain: 'policy_fund', category: 'semas_growth' },
  { keyword: '소상공인 저금리 대출', domain: 'policy_fund', category: 'semas_general' },
  { keyword: '소진공 재해피해자금', domain: 'policy_fund', category: 'semas_disaster' },
  { keyword: '지역신보 보증 신청', domain: 'policy_fund', category: 'cf_general' },
  { keyword: '지역신용보증재단 자격', domain: 'policy_fund', category: 'cf_general' },
  { keyword: '지역신보 창업보증', domain: 'policy_fund', category: 'cf_startup' },
  { keyword: '청년창업 보증 지원', domain: 'policy_fund', category: 'cf_youth' },
  { keyword: '소기업 소상공인 보증', domain: 'policy_fund', category: 'cf_micro' },

  // ============================================================
  // 기업마당 도메인
  // ============================================================
  { keyword: '중소기업 정부지원사업', domain: 'bizinfo', category: 'bizinfo_general' },
  { keyword: '정부지원사업 신청방법', domain: 'bizinfo', category: 'bizinfo_general' },
  { keyword: '소상공인 지원사업 2026', domain: 'bizinfo', category: 'bizinfo_general' },
  { keyword: '창업지원사업 총정리', domain: 'bizinfo', category: 'bizinfo_general' },
  { keyword: '정부 R&D 지원사업', domain: 'bizinfo', category: 'bizinfo_general' },
  { keyword: '수출바우처 신청', domain: 'bizinfo', category: 'bizinfo_general' },
  { keyword: '기업마당 지원사업 검색', domain: 'bizinfo', category: 'bizinfo_general' },
  { keyword: '고용지원금 종류', domain: 'bizinfo', category: 'bizinfo_general' },
  { keyword: '스마트공장 지원사업', domain: 'bizinfo', category: 'bizinfo_general' },
  { keyword: '청년채용 특별장려금', domain: 'bizinfo', category: 'bizinfo_general' },
  { keyword: '일자리안정자금 신청', domain: 'bizinfo', category: 'bizinfo_general' },
  { keyword: '디지털전환 지원사업', domain: 'bizinfo', category: 'bizinfo_general' },

  // ============================================================
  // ISO인증 도메인
  // ============================================================
  { keyword: 'ISO 9001 인증 비용', domain: 'iso_certification', category: 'iso_9001' },
  { keyword: 'ISO 9001 인증 절차', domain: 'iso_certification', category: 'iso_9001' },
  { keyword: 'ISO 9001 갱신심사', domain: 'iso_certification', category: 'iso_9001' },
  { keyword: 'ISO 14001 인증 방법', domain: 'iso_certification', category: 'iso_14001' },
  { keyword: 'ISO 14001 환경경영', domain: 'iso_certification', category: 'iso_14001' },
  { keyword: 'ISO 45001 인증', domain: 'iso_certification', category: 'iso_45001' },
  { keyword: 'ISO 45001 안전보건', domain: 'iso_certification', category: 'iso_45001' },
  { keyword: '중대재해처벌법 ISO 45001', domain: 'iso_certification', category: 'iso_45001' },
  { keyword: 'ISO 27001 정보보안', domain: 'iso_certification', category: 'iso_27001' },
  { keyword: 'ISO 27001 인증 비용', domain: 'iso_certification', category: 'iso_27001' },
  { keyword: 'ISO 22000 식품안전', domain: 'iso_certification', category: 'iso_22000' },
  { keyword: 'ISO 13485 의료기기', domain: 'iso_certification', category: 'iso_13485' },
  { keyword: 'ISO 인증 컨설팅 업체', domain: 'iso_certification', category: 'iso_9001' },
  { keyword: 'ISO 통합인증 IMS', domain: 'iso_certification', category: 'iso_integrated' },
  { keyword: 'IATF 16949 자동차', domain: 'iso_certification', category: 'iatf_16949' },
  { keyword: 'ISO 인증 혜택 가산점', domain: 'iso_certification', category: 'iso_9001' },

  // ============================================================
  // 법인컨설팅 도메인
  // ============================================================
  { keyword: '법인 설립 절차 비용', domain: 'corporate_consulting', category: 'corp_establish' },
  { keyword: '개인사업자 법인전환', domain: 'corporate_consulting', category: 'corp_convert' },
  { keyword: '법인전환 장단점', domain: 'corporate_consulting', category: 'corp_convert' },
  { keyword: '1인 법인 설립', domain: 'corporate_consulting', category: 'corp_establish' },
  { keyword: '주식회사 설립 자본금', domain: 'corporate_consulting', category: 'corp_capital' },
  { keyword: '유한회사 vs 주식회사', domain: 'corporate_consulting', category: 'corp_type' },
  { keyword: '법인세 절세 방법', domain: 'corporate_consulting', category: 'corp_tax_saving' },
  { keyword: '법인 경비처리 항목', domain: 'corporate_consulting', category: 'corp_expense' },
  { keyword: '대표이사 급여 적정선', domain: 'corporate_consulting', category: 'corp_salary' },
  { keyword: '법인 배당 절세', domain: 'corporate_consulting', category: 'corp_dividend' },
  { keyword: 'R&D 세액공제 방법', domain: 'corporate_consulting', category: 'corp_tax_credit' },
  { keyword: '법인세율 구간 2026', domain: 'corporate_consulting', category: 'corp_tax_saving' },
  { keyword: '법인 자금조달 방법', domain: 'corporate_consulting', category: 'corp_funding' },
  { keyword: '비상장법인 가치평가', domain: 'corporate_consulting', category: 'corp_valuation' },
  { keyword: '법인 통장 관리 방법', domain: 'corporate_consulting', category: 'corp_account' },
  { keyword: '가지급금 정리 방법', domain: 'corporate_consulting', category: 'corp_temp_payment' },
  { keyword: '대표이사 가지급금', domain: 'corporate_consulting', category: 'corp_ceo_loan' },
  { keyword: '가지급금 인정이자', domain: 'corporate_consulting', category: 'corp_ceo_loan' },
  { keyword: '법인 지분 양도', domain: 'corporate_consulting', category: 'corp_equity_transfer' },
  { keyword: '비상장주식 양도세', domain: 'corporate_consulting', category: 'corp_equity_transfer' },
  { keyword: '스톡옵션 설계 방법', domain: 'corporate_consulting', category: 'corp_stock_option' },
  { keyword: '가족법인 지분 구성', domain: 'corporate_consulting', category: 'corp_family_equity' },
  { keyword: '가업승계 세제혜택', domain: 'corporate_consulting', category: 'corp_succession' },
  { keyword: '비상장주식 상속세', domain: 'corporate_consulting', category: 'corp_inheritance' },
  { keyword: '법인 활용 증여 전략', domain: 'corporate_consulting', category: 'corp_gift' },
  { keyword: '법인 부동산 매입 장단점', domain: 'corporate_consulting', category: 'corp_realestate' },
  { keyword: '법인차량 비용처리', domain: 'corporate_consulting', category: 'corp_car' },
  { keyword: '업무용 승용차 경비처리', domain: 'corporate_consulting', category: 'corp_car' },
  { keyword: '법인 임대사업 세금', domain: 'corporate_consulting', category: 'corp_lease' },
  { keyword: '이사회 의사록 작성', domain: 'corporate_consulting', category: 'corp_board' },
  { keyword: '법인등기 변경 방법', domain: 'corporate_consulting', category: 'corp_register' },
  { keyword: '법인 4대보험 관리', domain: 'corporate_consulting', category: 'corp_labor' },
  { keyword: '법인 청산 절차', domain: 'corporate_consulting', category: 'corp_liquidation' },
  { keyword: '휴면법인 정리', domain: 'corporate_consulting', category: 'corp_liquidation' },
  { keyword: '법인 M&A 절차', domain: 'corporate_consulting', category: 'corp_ma' },
];

export function getKeywordsByDomain(domain: PostDomain): KeywordEntry[] {
  return KEYWORD_DATABASE.filter((k) => k.domain === domain);
}

export function getKeywordsByCategory(domain: PostDomain, category: string): KeywordEntry[] {
  return KEYWORD_DATABASE.filter((k) => k.domain === domain && k.category === category);
}

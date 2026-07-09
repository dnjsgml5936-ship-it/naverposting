'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  PostDomain,
  DOMAIN_LABELS,
  InsuranceCategory,
  INSURANCE_CATEGORY_LABELS,
  PolicyFundOrg,
  POLICY_FUND_ORG_LABELS,
  POLICY_FUND_TYPES,
  GovSupportProgram,
  ISO_CERT_TYPES,
  CORP_CONSULTING_CATEGORIES,
  SMART_FACTORY_CATEGORIES,
  DISABLED_WORKPLACE_CATEGORIES,
  REAL_ESTATE_CATEGORIES,
  NaverNewsItem,
  GenerateRequest,
  GenerateResponse,
} from '@/types';
import { BIZINFO_CATEGORIES, BIZINFO_REGIONS } from '@/lib/bizinfo';
import ImageCardRenderer from '@/components/ImageCardRenderer';

const INSURANCE_KEYWORDS: Record<InsuranceCategory, string[]> = {
  whole_life: [
    '30대 종신보험 추천', '종신보험 필요성', '종신보험 해지환급금',
    '종신보험 vs 정기보험', '종신보험 납입면제', '종신보험 상속세 대비',
    '변액종신보험 장단점', '종신보험 가입시기', '종신보험 보험료 비교',
    '종신보험 리모델링', '부부 종신보험', '사업자 종신보험 활용',
  ],
  pension: [
    '연금보험 추천', '연금저축 vs 연금보험 차이', '비과세 연금보험',
    '노후준비 연금 설계', '연금보험 수령방식', '연금보험 세액공제',
    '40대 연금보험 가입', '연금보험 중도인출', '종신연금 vs 확정연금',
    '국민연금 부족분 대비', '연금보험 추천 상품', '연금개시 시점 전략',
  ],
  variable_annuity: [
    '변액연금 추천', '변액연금 수익률', '변액연금 펀드 선택',
    '변액연금 vs ETF', '변액연금 최저보증', '변액연금 사업비',
    '변액연금 비과세', '변액연금 자산배분', '변액연금 10년 유지',
    '변액연금 리스크 관리', '변액연금 장단점', '변액연금 가입 전 체크리스트',
  ],
  health_special: [
    '특판건강보험 가입', '3대질병 보험 추천', '암보험 비교',
    '비갱신형 건강보험', '실손보험 보완 보험', '특판보험 한정판매',
    '건강보험 리모델링', '갱신형 vs 비갱신형', '순수보장형 건강보험',
    '뇌혈관질환 보험', '심장질환 보험', '특판건강보험 가성비',
  ],
  general: [
    '보험 가입 순서', '보험료 절약 방법', '보험 리모델링 시기',
    '생애주기별 보험 설계', '보험 클레임 절차', '보험 해지 주의사항',
    '보험 비교 사이트 활용', '보험 설계사 선택 팁', '보험 보장분석',
  ],
};

const TONES = [
  { value: 'warm', label: '따뜻한 공감형', desc: '지인이 조언하듯 친근하게' },
  { value: 'professional', label: '전문가형', desc: '데이터와 근거 중심으로 명쾌하게' },
  { value: 'story', label: '스토리텔링형', desc: '실제 사례 기반 이야기 전개' },
  { value: 'casual', label: '친근 대화형', desc: '블로그 이웃과 수다하듯 편하게' },
  { value: 'authoritative', label: '권위 칼럼형', desc: '업계 전문가의 시사 칼럼 스타일' },
] as const;

export default function NewPostPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-[var(--muted)]">로딩 중...</div>}>
      <NewPostContent />
    </Suspense>
  );
}

function NewPostContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // 도메인 & 카테고리
  const [domain, setDomain] = useState<PostDomain>(
    (searchParams.get('domain') as PostDomain) || 'insurance'
  );
  const [insuranceCategory, setInsuranceCategory] = useState<InsuranceCategory>(
    (searchParams.get('category') as InsuranceCategory) || 'whole_life'
  );
  const [fundOrg, setFundOrg] = useState<PolicyFundOrg>('kibo');
  const [fundType, setFundType] = useState<string>('');

  // ISO인증 전용
  const [isoType, setIsoType] = useState<string>('iso_9001');
  const [newsArticles, setNewsArticles] = useState<NaverNewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);

  // 법인컨설팅 전용
  const [corpTopic, setCorpTopic] = useState<string>('corp_establish');
  const [referenceUrls, setReferenceUrls] = useState<string[]>(['']);

  // 스마트공장 전용
  const [smartFactoryTopic, setSmartFactoryTopic] = useState<string>('sf_gov_type');

  // 장애인표준사업장 전용
  const [disabledWorkplaceTopic, setDisabledWorkplaceTopic] = useState<string>('dw_establish');

  // 부동산 전용
  const [realEstateTopic, setRealEstateTopic] = useState<string>('re_apt_listing');

  // 기업마당 전용
  const [bizinfoProgram, setBizinfoProgram] = useState<GovSupportProgram | null>(null);
  const [bizinfoPrograms, setBizinfoPrograms] = useState<GovSupportProgram[]>([]);
  const [bizinfoLoading, setBizinfoLoading] = useState(false);
  const [bizinfoSearchKeyword, setBizinfoSearchKeyword] = useState('');
  const [bizinfoCategory, setBizinfoCategory] = useState('');
  const [bizinfoRegion, setBizinfoRegion] = useState('');
  const [bizinfoTotalCount, setBizinfoTotalCount] = useState(0);
  const [bizinfoPage, setBizinfoPage] = useState(1);
  const [bizinfoLoaded, setBizinfoLoaded] = useState(false);

  // 공통
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [tone, setTone] = useState<'warm' | 'professional' | 'story' | 'casual' | 'authoritative'>('warm');
  const [targetAge, setTargetAge] = useState('');
  const [painPoint, setPainPoint] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');

  // 결과
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [lastRequest, setLastRequest] = useState<GenerateRequest | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [editedHtml, setEditedHtml] = useState('');
  const [activeTab, setActiveTab] = useState<'preview' | 'html' | 'markdown'>('preview');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (result) {
      setEditedTitle(result.title);
      setEditedContent(result.content);
      setEditedHtml(result.htmlContent);
    }
  }, [result]);

  useEffect(() => {
    const types = POLICY_FUND_TYPES[fundOrg];
    if (types && types.length > 0) {
      setFundType(types[0].key);
    }
  }, [fundOrg]);

  // ISO 뉴스 자동 검색
  async function fetchIsoNews() {
    const selectedIso = ISO_CERT_TYPES.find((t) => t.key === isoType);
    const query = selectedIso
      ? `${selectedIso.label} ${selectedIso.fullName} 산업재해`
      : 'ISO인증 산업재해';

    setNewsLoading(true);
    try {
      const res = await fetch(`/api/naver-news?query=${encodeURIComponent(query)}&display=5`);
      const data = await res.json();
      if (data.error) {
        // 네이버 API 키 미설정 시 빈 배열
        setNewsArticles([]);
      } else {
        setNewsArticles(data.items || []);
      }
    } catch {
      setNewsArticles([]);
    } finally {
      setNewsLoading(false);
    }
  }

  // ISO 타입 변경 시 뉴스 자동 검색
  useEffect(() => {
    if (domain === 'iso_certification') {
      fetchIsoNews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isoType, domain]);

  // 기업마당 검색
  const fetchBizinfoPrograms = useCallback(async (page = 1, searchKw?: string, cat?: string, reg?: string) => {
    setBizinfoLoading(true);
    try {
      const params = new URLSearchParams();
      const kw = searchKw ?? bizinfoSearchKeyword;
      const c = cat ?? bizinfoCategory;
      const r = reg ?? bizinfoRegion;
      if (kw) params.set('keyword', kw);
      if (c) params.set('category', c);
      if (r) params.set('region', r);
      params.set('page', String(page));
      params.set('size', '20');
      const res = await fetch(`/api/bizinfo?${params.toString()}`);
      const data = await res.json();
      if (!data.error) {
        setBizinfoPrograms(data.items || []);
        setBizinfoTotalCount(data.totalCount || 0);
        setBizinfoPage(page);
      }
    } catch { /* ignore */ } finally { setBizinfoLoading(false); }
  }, [bizinfoSearchKeyword, bizinfoCategory, bizinfoRegion]);

  useEffect(() => {
    if (domain === 'bizinfo' && !bizinfoLoaded) {
      setBizinfoLoaded(true);
      fetchBizinfoPrograms(1, '', '', '');
    }
  }, [domain, bizinfoLoaded, fetchBizinfoPrograms]);

  function handleBizinfoCategoryChange(val: string) {
    setBizinfoCategory(val);
    setBizinfoProgram(null);
    fetchBizinfoPrograms(1, bizinfoSearchKeyword, val, bizinfoRegion);
  }

  function handleBizinfoRegionChange(val: string) {
    setBizinfoRegion(val);
    setBizinfoProgram(null);
    fetchBizinfoPrograms(1, bizinfoSearchKeyword, bizinfoCategory, val);
  }

  function handleBizinfoSearch() {
    setBizinfoProgram(null);
    fetchBizinfoPrograms(1);
  }

  // 참고자료 URL 관리
  function addReferenceUrl() {
    setReferenceUrls((prev) => [...prev, '']);
  }

  function updateReferenceUrl(index: number, value: string) {
    setReferenceUrls((prev) => prev.map((u, i) => (i === index ? value : u)));
  }

  function removeReferenceUrl(index: number) {
    setReferenceUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function getCategory(): string {
    switch (domain) {
      case 'insurance':
        return insuranceCategory;
      case 'policy_fund':
        return fundType || fundOrg;
      case 'iso_certification':
        return isoType;
      case 'corporate_consulting':
        return corpTopic;
      case 'smart_factory':
        return smartFactoryTopic;
      case 'disabled_workplace':
        return disabledWorkplaceTopic;
      case 'bizinfo':
        return bizinfoProgram?.pblancId || 'bizinfo_general';
      case 'real_estate':
        return realEstateTopic;
    }
  }

  async function handleGenerate() {
    if (!keyword.trim()) {
      setError('키워드를 입력해주세요.');
      return;
    }
    if (domain === 'bizinfo' && !bizinfoProgram) {
      setError('기업마당 지원사업을 선택해주세요.');
      return;
    }
    setError('');
    setGenerating(true);
    setResult(null);
    setProgress(0);
    setProgressMsg('AI 엔진 초기화 중...');

    // 진행 상태 시뮬레이션
    const progressSteps = [
      { at: 500, pct: 5, msg: '프롬프트 구성 중...' },
      { at: 1500, pct: 12, msg: 'AI 모델에 요청 전송 중...' },
      { at: 3000, pct: 20, msg: '키워드 분석 중...' },
      { at: 5000, pct: 30, msg: 'AIEO 최적화 구조 설계 중...' },
      { at: 8000, pct: 42, msg: '본문 콘텐츠 생성 중...' },
      { at: 12000, pct: 55, msg: 'E-E-A-T 요소 반영 중...' },
      { at: 16000, pct: 65, msg: 'FAQ 섹션 작성 중...' },
      { at: 20000, pct: 75, msg: 'SEO 점수 최적화 중...' },
      { at: 25000, pct: 82, msg: '이미지 카드 데이터 생성 중...' },
      { at: 30000, pct: 88, msg: 'HTML 포맷 변환 중...' },
      { at: 35000, pct: 92, msg: '해시태그 & 출처 정리 중...' },
    ];
    const timers = progressSteps.map((step) =>
      setTimeout(() => { setProgress(step.pct); setProgressMsg(step.msg); }, step.at)
    );

    try {
      const body: GenerateRequest = {
        keyword: keyword.trim(),
        domain,
        category: getCategory(),
        tone,
        targetAge: targetAge || undefined,
        painPoint: painPoint || undefined,
        additionalContext: additionalContext || undefined,
      };

      if (domain === 'policy_fund') {
        body.fundOrg = fundOrg;
        body.fundType = fundType;
      }
      if (domain === 'iso_certification') {
        body.isoType = isoType;
        if (newsArticles.length > 0) {
          body.newsArticles = newsArticles;
        }
      }
      if (domain === 'corporate_consulting') {
        body.corpTopic = corpTopic;
        const validUrls = referenceUrls.filter((u) => u.trim());
        if (validUrls.length > 0) {
          body.referenceUrls = validUrls;
        }
      }
      if (domain === 'smart_factory') {
        body.smartFactoryTopic = smartFactoryTopic;
      }
      if (domain === 'disabled_workplace') {
        body.disabledWorkplaceTopic = disabledWorkplaceTopic;
      }
      if (domain === 'real_estate') {
        body.realEstateTopic = realEstateTopic;
      }
      if (domain === 'bizinfo' && bizinfoProgram) {
        body.govProgram = bizinfoProgram;
      }

      // 저장 시 함께 기록할 수 있도록 생성 입력값 보관
      setLastRequest(body);

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      setProgress(95);
      setProgressMsg('응답 처리 중...');
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setProgress(100);
        setProgressMsg('완료!');
        setResult(data);
      }
    } catch {
      setError('생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      timers.forEach(clearTimeout);
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!result) return;
    setSaving(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editedTitle,
          content: editedContent,
          htmlContent: editedHtml,
          keyword,
          domain,
          category: getCategory(),
          tags: result.tags,
          generationInput: lastRequest || undefined,
        }),
      });
      const data = await res.json();
      if (data.id) {
        alert('포스트가 저장되었습니다!');
        router.push('/posts');
      }
    } catch {
      alert('저장 실패. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  }

  async function handleCopyHtml() {
    try {
      await navigator.clipboard.writeText(editedHtml);
      alert('HTML이 클립보드에 복사되었습니다!\n네이버 블로그 > HTML 모드에 붙여넣기 하세요.');
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = editedHtml;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('HTML이 복사되었습니다!');
    }
  }

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold mb-1">새 글 작성</h1>
      <p className="text-[var(--muted)] text-sm mb-8">
        키워드를 입력하면 네이버 AIEO 최적화 포스팅을 자동 생성합니다
      </p>

      <div className="grid grid-cols-5 gap-8">
        {/* Left: Input Panel */}
        <div className="col-span-2 space-y-5">
          <div className="bg-white rounded-xl border border-[var(--border)] p-6 space-y-5">

            {/* Domain Selector */}
            <div>
              <label className="block text-sm font-medium mb-2">도메인 선택</label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(DOMAIN_LABELS) as [PostDomain, string][]).map(
                  ([key, label]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setDomain(key);
                        setResult(null);
                        setError('');
                      }}
                      className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        domain === key
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-gray-50 text-[var(--muted)] hover:bg-gray-100'
                      }`}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Keyword */}
            <div>
              <label className="block text-sm font-medium mb-2">
                메인 키워드 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder={
                  domain === 'insurance' ? '예: 30대 종신보험 추천'
                    : domain === 'policy_fund' ? '예: 기술보증기금 창업보증'
                    : domain === 'iso_certification' ? '예: ISO 45001 안전보건 인증'
                    : domain === 'smart_factory' ? '예: 스마트공장 구축 지원사업 신청방법'
                    : domain === 'disabled_workplace' ? '예: 장애인표준사업장 설립 지원금'
                    : domain === 'bizinfo' ? '예: 중소기업 지원사업 신청방법'
                    : domain === 'real_estate' ? '예: 전세 계약 체크리스트, 강남 꼬마빌딩 매매'
                    : '예: 법인전환 절세 효과'
                }
                className="w-full px-4 py-3 rounded-lg border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>

            {/* ========== 보험 카테고리 ========== */}
            {domain === 'insurance' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">보험 카테고리</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.entries(INSURANCE_CATEGORY_LABELS) as [InsuranceCategory, string][])
                      .filter(([key]) => key !== 'general')
                      .map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => setInsuranceCategory(key)}
                          className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                            insuranceCategory === key
                              ? 'bg-[var(--primary)] text-white'
                              : 'bg-gray-50 text-[var(--muted)] hover:bg-gray-100'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">추천 키워드</label>
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                    {(INSURANCE_KEYWORDS[insuranceCategory] || []).map((kw) => (
                      <button
                        key={kw}
                        onClick={() => setKeyword(kw)}
                        className={`px-2.5 py-1.5 rounded-full text-xs transition-colors ${
                          keyword === kw
                            ? 'bg-[var(--primary)] text-white'
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        }`}
                      >
                        {kw}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ========== 정책자금 카테고리 ========== */}
            {domain === 'policy_fund' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">보증/대출 기관</label>
                  <div className="space-y-2">
                    {(Object.entries(POLICY_FUND_ORG_LABELS) as [PolicyFundOrg, string][]).map(
                      ([key, label]) => (
                        <button
                          key={key}
                          onClick={() => setFundOrg(key)}
                          className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${
                            fundOrg === key
                              ? 'bg-blue-50 border border-[var(--primary)] text-[var(--primary)]'
                              : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                          }`}
                        >
                          {label}
                        </button>
                      )
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">자금 종류</label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {(POLICY_FUND_TYPES[fundOrg] || []).map((ft) => (
                      <button
                        key={ft.key}
                        onClick={() => setFundType(ft.key)}
                        className={`px-3 py-2 rounded-lg text-xs transition-colors ${
                          fundType === ft.key
                            ? 'bg-[var(--primary)] text-white'
                            : 'bg-gray-50 text-[var(--muted)] hover:bg-gray-100'
                        }`}
                      >
                        {ft.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}


            {/* ========== ISO인증 선택 ========== */}
            {domain === 'iso_certification' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">ISO 인증 종류</label>
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                    {ISO_CERT_TYPES.map((iso) => (
                      <button
                        key={iso.key}
                        onClick={() => setIsoType(iso.key)}
                        className={`text-left px-3 py-2.5 rounded-lg transition-colors ${
                          isoType === iso.key
                            ? 'bg-orange-50 border border-orange-400 text-orange-700'
                            : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <p className="text-xs font-bold">{iso.label}</p>
                        <p className="text-xs text-[var(--muted)] leading-tight mt-0.5">{iso.fullName}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 선택된 ISO 정보 */}
                {isoType && (
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-xs font-medium text-orange-700">선택된 인증</p>
                    {(() => {
                      const selected = ISO_CERT_TYPES.find((t) => t.key === isoType);
                      return selected ? (
                        <>
                          <p className="text-sm font-medium mt-1">{selected.label} - {selected.fullName}</p>
                          <p className="text-xs text-[var(--muted)] mt-0.5">{selected.description}</p>
                        </>
                      ) : null;
                    })()}
                  </div>
                )}

                {/* 관련 뉴스 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">관련 뉴스 (자동 검색)</label>
                    <button
                      onClick={fetchIsoNews}
                      disabled={newsLoading}
                      className="text-xs text-[var(--primary)] hover:underline disabled:opacity-50"
                    >
                      {newsLoading ? '검색 중...' : '새로고침'}
                    </button>
                  </div>
                  {newsLoading ? (
                    <div className="text-center py-3 text-xs text-[var(--muted)]">뉴스를 검색하는 중...</div>
                  ) : newsArticles.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-[var(--border)] rounded-lg p-2">
                      {newsArticles.map((news, i) => (
                        <div key={i} className="p-2 bg-gray-50 rounded-lg">
                          <p className="text-xs font-medium leading-snug">{news.title}</p>
                          <p className="text-xs text-[var(--muted)] mt-0.5 line-clamp-2">{news.description}</p>
                          <p className="text-xs text-[var(--muted)] mt-0.5">{new Date(news.pubDate).toLocaleDateString('ko-KR')}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--muted)] p-3 bg-gray-50 rounded-lg">
                      네이버 뉴스 API 키 설정 후 관련 뉴스가 자동으로 표시됩니다.
                      (.env.local에 NAVER_CLIENT_ID, NAVER_CLIENT_SECRET 설정)
                    </p>
                  )}
                  <p className="text-xs text-[var(--muted)] mt-1">
                    * 검색된 뉴스는 포스팅 본문에 자동으로 인용 & 링크 삽입됩니다
                  </p>
                </div>
              </div>
            )}

            {/* ========== 법인컨설팅 주제 선택 ========== */}
            {domain === 'corporate_consulting' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">컨설팅 주제</label>
                  <div className="max-h-72 overflow-y-auto space-y-3 border border-[var(--border)] rounded-lg p-3">
                    {CORP_CONSULTING_CATEGORIES.map((cat) => (
                      <div key={cat.label}>
                        <p className="text-xs font-bold text-[var(--muted)] mb-1.5 uppercase">{cat.label}</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {cat.topics.map((topic) => (
                            <button
                              key={topic.key}
                              onClick={() => setCorpTopic(topic.key)}
                              className={`text-left px-2.5 py-2 rounded-lg transition-colors ${
                                corpTopic === topic.key
                                  ? 'bg-indigo-50 border border-indigo-400 text-indigo-700'
                                  : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                              }`}
                            >
                              <p className="text-xs font-medium">{topic.label}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 선택된 주제 정보 */}
                {corpTopic && (() => {
                  let selected: { label: string; description: string } | null = null;
                  for (const cat of CORP_CONSULTING_CATEGORIES) {
                    const found = cat.topics.find((t) => t.key === corpTopic);
                    if (found) { selected = found; break; }
                  }
                  return selected ? (
                    <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                      <p className="text-xs font-medium text-indigo-700">선택된 주제</p>
                      <p className="text-sm font-medium mt-1">{selected.label}</p>
                      <p className="text-xs text-[var(--muted)] mt-0.5">{selected.description}</p>
                    </div>
                  ) : null;
                })()}

                {/* 참고자료 URL */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">
                      참고자료 URL <span className="text-xs text-[var(--muted)]">(선택)</span>
                    </label>
                    <button
                      onClick={addReferenceUrl}
                      className="text-xs text-[var(--primary)] hover:underline"
                    >
                      + URL 추가
                    </button>
                  </div>
                  <div className="space-y-2">
                    {referenceUrls.map((url, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="text"
                          value={url}
                          onChange={(e) => updateReferenceUrl(i, e.target.value)}
                          placeholder="블로그, 기사, 유튜브 URL 등"
                          className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        />
                        {referenceUrls.length > 1 && (
                          <button
                            onClick={() => removeReferenceUrl(i)}
                            className="px-2 text-xs text-red-400 hover:text-red-600"
                          >
                            x
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-[var(--muted)] mt-1.5">
                    * 유튜브/블로그/기사 등의 URL을 넣으면 해당 내용을 참고하여 각색합니다
                  </p>
                </div>
              </div>
            )}

            {/* ========== 스마트공장 주제 선택 ========== */}
            {domain === 'smart_factory' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">스마트공장 주제</label>
                  <div className="max-h-72 overflow-y-auto space-y-3 border border-[var(--border)] rounded-lg p-3">
                    {SMART_FACTORY_CATEGORIES.map((cat) => (
                      <div key={cat.label}>
                        <p className="text-xs font-bold text-[var(--muted)] mb-1.5 uppercase">{cat.label}</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {cat.topics.map((topic) => (
                            <button
                              key={topic.key}
                              onClick={() => setSmartFactoryTopic(topic.key)}
                              className={`text-left px-2.5 py-2 rounded-lg transition-colors ${
                                smartFactoryTopic === topic.key
                                  ? 'bg-teal-50 border border-teal-400 text-teal-700'
                                  : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                              }`}
                            >
                              <p className="text-xs font-medium">{topic.label}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {smartFactoryTopic && (() => {
                  let selected: { label: string; description: string } | null = null;
                  for (const cat of SMART_FACTORY_CATEGORIES) {
                    const found = cat.topics.find((t) => t.key === smartFactoryTopic);
                    if (found) { selected = found; break; }
                  }
                  return selected ? (
                    <div className="p-3 bg-teal-50 rounded-lg border border-teal-200">
                      <p className="text-xs font-medium text-teal-700">선택된 주제</p>
                      <p className="text-sm font-medium mt-1">{selected.label}</p>
                      <p className="text-xs text-[var(--muted)] mt-0.5">{selected.description}</p>
                    </div>
                  ) : null;
                })()}

              </div>
            )}

            {/* ========== 장애인표준사업장 주제 선택 ========== */}
            {domain === 'disabled_workplace' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">장애인표준사업장 주제</label>
                  <div className="max-h-72 overflow-y-auto space-y-3 border border-[var(--border)] rounded-lg p-3">
                    {DISABLED_WORKPLACE_CATEGORIES.map((cat) => (
                      <div key={cat.label}>
                        <p className="text-xs font-bold text-[var(--muted)] mb-1.5 uppercase">{cat.label}</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {cat.topics.map((topic) => (
                            <button
                              key={topic.key}
                              onClick={() => setDisabledWorkplaceTopic(topic.key)}
                              className={`text-left px-2.5 py-2 rounded-lg transition-colors ${
                                disabledWorkplaceTopic === topic.key
                                  ? 'bg-rose-50 border border-rose-400 text-rose-700'
                                  : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                              }`}
                            >
                              <p className="text-xs font-medium">{topic.label}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {disabledWorkplaceTopic && (() => {
                  let selected: { label: string; description: string } | null = null;
                  for (const cat of DISABLED_WORKPLACE_CATEGORIES) {
                    const found = cat.topics.find((t) => t.key === disabledWorkplaceTopic);
                    if (found) { selected = found; break; }
                  }
                  return selected ? (
                    <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                      <p className="text-xs font-medium text-rose-700">선택된 주제</p>
                      <p className="text-sm font-medium mt-1">{selected.label}</p>
                      <p className="text-xs text-[var(--muted)] mt-0.5">{selected.description}</p>
                    </div>
                  ) : null;
                })()}

              </div>
            )}

            {/* ========== 부동산 주제 선택 ========== */}
            {domain === 'real_estate' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">부동산 주제</label>
                  <div className="max-h-72 overflow-y-auto space-y-3 border border-[var(--border)] rounded-lg p-3">
                    {REAL_ESTATE_CATEGORIES.map((cat) => (
                      <div key={cat.label}>
                        <p className="text-xs font-bold text-[var(--muted)] mb-1.5 uppercase">{cat.label}</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {cat.topics.map((topic) => (
                            <button
                              key={topic.key}
                              onClick={() => setRealEstateTopic(topic.key)}
                              className={`text-left px-2.5 py-2 rounded-lg transition-colors ${
                                realEstateTopic === topic.key
                                  ? 'bg-emerald-50 border border-emerald-400 text-emerald-700'
                                  : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                              }`}
                            >
                              <p className="text-xs font-medium">{topic.label}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {realEstateTopic && (() => {
                  let selected: { label: string; description: string } | null = null;
                  for (const cat of REAL_ESTATE_CATEGORIES) {
                    const found = cat.topics.find((t) => t.key === realEstateTopic);
                    if (found) { selected = found; break; }
                  }
                  return selected ? (
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <p className="text-xs font-medium text-emerald-700">선택된 주제</p>
                      <p className="text-sm font-medium mt-1">{selected.label}</p>
                      <p className="text-xs text-[var(--muted)] mt-0.5">{selected.description}</p>
                    </div>
                  ) : null;
                })()}

              </div>
            )}

            {/* ========== 기업마당 지원사업 선택 ========== */}
            {domain === 'bizinfo' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">분야/지역 필터</label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <select value={bizinfoCategory} onChange={(e) => handleBizinfoCategoryChange(e.target.value)} className="px-3 py-2.5 rounded-lg border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                      {Object.entries(BIZINFO_CATEGORIES).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                    </select>
                    <select value={bizinfoRegion} onChange={(e) => handleBizinfoRegionChange(e.target.value)} className="px-3 py-2.5 rounded-lg border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
                      {Object.entries(BIZINFO_REGIONS).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={bizinfoSearchKeyword} onChange={(e) => setBizinfoSearchKeyword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleBizinfoSearch()} placeholder="사업명 또는 키워드 검색" className="flex-1 px-3 py-2.5 rounded-lg border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
                    <button onClick={handleBizinfoSearch} disabled={bizinfoLoading} className="px-4 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50">{bizinfoLoading ? '...' : '검색'}</button>
                  </div>
                </div>
                {(bizinfoCategory || bizinfoRegion || bizinfoSearchKeyword) && (
                  <div className="flex flex-wrap gap-1.5">
                    {bizinfoCategory && (<span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-amber-50 text-amber-600 rounded-full">{BIZINFO_CATEGORIES[bizinfoCategory]}<button onClick={() => handleBizinfoCategoryChange('')} className="hover:text-amber-800">x</button></span>)}
                    {bizinfoRegion && (<span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-emerald-50 text-emerald-600 rounded-full">{BIZINFO_REGIONS[bizinfoRegion]}<button onClick={() => handleBizinfoRegionChange('')} className="hover:text-emerald-800">x</button></span>)}
                    {bizinfoSearchKeyword && (<span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full">&quot;{bizinfoSearchKeyword}&quot;<button onClick={() => { setBizinfoSearchKeyword(''); fetchBizinfoPrograms(1, '', bizinfoCategory, bizinfoRegion); }} className="hover:text-blue-800">x</button></span>)}
                  </div>
                )}
                {bizinfoLoading && (<div className="text-center py-4 text-sm text-[var(--muted)]"><div className="inline-block animate-spin w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full mr-2" />지원사업 목록을 불러오는 중...</div>)}
                {!bizinfoLoading && bizinfoPrograms.length > 0 && (
                  <div>
                    <p className="text-xs text-[var(--muted)] mb-2">총 {bizinfoTotalCount}건 (최신순)</p>
                    <div className="max-h-72 overflow-y-auto space-y-2 border border-[var(--border)] rounded-lg p-2">
                      {bizinfoPrograms.map((prog) => (
                        <button key={prog.pblancId} onClick={() => { setBizinfoProgram(prog); if (!keyword) setKeyword(prog.pblancNm); }} className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${bizinfoProgram?.pblancId === prog.pblancId ? 'bg-amber-50 border border-amber-400' : 'bg-gray-50 hover:bg-gray-100'}`}>
                          <p className="font-medium text-xs leading-snug">{prog.pblancNm}</p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span className="text-xs px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded">{prog.jrsdInsttNm}</span>
                            {prog.bizPrchPttnNm && (<span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded">{prog.bizPrchPttnNm}</span>)}
                          </div>
                          {prog.reqstBeginEndDe && (<p className="text-xs text-[var(--muted)] mt-1">접수: {prog.reqstBeginEndDe}</p>)}
                        </button>
                      ))}
                    </div>
                    {bizinfoTotalCount > 20 && (
                      <div className="flex justify-center items-center gap-2 mt-3">
                        <button onClick={() => fetchBizinfoPrograms(bizinfoPage - 1)} disabled={bizinfoPage <= 1} className="px-3 py-1.5 text-xs bg-gray-50 rounded-lg hover:bg-gray-100 disabled:opacity-30">이전</button>
                        <span className="px-3 py-1.5 text-xs text-[var(--muted)]">{bizinfoPage} / {Math.ceil(bizinfoTotalCount / 20)}</span>
                        <button onClick={() => fetchBizinfoPrograms(bizinfoPage + 1)} disabled={bizinfoPage >= Math.ceil(bizinfoTotalCount / 20)} className="px-3 py-1.5 text-xs bg-gray-50 rounded-lg hover:bg-gray-100 disabled:opacity-30">다음</button>
                      </div>
                    )}
                  </div>
                )}
                {!bizinfoLoading && bizinfoPrograms.length === 0 && bizinfoLoaded && (<div className="text-center py-4 text-sm text-[var(--muted)]">조건에 맞는 지원사업이 없습니다.</div>)}
                {bizinfoProgram && (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center justify-between"><p className="text-xs font-medium text-amber-700">선택된 지원사업</p><button onClick={() => setBizinfoProgram(null)} className="text-xs text-amber-500 hover:text-amber-700">해제</button></div>
                    <p className="text-sm font-medium mt-1">{bizinfoProgram.pblancNm}</p>
                    <p className="text-xs text-[var(--muted)] mt-0.5">{bizinfoProgram.jrsdInsttNm}{bizinfoProgram.reqstBeginEndDe && ` | 접수: ${bizinfoProgram.reqstBeginEndDe}`}</p>
                    {bizinfoProgram.bsnsSumryCn && (<p className="text-xs text-[var(--muted)] mt-1 line-clamp-2">{bizinfoProgram.bsnsSumryCn}</p>)}
                  </div>
                )}
              </div>
            )}

            {/* Tone */}
            <div>
              <label className="block text-sm font-medium mb-2">글쓰기 톤</label>
              <div className="space-y-2">
                {TONES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setTone(t.value)}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm transition-colors ${
                      tone === t.value
                        ? 'bg-blue-50 border border-[var(--primary)] text-[var(--primary)]'
                        : 'bg-gray-50 border border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <span className="font-medium">{t.label}</span>
                    <span className="text-xs text-[var(--muted)] ml-2">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Target */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {domain === 'insurance' ? '타겟 연령대' : '타겟 대상'}{' '}
                <span className="text-xs text-[var(--muted)]">(선택)</span>
              </label>
              <input
                type="text"
                value={targetAge}
                onChange={(e) => setTargetAge(e.target.value)}
                placeholder={
                  domain === 'insurance' ? '예: 30~40대 직장인'
                    : domain === 'iso_certification' ? '예: 제조업 중소기업'
                    : domain === 'corporate_consulting' ? '예: 매출 10억 이상 법인 대표'
                    : domain === 'smart_factory' ? '예: 제조업 중소기업 대표/공장장'
                    : domain === 'disabled_workplace' ? '예: 의무고용 미이행 중견기업'
                    : domain === 'bizinfo' ? '예: 매출 50억 이하 제조업 중소기업'
                    : domain === 'real_estate' ? '예: 30대 신혼부부, 부동산 투자 초보자'
                    : '예: 업력 3년 이내 스타트업'
                }
                className="w-full px-4 py-3 rounded-lg border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>

            {/* Pain Point */}
            <div>
              <label className="block text-sm font-medium mb-2">
                {domain === 'insurance' ? '고객 고민 포인트' : '사업자 고민 포인트'}{' '}
                <span className="text-xs text-[var(--muted)]">(선택)</span>
              </label>
              <input
                type="text"
                value={painPoint}
                onChange={(e) => setPainPoint(e.target.value)}
                placeholder={
                  domain === 'insurance' ? '예: 보험료가 부담되지만 가족 보장이 걱정'
                    : domain === 'iso_certification' ? '예: 입찰 가산점이 필요한데 인증 절차가 복잡'
                    : domain === 'corporate_consulting' ? '예: 가지급금이 쌓여 세무조사가 걱정'
                    : domain === 'smart_factory' ? '예: 공장 자동화가 필요한데 비용이 부담'
                    : domain === 'disabled_workplace' ? '예: 의무고용 부담금이 너무 큰데 대안이 필요'
                    : domain === 'bizinfo' ? '예: 지원사업 신청 조건이 복잡해서 어디서부터 시작할지 모름'
                    : domain === 'real_estate' ? '예: 전세사기가 걱정되는데 안전한 전세 계약 방법을 알고 싶음'
                    : '예: 담보 없이 운전자금이 급하게 필요'
                }
                className="w-full px-4 py-3 rounded-lg border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
              />
            </div>

            {/* Additional Context */}
            <div>
              <label className="block text-sm font-medium mb-2">
                추가 맥락 <span className="text-xs text-[var(--muted)]">(선택)</span>
              </label>
              <textarea
                value={additionalContext}
                onChange={(e) => setAdditionalContext(e.target.value)}
                placeholder="특별히 강조하고 싶은 내용, 최근 트렌드, 정책 변경 사항 등"
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
              />
            </div>

            {error && (<div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>)}

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-3 bg-[var(--primary)] text-white rounded-lg font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  AI가 포스팅을 생성하고 있습니다...
                </span>
              ) : (
                'AIEO 최적화 포스팅 생성'
              )}
            </button>
          </div>
        </div>

        {/* Right: Result Panel */}
        <div className="col-span-3">
          {!result && !generating ? (
            <div className="bg-white rounded-xl border border-[var(--border)] p-12 text-center">
              <div className="text-4xl mb-4">&#9997;&#65039;</div>
              <h3 className="font-semibold text-lg mb-2">키워드를 입력하고 생성 버튼을 눌러주세요</h3>
              <p className="text-sm text-[var(--muted)]">
                {domain === 'insurance' ? 'AI가 네이버 AIEO 최적화된 전문 보험 블로그 포스팅을 작성합니다'
                  : domain === 'policy_fund' ? 'AI가 정책자금 안내 블로그 포스팅을 작성합니다'
                  : domain === 'iso_certification' ? 'AI가 ISO인증 안내 블로그 포스팅을 작성합니다 (장단점 + 뉴스 인용)'
                  : domain === 'smart_factory' ? 'AI가 스마트공장 구축/지원 블로그 포스팅을 작성합니다'
                  : domain === 'disabled_workplace' ? 'AI가 장애인표준사업장 안내 블로그 포스팅을 작성합니다'
                  : domain === 'bizinfo' ? 'AI가 기업마당 지원사업/금융 안내 블로그 포스팅을 작성합니다'
                  : domain === 'real_estate' ? 'AI가 부동산 전문 블로그 포스팅을 작성합니다 (매물/계약/투자/시장분석)'
                  : 'AI가 법인컨설팅 전문 블로그 포스팅을 작성합니다'}
              </p>
            </div>
          ) : generating ? (
            <div className="bg-white rounded-xl border border-[var(--border)] p-10">
              {/* 스피너 */}
              <div className="flex justify-center mb-6">
                <div className="relative w-24 h-24">
                  {/* 외곽 링 회전 */}
                  <svg className="w-24 h-24 animate-spin" viewBox="0 0 100 100" style={{ animationDuration: '3s' }}>
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke="var(--primary)" strokeWidth="6" strokeLinecap="round"
                      strokeDasharray={`${progress * 2.64} 264`} transform="rotate(-90 50 50)" className="transition-all duration-500" />
                  </svg>
                  {/* 퍼센트 표시 */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-[var(--primary)]">{progress}%</span>
                  </div>
                </div>
              </div>
              {/* 메시지 */}
              <h3 className="font-semibold text-lg text-center mb-2">포스팅 생성 중</h3>
              <p className="text-sm text-[var(--primary)] text-center font-medium mb-4">{progressMsg}</p>
              {/* 프로그레스 바 */}
              <div className="w-full max-w-md mx-auto">
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-[var(--muted)]">
                  <span>프롬프트 구성</span>
                  <span>콘텐츠 생성</span>
                  <span>SEO 최적화</span>
                  <span>완료</span>
                </div>
              </div>
              {/* 하단 안내 */}
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[var(--muted)]">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                AI 엔진 작동 중 — 보통 15~30초 소요됩니다
              </div>
            </div>
          ) : result ? (
            <div className="space-y-4">
              {/* SEO Score & Tags */}
              <div className="bg-white rounded-xl border border-[var(--border)] p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-sm text-[var(--muted)]">SEO 점수</span>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-green-500 rounded-full" style={{ width: `${result.seoScore}%` }} /></div>
                        <span className="text-sm font-bold text-green-600">{result.seoScore}/100</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleCopyHtml} className="px-4 py-2 text-sm font-medium bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">HTML 복사</button>
                    <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50">{saving ? '저장 중...' : '저장하기'}</button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">{result.tags.map((tag) => (<span key={tag} className="text-xs px-2.5 py-1 bg-blue-50 text-[var(--primary)] rounded-full">#{tag}</span>))}</div>
                {result.tips && result.tips.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[var(--border)]">
                    <p className="text-xs font-medium text-[var(--muted)] mb-1">SEO 개선 팁</p>
                    <ul className="text-xs text-[var(--muted)] space-y-0.5">{result.tips.map((tip, i) => (<li key={i}>&#8226; {tip}</li>))}</ul>
                  </div>
                )}
              </div>

              {/* Title */}
              <div className="bg-white rounded-xl border border-[var(--border)] p-5">
                <label className="block text-sm font-medium mb-2">제목</label>
                <input type="text" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-[var(--border)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent" />
                <p className="text-xs text-[var(--muted)] mt-1">{editedTitle.length}자{editedTitle.length > 35 && (<span className="text-yellow-500 ml-1">(30~35자 권장)</span>)}</p>
              </div>

              {/* Content Tabs */}
              <div className="bg-white rounded-xl border border-[var(--border)]">
                <div className="flex border-b border-[var(--border)]">
                  {(['preview', 'html', 'markdown'] as const).map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-3 text-sm font-medium transition-colors ${activeTab === tab ? 'border-b-2 border-[var(--primary)] text-[var(--primary)]' : 'text-[var(--muted)] hover:text-[var(--foreground)]'}`}>
                      {tab === 'preview' ? '미리보기' : tab === 'html' ? 'HTML' : '마크다운'}
                    </button>
                  ))}
                </div>
                <div className="p-6 max-h-[600px] overflow-y-auto">
                  {activeTab === 'preview' ? (
                    <div className="blog-preview prose max-w-none" dangerouslySetInnerHTML={{ __html: editedHtml }} />
                  ) : activeTab === 'html' ? (
                    <textarea value={editedHtml} onChange={(e) => setEditedHtml(e.target.value)} className="w-full min-h-[500px] font-mono text-xs p-4 bg-gray-50 rounded-lg border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-y" />
                  ) : (
                    <textarea value={editedContent} onChange={(e) => setEditedContent(e.target.value)} className="w-full min-h-[500px] text-sm p-4 bg-gray-50 rounded-lg border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-y leading-relaxed" />
                  )}
                </div>
              </div>

              {/* Image Cards & Video */}
              {result.imageCards && result.imageCards.length > 0 && (
                <div className="bg-white rounded-xl border border-[var(--border)] p-5">
                  <ImageCardRenderer cards={result.imageCards} blogTitle={editedTitle} domain={domain} />
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

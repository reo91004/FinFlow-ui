// lib/types.ts
export interface PortfolioAllocation {
	stock: string;
	percentage: number;
	amount: number;
}

export interface PerformanceMetrics {
	label: string;
	portfolio: string;
	spy: string;
	qqq: string;
}

export interface QuickMetrics {
	annualReturn: string;
	sharpeRatio: string;
	maxDrawdown: string;
	volatility: string;
}

export interface PredictionResult {
	portfolioAllocation: PortfolioAllocation[];
	performanceMetrics: PerformanceMetrics[];
	quickMetrics: QuickMetrics;
}

// XAI 관련 타입들
export interface FeatureImportance {
	feature_name: string;
	importance_score: number;
	asset_name: string;
}

export interface AttentionWeight {
	from_asset: string;
	to_asset: string;
	weight: number;
}

export interface XAIData {
	feature_importance: FeatureImportance[];
	attention_weights: AttentionWeight[];
	explanation_text: string;
}

// 백테스트 관련 타입들
export interface PerformanceHistory {
	date: string;
	portfolio: number;
	spy: number;
	qqq: number;
}

export interface HistoricalPerformanceResponse {
	performance_history: PerformanceHistory[];
}

// 상관관계 분석 타입들
export interface CorrelationData {
	stock1: string;
	stock2: string;
	correlation: number;
}

export interface CorrelationResponse {
	correlation_data: CorrelationData[];
}

// 리스크-수익률 분석 타입들
export interface RiskReturnData {
	symbol: string;
	risk: number; // 연간 변동성 (%)
	return_rate: number; // 연간 수익률 (%)
	allocation: number; // 포트폴리오 비중 (%)
}

export interface RiskReturnResponse {
	risk_return_data: RiskReturnData[];
}

// 시장 데이터 타입들
export interface MarketData {
	symbol: string;
	name: string;
	price: number;
	change: number;
	change_percent: number;
	last_updated: string;
}

export interface MarketStatusResponse {
	market_data: MarketData[];
	last_updated: string;
}

// 포트폴리오 예측 요청 타입들
export interface PortfolioRequest {
	investmentAmount: number;
	riskTolerance?: string;
	investmentHorizon?: number;
}

export interface XAIRequest {
	investmentAmount: number;
	riskTolerance: string;
	investmentHorizon: number;
	method?: "accurate";
}


// 차트 관련 타입들
export interface ChartDataPoint {
	date: string;
	portfolio: number;
	spy?: number;
	qqq?: number;
	[key: string]: any;
}

// 컴포넌트 Props 타입들
export interface TabsData {
	portfolio: {
		allocation: PortfolioAllocation[];
		metrics: PerformanceMetrics[];
		quickMetrics: QuickMetrics;
	};
	performance: {
		history: PerformanceHistory[];
	};
	xai: XAIData;
	correlation: CorrelationData[];
	riskReturn: RiskReturnData[];
}

export interface AnalysisPageProps {
	investmentAmount: string;
	riskTolerance: string;
	investmentHorizon: string;
}

// 로딩 상태 관리 타입들
export interface LoadingState {
	isLoading: boolean;
	currentStep: string;
	progress: number;
	error?: string;
}

export interface ApiCallState {
	portfolio: LoadingState;
	xai: LoadingState;
	performance: LoadingState;
	correlation: LoadingState;
	riskReturn: LoadingState;
	market: LoadingState;
}

// 에러 처리 타입들
export interface ApiError {
	message: string;
	status?: number;
	code?: string;
}

export interface FallbackData {
	portfolio: PredictionResult;
	xai: XAIData;
	performance: PerformanceHistory[];
	correlation: CorrelationData[];
	riskReturn: RiskReturnData[];
}

// 설정 관련 타입들
export interface AppConfig {
	apiBaseUrl: string;
	pythonServerUrl: string;
	enableFallback: boolean;
	defaultTimeout: number;
}

// 서버 상태 타입
export interface ServerHealthStatus {
	python: boolean;
	nextjs: boolean;
}

// 캐시 항목 타입
export interface CacheItem<T = any> {
	data: T;
	timestamp: number;
	ttl: number;
}

// 유틸리티 타입들
export type InvestmentProfile = "conservative" | "moderate" | "aggressive";
export type TimeHorizon = "short" | "medium" | "long";
export type AnalysisType = "backtesting" | "live";

// Backend API 요청/응답 계약 타입들 (422 방지용)
export interface PredictRequest {
	investment_amount: number;
	risk_tolerance: "conservative" | "moderate" | "aggressive";
	investment_horizon: number;
}

export interface AllocationItem {
	symbol: string;
	weight: number;
	amount?: number;
}

export interface PredictResponse {
	allocation: AllocationItem[];
	metrics: {
		total_return: number;
		annual_return: number;
		sharpe_ratio: number;
		sortino_ratio: number;
		max_drawdown: number;
		volatility: number;
		win_rate?: number;
		profit_loss_ratio?: number;
	};
	cash?: number;
}

export interface CorrelationRequest {
	tickers: string[];
	period: "1m" | "3m" | "6m" | "1y" | "3y";
}

export interface CorrelationResponse {
	correlation_data: CorrelationData[];
}

export interface RiskReturnRequest {
	portfolio_allocation: Array<{ symbol: string; weight: number }>;
	period?: "1y" | "3y" | "5y";
}

export interface RiskReturnResponse {
	risk_return_data: RiskReturnData[];
}

export interface ExplainRequest {
	investment_amount: number;
	risk_tolerance: "conservative" | "moderate" | "aggressive";
	investment_horizon: number;
	method?: "accurate";
}

export interface ExplainResponse {
	feature_importance: FeatureImportance[];
	attention_weights: AttentionWeight[];
	explanation_text: string;
}

export interface HistoricalPerformanceRequest {
	portfolio_allocation: Array<{ symbol: string; weight: number }>;
	period?: "1y" | "3y" | "5y";
}

// 반응형 디자인 관련
export interface ScreenSize {
	isMobile: boolean;
	isTablet: boolean;
	isDesktop: boolean;
}

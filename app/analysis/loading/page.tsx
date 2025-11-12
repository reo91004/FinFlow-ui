"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Brain, Activity, BarChart3, TrendingUp, Shield, CheckCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiCallWithRetry } from "@/lib/config";
import { AnalysisType } from "@/lib/types";
import { useRequireAuth } from "@/hooks/use-require-auth";

// 분석 단계 정의 (실제 API 호출과 연동)
const analysisSteps = [
	{
		id: 1,
		title: "투자 정보 검증",
		description: "투자 금액과 선택한 분석 옵션을 검증하고 있습니다",
		icon: CheckCircle,
		apiCall: null, // 검증만 하므로 API 호출 없음
		duration: 2000, // 사용자에게 피드백을 주기 위한 기본 지연
		progress: 10,
	},
	{
		id: 2,
		title: "AI 포트폴리오 생성",
		description: "강화학습 모델이 최적의 자산 배분을 계산하고 있습니다",
		icon: Brain,
		apiCall: "portfolio",
		duration: 2000,
		progress: 35,
	},
	{
		id: 3,
		title: "성과 지표 계산",
		description: "백테스트 기반 성과 히스토리를 생성하고 있습니다",
		icon: TrendingUp,
		apiCall: "performance",
		duration: 2000,
		progress: 55,
	},
	{
		id: 4,
		title: "상관관계 분석",
		description: "종목 간 상관관계를 실시간으로 계산하고 있습니다",
		icon: Activity,
		apiCall: "correlation",
		duration: 2000,
		progress: 70,
	},
	{
		id: 5,
		title: "위험도 분석",
		description: "각 종목의 위험-수익률 특성을 분석하고 있습니다",
		icon: Shield,
		apiCall: "riskReturn",
		duration: 2000,
		progress: 85,
	},
	{
		id: 6,
		title: "AI 설명 생성",
		description: "투자 결정 근거와 해석 가능한 설명을 생성하고 있습니다",
		icon: BarChart3,
		apiCall: "xai",
		duration: 2000,
		progress: 100,
	},
];

// 실제 로딩 화면 컴포넌트
function AnalysisLoadingContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { user, loading } = useRequireAuth();
	const [currentStep, setCurrentStep] = useState(0);
	const [progress, setProgress] = useState(0);
	const [isCompleted, setIsCompleted] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// URL 파라미터에서 분석 데이터 가져오기
	const investmentAmount = searchParams.get("amount") || "1000000";
	const riskToleranceNum = searchParams.get("risk") || "5";
	const investmentHorizon = searchParams.get("horizon") || "12";
	const analysisType = (searchParams.get("analysisType") as AnalysisType) || "backtesting";
	const analysisTypeLabel = analysisType === "live" ? "라이브 분석" : "백테스팅 분석";
	const analysisTypeDescription = analysisType === "live" ? "실거래 계좌와 연동하여 초단기 변동성까지 반영합니다" : "히스토리컬 데이터를 기반으로 전략을 안정적으로 검증합니다";

	// Risk tolerance를 백엔드 형식으로 매핑
	const mapRiskTolerance = (risk: string): string => {
		const riskNum = Number(risk);
		if (riskNum <= 3) return "conservative";
		if (riskNum <= 6) return "moderate";
		return "aggressive";
	};

	const riskTolerance = mapRiskTolerance(riskToleranceNum);

	// 실제 API 호출을 수행하는 함수들
	const apiCalls = {
		portfolio: async () => {
			return await apiCallWithRetry("/predict", {
				method: "POST",
				body: JSON.stringify({
					investment_amount: Number(investmentAmount),
					risk_tolerance: riskTolerance,
					investment_horizon: Number(investmentHorizon),
				}),
			});
		},
		performance: async (portfolioData: any) => {
			if (!portfolioData?.allocation) return null;

			return await apiCallWithRetry("/historical-performance", {
				method: "POST",
				body: JSON.stringify({
					portfolio_allocation: portfolioData.allocation.map((item: any) => ({
						symbol: item.symbol,
						weight: item.weight,
					})),
				}),
			});
		},
		correlation: async (portfolioData: any) => {
			if (!portfolioData?.allocation) return null;

			const tickers = portfolioData.allocation.filter((item: any) => item.symbol !== "현금").map((item: any) => item.symbol);

			return await apiCallWithRetry("/correlation-analysis", {
				method: "POST",
				body: JSON.stringify({
					tickers,
					period: "1y",
				}),
			});
		},
		riskReturn: async (portfolioData: any) => {
			if (!portfolioData?.allocation) return null;

			return await apiCallWithRetry("/risk-return-analysis", {
				method: "POST",
				body: JSON.stringify({
					portfolio_allocation: portfolioData.allocation.map((item: any) => ({
						symbol: item.symbol,
						weight: item.weight,
					})),
				}),
			});
		},
		xai: async () => {
			return await apiCallWithRetry("/explain", {
				method: "POST",
				body: JSON.stringify({
					investment_amount: Number(investmentAmount),
					risk_tolerance: riskTolerance,
					investment_horizon: Number(investmentHorizon),
					method: "accurate",
				}),
			});
		},
	};

	useEffect(() => {
		if (loading || !user) {
			return;
		}
		runAnalysis();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [loading, user]);

	const runAnalysis = async () => {
		let stepIndex = 0;
		let portfolioData: any = null;
		const results: { [key: string]: any } = {};

		try {
			for (const step of analysisSteps) {
				setCurrentStep(stepIndex);

				// 프로그레스 바 애니메이션
				const startProgress = stepIndex === 0 ? 0 : analysisSteps[stepIndex - 1].progress;
				const endProgress = step.progress;

				// 모든 단계에서 최소 지연 시간 보장
				const stepStartTime = Date.now();

				// 실제 API 호출이 있는 경우
				if (step.apiCall && apiCalls[step.apiCall as keyof typeof apiCalls]) {
					try {
						console.log(`API 호출 시작: ${step.apiCall}`);

						// 프로그레스 중간값으로 설정
						setProgress(startProgress + (endProgress - startProgress) * 0.3);

						const apiCallFn = apiCalls[step.apiCall as keyof typeof apiCalls];
						let result;

						// 포트폴리오 데이터가 필요한 API들
						if (["performance", "correlation", "riskReturn"].includes(step.apiCall)) {
							result = await apiCallFn(portfolioData);
						} else {
							result = await apiCallFn();
						}

						results[step.apiCall] = result;

						// 포트폴리오 데이터는 다른 API 호출에서 필요하므로 저장
						if (step.apiCall === "portfolio") {
							portfolioData = result;
						}

						console.log(`API 호출 완료: ${step.apiCall}`);

						// 프로그레스 80%로 설정
						setProgress(startProgress + (endProgress - startProgress) * 0.8);
					} catch (apiError) {
						console.error(`API 호출 실패: ${step.apiCall}`, apiError);

						// API 실패 시에도 계속 진행 (폴백 데이터 사용)
						results[step.apiCall] = null;
					}
				}

				// 각 단계마다 최소 지연 시간 보장
				const elapsedTime = Date.now() - stepStartTime;
				const remainingTime = Math.max(0, step.duration - elapsedTime);

				if (remainingTime > 0) {
					await new Promise((resolve) => setTimeout(resolve, remainingTime));
				}

				// 최종 프로그레스로 설정
				setProgress(endProgress);
				stepIndex++;
			}

			setIsCompleted(true);

			// URL 파라미터 구성 (결과 페이지로 전달)
			const params = new URLSearchParams();
			params.set("amount", investmentAmount);
			params.set("risk", riskToleranceNum);
			params.set("horizon", investmentHorizon);
			params.set("analysisType", analysisType);

			// 2초 후 결과 페이지로 이동
			setTimeout(() => {
				router.push(`/analysis/results?${params.toString()}`);
			}, 2000);
		} catch (error) {
			console.error("분석 실행 중 오류:", error);
			setError("분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
			setIsCompleted(false);
		}
	};

	const currentStepData = analysisSteps[currentStep];

	const handleRetry = () => {
		setError(null);
		setCurrentStep(0);
		setProgress(0);
		setIsCompleted(false);
		runAnalysis();
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
			</div>
		);
	}

	if (!user) {
		return null;
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center p-4">
			{/* 배경 패턴 */}
			<div className="absolute inset-0 bg-white dark:bg-black bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30"></div>

			<div className="relative max-w-2xl w-full space-y-8">
				{/* 헤더 */}
				<div className="text-center space-y-4">
					<div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center relative overflow-hidden shadow-2xl">
						<Brain className="w-10 h-10 text-white relative z-10" />
						{/* 반짝이는 빛 효과 */}
						<div
							className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 -translate-x-full"
							style={{
								animation: "shimmer 2s infinite",
							}}
						/>
					</div>
					<h1 className="text-3xl font-bold">AI 포트폴리오 분석</h1>
					<p className="text-muted-foreground">투자 금액 {Number(investmentAmount).toLocaleString()}원을 분석하고 있습니다</p>
				</div>

				{/* 선택한 분석 유형 요약 */}
				{currentStep < 5 && !error && (
					<Card className="backdrop-blur-sm bg-gradient-to-r from-purple-50/90 to-blue-50/90 dark:from-purple-950/90 dark:to-blue-950/90 border border-purple-200/50 dark:border-purple-700/50 rounded-3xl shadow-lg">
						<CardContent className="p-6">
							<div className="space-y-4">
								<div className="flex items-center space-x-3">
									<div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
										<Brain className="h-6 w-6 text-white" />
									</div>
									<div>
										<h3 className="text-lg font-bold">분석 유형</h3>
										<p className="text-sm text-muted-foreground">선택한 방식에 맞춰 IRT 모델을 실행합니다</p>
									</div>
								</div>
								<div className="bg-white/60 dark:bg-gray-900/50 rounded-2xl p-4 space-y-3 border border-white/40 dark:border-gray-800/60">
									<div className="flex items-center justify-between">
										<div>
											<p className="text-xs font-semibold text-purple-600 dark:text-purple-300 tracking-widest">SELECTED</p>
											<p className="text-xl font-bold mt-1">{analysisTypeLabel}</p>
										</div>
										<Badge variant={analysisType === "live" ? "outline" : "secondary"} className="rounded-2xl px-3 py-1">
											{analysisType === "live" ? "준비 중" : "활성"}
										</Badge>
									</div>
									<p className="text-sm text-muted-foreground">{analysisTypeDescription}</p>
									{analysisType === "live" ? (
										<p className="text-xs text-amber-600 dark:text-amber-400">라이브 분석은 아직 비활성화되어 있습니다. 백테스팅 분석으로 자동 진행됩니다.</p>
									) : (
										<p className="text-xs text-blue-600 dark:text-blue-300">백테스팅 분석 결과는 IRT 모델 입력값에 최적화되어 설명 가능성을 보장합니다.</p>
									)}
								</div>
							</div>
						</CardContent>
					</Card>
				)}

				{/* 프로그레스 바 */}
				<div className="space-y-4">
					<div className="flex justify-between items-center">
						<span className="text-sm font-medium">분석 진행률</span>
						<span className="text-sm font-medium text-blue-600">{Math.round(progress)}%</span>
					</div>
					<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-2xl h-3 overflow-hidden">
						<div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
					</div>
				</div>

				{/* 오류 상태 */}
				{error && (
					<div className="backdrop-blur-sm bg-red-50/90 dark:bg-red-950/90 border border-red-200/50 dark:border-red-800/50 rounded-3xl shadow-xl p-8">
						<div className="text-center space-y-4">
							<div className="w-16 h-16 mx-auto bg-red-500 rounded-2xl flex items-center justify-center shadow-lg">
								<AlertTriangle className="w-8 h-8 text-white" />
							</div>
							<h3 className="text-xl font-bold text-red-600 dark:text-red-400">분석 중 오류 발생</h3>
							<p className="text-red-800 dark:text-red-200">{error}</p>
							<Button onClick={handleRetry} className="bg-red-600 hover:bg-red-700 rounded-2xl">
								다시 시도
							</Button>
						</div>
					</div>
				)}

				{/* 현재 단계 */}
				{!isCompleted && currentStepData && !error && (
					<div className="backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 border border-gray-200/50 dark:border-gray-700/50 rounded-3xl shadow-xl p-8">
						<div className="flex items-center space-x-6">
							<div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
								<currentStepData.icon className="w-8 h-8 text-white" />
							</div>
							<div className="flex-1">
								<h3 className="text-xl font-bold mb-2">{currentStepData.title}</h3>
								<p className="text-muted-foreground">{currentStepData.description}</p>

								{/* API 호출 상태 표시 */}
								{currentStepData.apiCall && (
									<div className="mt-3 flex items-center space-x-2">
										<div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
										<span className="text-xs text-blue-600 font-medium">데이터 처리 중...</span>
									</div>
								)}
							</div>
						</div>
					</div>
				)}

				{/* 완료 상태 */}
				{isCompleted && (
					<div className="backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 border border-green-200/50 dark:border-green-700/50 rounded-3xl shadow-xl p-8">
						<div className="text-center space-y-4">
							<div className="w-16 h-16 mx-auto bg-green-500 rounded-2xl flex items-center justify-center shadow-lg">
								<CheckCircle className="w-8 h-8 text-white" />
							</div>
							<h3 className="text-xl font-bold text-green-600 dark:text-green-400">분석 완료!</h3>
							<p className="text-muted-foreground">결과 페이지로 이동하고 있습니다</p>

							{/* 완료 상태에서의 요약 정보 */}
							<div className="mt-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-2xl border border-green-200 dark:border-green-800/30">
								<div className="grid grid-cols-2 gap-4 text-sm">
									<div>
										<span className="text-muted-foreground">투자 금액:</span>
										<span className="ml-2 font-medium">{Number(investmentAmount).toLocaleString()}원</span>
									</div>
									<div>
										<span className="text-muted-foreground">분석 유형:</span>
										<span className="ml-2 font-medium">{analysisTypeLabel}</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* 단계별 표시 */}
				<div className="grid grid-cols-6 gap-2">
					{analysisSteps.map((step, index) => {
						const isActive = index === currentStep;
						const isStepCompleted = index < currentStep || isCompleted;
						const isPending = index > currentStep;

						return (
							<div key={step.id} className="text-center space-y-2">
								<div
									className={`w-10 h-10 mx-auto rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md ${
										isActive
											? "bg-blue-500 text-white scale-110 shadow-blue-500/25"
											: isStepCompleted
											? "bg-green-500 text-white"
											: isPending
											? "bg-gray-200 dark:bg-gray-700 text-muted-foreground"
											: "bg-gray-200 dark:bg-gray-700 text-muted-foreground"
									}`}
								>
									{isStepCompleted && index < currentStep ? <CheckCircle className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
								</div>
								<div className={`text-xs font-medium transition-colors duration-300 ${isActive ? "text-blue-600" : isStepCompleted ? "text-green-600" : "text-muted-foreground"}`}>{step.title}</div>

								{/* API 호출 표시 */}
								{step.apiCall && (
									<div className="text-xs text-muted-foreground">
										{isActive && (
											<Badge variant="secondary" className="text-xs px-1 py-0 rounded-md">
												API
											</Badge>
										)}
									</div>
								)}
							</div>
						);
					})}
				</div>

				{/* 푸터 메시지 */}
				<div className="text-center text-sm text-muted-foreground space-y-2">
					<p>AI가 실시간으로 시장 데이터를 분석하여 최적화된 포트폴리오를 생성합니다</p>
					<p className="text-xs">분석이 완료되면 자동으로 결과 페이지로 이동합니다</p>
				</div>

				{/* 장식적 요소 */}
				<div className="absolute -top-10 -right-10 -z-10 h-[200px] w-[200px] rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-3xl opacity-70"></div>
				<div className="absolute -bottom-10 -left-10 -z-10 h-[200px] w-[200px] rounded-full bg-gradient-to-br from-purple-400/20 to-blue-400/20 blur-3xl opacity-70"></div>
			</div>

			{/* 커스텀 애니메이션 스타일 */}
			<style jsx>{`
				@keyframes shimmer {
					0% {
						transform: translateX(-100%) skewX(-12deg);
					}
					100% {
						transform: translateX(200%) skewX(-12deg);
					}
				}
			`}</style>
		</div>
	);
}

export default function AnalysisLoadingPage() {
	return (
		<Suspense
			fallback={
				<div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center p-4">
					{/* 배경 패턴 */}
					<div className="absolute inset-0 bg-white dark:bg-black bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30"></div>

					<div className="relative max-w-2xl w-full space-y-8">
						<div className="text-center space-y-4">
							<div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
								<Brain className="w-10 h-10 text-white" />
							</div>
							<h1 className="text-3xl font-bold">AI 포트폴리오 분석</h1>
							<p className="text-muted-foreground">분석을 준비하고 있습니다</p>
						</div>
					</div>
				</div>
			}
		>
			<AnalysisLoadingContent />
		</Suspense>
	);
}

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { AnalysisType } from "@/lib/types";

interface AnalysisOption {
	value: AnalysisType;
	label: string;
	description: string;
	disabled?: boolean;
}

const analysisOptions: AnalysisOption[] = [
	{
		value: "live",
		label: "라이브 분석",
		description: "실거래 계좌와 연동되어 실시간으로 포트폴리오를 미세 조정합니다",
		disabled: true,
	},
	{
		value: "backtesting",
		label: "백테스팅 분석",
		description: "히스토리컬 데이터를 기반으로 IRT 모델을 안정적으로 실행합니다",
	},
];

export default function OnboardingPage() {
	const { user, loading } = useRequireAuth();
	const [investmentAmount, setInvestmentAmount] = useState("");
	const [analysisType, setAnalysisType] = useState<AnalysisType>("backtesting");
	const router = useRouter();

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

	const handleStart = () => {
		if (!investmentAmount) return;

		const params = new URLSearchParams();
		params.set("amount", investmentAmount.replace(/,/g, ""));
		params.set("analysisType", analysisType);

		router.push(`/analysis?${params.toString()}`);
	};

	const isValid = investmentAmount !== "" && analysisType === "backtesting";

	const selectedOption = analysisOptions.find((option) => option.value === analysisType);

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-white dark:bg-black bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30"></div>

			<div className="relative w-full max-w-md">
				<div className="text-center mb-8">
					<Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
						<ArrowLeft className="size-4" />
						돌아가기
					</Link>
					<div className="font-bold text-2xl mb-2">FinFlow</div>
					<p className="text-muted-foreground">투자 금액을 입력하고 원하는 분석 방식을 선택하세요</p>
				</div>

				<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
					<Card className="backdrop-blur-sm bg-white/90 dark:bg-gray-900/90 border border-gray-200/50 dark:border-gray-700/50 rounded-3xl shadow-xl">
						<CardContent className="p-8 space-y-8">
							<div className="text-center">
								<h2 className="text-2xl font-bold mb-2">투자 금액</h2>
								<p className="text-muted-foreground">IRT 모델 학습에 사용할 자본 규모를 알려주세요</p>
							</div>
							<div className="space-y-2">
								<Label htmlFor="amount">투자 금액 (원)</Label>
								<Input
									id="amount"
									type="text"
									placeholder="예: 1,000,000"
									value={investmentAmount}
									onChange={(e) => {
										const value = e.target.value.replace(/[^\d,]/g, "");
										setInvestmentAmount(value);
									}}
									className="h-12 text-lg rounded-2xl"
								/>
							</div>
							<div className="grid grid-cols-2 gap-3">
								{["500,000", "1,000,000", "3,000,000", "5,000,000"].map((amount) => (
									<Button key={amount} variant="outline" className="h-12 rounded-2xl" onClick={() => setInvestmentAmount(amount)}>
										{amount}원
									</Button>
								))}
							</div>

							<div className="space-y-3 pt-4 border-t border-dashed border-gray-200 dark:border-gray-800">
								<div className="text-center">
									<h3 className="text-lg font-semibold">분석 유형 선택</h3>
									<p className="text-sm text-muted-foreground">백테스팅 분석만 현재 활성화되어 있습니다</p>
								</div>
								<div className="flex flex-col gap-3 md:flex-row">
									{analysisOptions.map((option) => {
										const isSelected = analysisType === option.value;
										const isDisabled = option.disabled;

										return (
											<button
												key={option.value}
												type="button"
												disabled={isDisabled}
												onClick={() => {
													if (!isDisabled) {
														setAnalysisType(option.value);
													}
												}}
												className={`w-full md:flex-1 text-left p-4 rounded-2xl border transition-all duration-200 ${
													isSelected && !isDisabled
														? "border-blue-600 bg-blue-50 dark:bg-blue-950/50 shadow-inner"
														: "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/60"
												} ${isDisabled ? "opacity-60 cursor-not-allowed" : ""}`}
											>
												<div className="flex items-center justify-between">
													<div className="font-semibold">{option.label}</div>
													{isDisabled ? (
														<div className="flex items-center gap-2 text-xs text-muted-foreground">
															<Lock className="size-4" />
															<span>준비 중</span>
														</div>
													) : (
														isSelected && (
															<div className="flex items-center gap-2 text-sm text-blue-600">
																<CheckCircle2 className="size-4" />
																<span>선택됨</span>
															</div>
														)
													)}
												</div>
												<p className="text-sm text-muted-foreground mt-2">{option.description}</p>
											</button>
										);
									})}
								</div>
								<div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200/60 dark:border-blue-900/40">
									<div className="text-sm text-muted-foreground">
										현재는 <span className="font-semibold text-blue-600 dark:text-blue-300">백테스팅 분석</span>만 IRT 입력값으로 사용됩니다. 실시간 라이브 분석은 추후 업데이트될 예정입니다.
									</div>
								</div>
							</div>

							<Button
								onClick={handleStart}
								disabled={!isValid}
								className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white"
							>
								{selectedOption ? `${selectedOption.label} 시작하기` : "분석 시작하기"}
								<ArrowRight className="size-4 ml-2" />
							</Button>
						</CardContent>
					</Card>
				</motion.div>

				<div className="absolute -top-10 -right-10 -z-10 h-[200px] w-[200px] rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-3xl opacity-70"></div>
				<div className="absolute -bottom-10 -left-10 -z-10 h-[200px] w-[200px] rounded-full bg-gradient-to-br from-purple-400/20 to-blue-400/20 blur-3xl opacity-70"></div>
			</div>
		</div>
	);
}

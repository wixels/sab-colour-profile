const IDENTITY_STORAGE_KEY = "sab-colour-profile.identity";
const ASSESSMENT_DRAFT_STORAGE_KEY = "sab-colour-profile.assessment-draft";

export type LocalIdentity = {
	personId: string;
	emailNormalized: string;
	name: string;
	surname: string;
	group: string;
};

export type AssessmentDraft = {
	questionIndex: number;
	answersByQuestionId: Record<string, string>;
};

const canUseLocalStorage = () => typeof window !== "undefined";

export const saveLocalIdentity = (identity: LocalIdentity) => {
	if (!canUseLocalStorage()) {
		return;
	}

	window.localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(identity));
};

export const loadLocalIdentity = (): LocalIdentity | null => {
	if (!canUseLocalStorage()) {
		return null;
	}

	const raw = window.localStorage.getItem(IDENTITY_STORAGE_KEY);
	if (!raw) {
		return null;
	}

	try {
		const parsed = JSON.parse(raw) as
			| (Partial<LocalIdentity> & { email?: string })
			| null;
		if (!parsed?.personId) {
			return null;
		}
		const emailNormalized =
			parsed.emailNormalized ?? parsed.email?.trim().toLowerCase() ?? "";
		if (!emailNormalized) {
			return null;
		}
		return {
			personId: parsed.personId,
			emailNormalized,
			name: parsed.name ?? "",
			surname: parsed.surname ?? "",
			group: parsed.group ?? "",
		};
	} catch {
		return null;
	}
};

export const clearLocalIdentity = () => {
	if (!canUseLocalStorage()) {
		return;
	}

	window.localStorage.removeItem(IDENTITY_STORAGE_KEY);
};

export const saveAssessmentDraft = (draft: AssessmentDraft) => {
	if (!canUseLocalStorage()) {
		return;
	}

	window.localStorage.setItem(
		ASSESSMENT_DRAFT_STORAGE_KEY,
		JSON.stringify(draft),
	);
};

export const loadAssessmentDraft = (): AssessmentDraft | null => {
	if (!canUseLocalStorage()) {
		return null;
	}

	const raw = window.localStorage.getItem(ASSESSMENT_DRAFT_STORAGE_KEY);
	if (!raw) {
		return null;
	}

	try {
		const parsed = JSON.parse(raw) as AssessmentDraft;
		return {
			questionIndex: Number.isFinite(parsed?.questionIndex)
				? Math.max(0, parsed.questionIndex)
				: 0,
			answersByQuestionId: parsed?.answersByQuestionId ?? {},
		};
	} catch {
		return null;
	}
};

export const clearAssessmentDraft = () => {
	if (!canUseLocalStorage()) {
		return;
	}

	window.localStorage.removeItem(ASSESSMENT_DRAFT_STORAGE_KEY);
};

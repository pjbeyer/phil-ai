import { z } from "zod";

export const EventContext = ["work", "personal", "oss"] as const;
export type EventContextType = (typeof EventContext)[number];

export const EventRole = ["maintainer", "contributor", "observer"] as const;
export type EventRoleType = (typeof EventRole)[number];

export const WorkflowWorkType = [
	"feature",
	"bug",
	"chore",
	"refactor",
] as const;
export type WorkflowWorkTypeType = (typeof WorkflowWorkType)[number];

export const LearningAction = ["captured", "implemented", "closed"] as const;
export type LearningActionType = (typeof LearningAction)[number];

export const ContributionType = ["pr", "issue", "review", "commit"] as const;
export type ContributionTypeType = (typeof ContributionType)[number];

export const DocAction = [
	"created",
	"updated",
	"published",
	"archived",
] as const;
export type DocActionType = (typeof DocAction)[number];

export const DocAudience = ["human", "machine", "team", "public"] as const;
export type DocAudienceType = (typeof DocAudience)[number];

const WorkflowDateRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

function workflowDateToIso(value: unknown): unknown {
	if (typeof value !== "string") {
		return value;
	}

	if (!WorkflowDateRegex.test(value)) {
		return value;
	}

	return new Date(`${value.replace(" ", "T")}Z`).toISOString();
}

const WorkflowJsonlTimestampSchema = z.preprocess(
	workflowDateToIso,
	z.string().datetime(),
);

export const SystemEventSchema = z.object({
	id: z.string().uuid(),
	source: z.string(),
	context: z.enum(EventContext),
	role: z.enum(EventRole),
	eventType: z.string(),
	timestamp: z.string().datetime(),
	metadata: z.record(z.string(), z.unknown()).optional(),
});

export type SystemEvent = z.infer<typeof SystemEventSchema>;

export const WorkflowEventSchema = SystemEventSchema.extend({
	issueId: z.string(),
	branch: z.string(),
	profile: z.string(),
	workType: z.enum(WorkflowWorkType).optional(),
	duration: z.number().optional(),
});

export type WorkflowEvent = z.infer<typeof WorkflowEventSchema>;

export const LearningEventSchema = SystemEventSchema.extend({
	learningId: z.string(),
	action: z.enum(LearningAction),
	category: z.string().optional(),
});

export type LearningEvent = z.infer<typeof LearningEventSchema>;

export const ContributionEventSchema = SystemEventSchema.extend({
	repo: z.string(),
	contributionType: z.enum(ContributionType),
	externalId: z.string().optional(),
});

export type ContributionEvent = z.infer<typeof ContributionEventSchema>;

export const DocEventSchema = SystemEventSchema.extend({
	docPath: z.string(),
	action: z.enum(DocAction),
	audience: z.enum(DocAudience).optional(),
});

export type DocEvent = z.infer<typeof DocEventSchema>;

const WorkflowJsonlEventSchema = z.object({
	event: z.string(),
	profile: z.string(),
	date: WorkflowJsonlTimestampSchema,
	issue: z.string(),
	branch: z.string(),
	type: z.enum(WorkflowWorkType).optional(),
	duration: z.number().optional(),
});

type WorkflowJsonlEvent = z.infer<typeof WorkflowJsonlEventSchema>;

function toWorkflowEvent(rawEvent: WorkflowJsonlEvent): WorkflowEvent {
	const workflowEvent: WorkflowEvent = {
		id: crypto.randomUUID(),
		source: "phil-ai-workflow",
		context: "work",
		role: "maintainer",
		eventType: rawEvent.event,
		timestamp: rawEvent.date,
		issueId: rawEvent.issue,
		branch: rawEvent.branch,
		profile: rawEvent.profile,
		...(rawEvent.type !== undefined ? { workType: rawEvent.type } : {}),
		...(rawEvent.duration !== undefined ? { duration: rawEvent.duration } : {}),
	};

	return WorkflowEventSchema.parse(workflowEvent);
}

export function parseWorkflowJsonl(line: string): WorkflowEvent {
	const raw = JSON.parse(line) as unknown;
	const parsed = WorkflowJsonlEventSchema.parse(raw);
	return toWorkflowEvent(parsed);
}

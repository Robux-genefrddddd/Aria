export interface AriaSubagent {
	id: string;
	name: string;
	role: string;
	description: string;
	model: 'aria-code' | 'aria-reflection' | 'aria-basic' | 'aria-plus';
	icon?: string;
	systemPrompt: string;
	tags?: string[];
	isBuiltin?: boolean;
	createdAt?: number;
	updatedAt?: number;
}

export interface SubagentExecutionTask {
	id: string;
	subagentId: string;
	subagentName: string;
	task: string;
	status: 'pending' | 'running' | 'completed' | 'failed';
	result?: string;
	error?: string;
	modelUsed?: string;
	durationMs?: number;
	timestamp: number;
}

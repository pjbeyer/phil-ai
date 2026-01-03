import { z } from "zod";

export const SemverRegex = /^\d+\.\d+\.\d+$/;

export const VersionedDataSchema = z.object({
	_version: z.string().regex(SemverRegex),
	_created: z.string().datetime(),
	_modified: z.string().datetime(),
});

export type VersionedData = z.infer<typeof VersionedDataSchema>;

export function createVersionedData(version: string): VersionedData {
	const now = new Date().toISOString();
	return {
		_version: version,
		_created: now,
		_modified: now,
	};
}

export function updateVersionedData<T extends VersionedData>(data: T): T {
	return {
		...data,
		_modified: new Date().toISOString(),
	};
}

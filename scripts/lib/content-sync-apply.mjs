import { mkdir, rename } from 'node:fs/promises';
import path from 'node:path';

export const applyImageSyncPlan = async (
	moves,
	{
		makeDirectory = (directoryPath) => mkdir(directoryPath, { recursive: true }),
		moveFile = rename,
	} = {},
) => {
	const completedMoves = [];

	for (const [index, move] of moves.entries()) {
		try {
			await makeDirectory(path.dirname(move.to));
			await moveFile(move.from, move.to);
			completedMoves.push(move);
		} catch (error) {
			return {
				completedMoves,
				error,
				failedMove: move,
				remainingMoves: moves.slice(index),
			};
		}
	}

	return {
		completedMoves,
		error: null,
		failedMove: null,
		remainingMoves: [],
	};
};

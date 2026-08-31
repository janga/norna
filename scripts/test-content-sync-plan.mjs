import assert from 'node:assert/strict';
import path from 'node:path';

import { applyImageSyncPlan } from './lib/content-sync-apply.mjs';
import { createImageSyncPlan } from './lib/content-sync-plan.mjs';

const page = (directoryName) => ({
	contentLabel: `site/pages/${directoryName}/content.md`,
	imagesDir: path.join('/project/site/pages', directoryName, 'images'),
	imagesLabel: `site/pages/${directoryName}/images`,
});
const section = (id) => ({ id, title: id });
const managedImage = (image) => ({ image });

const homePage = page('000-home');
const aboutPage = page('010-about');
const contactPage = page('020-contact');

{
	const reference = managedImage('portrait.jpg');
	const sourcePath = path.join(homePage.imagesDir, 'portrait.jpg');
	const targetPath = path.join(aboutPage.imagesDir, 'portrait.jpg');
	const plan = createImageSyncPlan({
		imageCandidates: [{ contentFile: homePage, imageName: 'portrait.jpg', imagePath: sourcePath }],
		references: [{ contentFile: aboutPage, section: section('team'), reference }],
		reportMisplaced: false,
	});

	assert.deepEqual(plan.issues, []);
	assert.equal(plan.moves.length, 1);
	assert.equal(plan.moves[0].from, sourcePath);
	assert.equal(plan.moves[0].to, targetPath);
	assert.equal(plan.resolvedPathByReference.get(reference), sourcePath);
	assert.deepEqual([...plan.referencedImagePaths], [sourcePath]);
}

{
	const reference = managedImage('portrait.jpg');
	const plan = createImageSyncPlan({
		imageCandidates: [
			{
				contentFile: homePage,
				imageName: 'portrait.jpg',
				imagePath: path.join(homePage.imagesDir, 'portrait.jpg'),
			},
			{
				contentFile: contactPage,
				imageName: 'portrait.jpg',
				imagePath: path.join(contactPage.imagesDir, 'portrait.jpg'),
			},
		],
		references: [{ contentFile: aboutPage, section: section('team'), reference }],
		reportMisplaced: false,
	});

	assert.equal(plan.moves.length, 0);
	assert.equal(plan.issues.length, 1);
	assert.match(plan.issues[0].issue.message, /Multiple files with this filename were found/);
	assert.equal(plan.resolvedPathByReference.has(reference), false);
}

{
	const sourceReference = managedImage('portrait.jpg');
	const targetReference = managedImage('portrait.jpg');
	const sourcePath = path.join(homePage.imagesDir, 'portrait.jpg');
	const plan = createImageSyncPlan({
		imageCandidates: [{ contentFile: homePage, imageName: 'portrait.jpg', imagePath: sourcePath }],
		references: [
			{ contentFile: homePage, section: section('intro'), reference: sourceReference },
			{ contentFile: aboutPage, section: section('team'), reference: targetReference },
		],
		reportMisplaced: false,
	});

	assert.equal(plan.moves.length, 0);
	assert.equal(plan.issues.length, 1);
	assert.match(plan.issues[0].issue.message, /it is still referenced from site\/pages\/000-home\/content\.md \[intro\]/);
	assert.equal(plan.resolvedPathByReference.get(sourceReference), sourcePath);
	assert.equal(plan.resolvedPathByReference.has(targetReference), false);
}

{
	const moves = [
		{ imageName: 'one.jpg', from: '/source/one.jpg', to: '/target/one.jpg' },
		{ imageName: 'two.jpg', from: '/source/two.jpg', to: '/target/two.jpg' },
		{ imageName: 'three.jpg', from: '/source/three.jpg', to: '/target/three.jpg' },
	];
	const madeDirectories = [];
	const movedFiles = [];
	const failure = Object.assign(new Error('read-only destination'), { code: 'EACCES' });
	const result = await applyImageSyncPlan(moves, {
		makeDirectory: async (directoryPath) => madeDirectories.push(directoryPath),
		moveFile: async (from, to) => {
			movedFiles.push([from, to]);
			if (from.endsWith('/two.jpg')) throw failure;
		},
	});

	assert.deepEqual(result.completedMoves, [moves[0]]);
	assert.equal(result.failedMove, moves[1]);
	assert.equal(result.error, failure);
	assert.deepEqual(result.remainingMoves, [moves[1], moves[2]]);
	assert.deepEqual(madeDirectories, ['/target', '/target']);
	assert.deepEqual(movedFiles, [
		['/source/one.jpg', '/target/one.jpg'],
		['/source/two.jpg', '/target/two.jpg'],
	]);
}

console.log('Content sync planning and apply tests passed.');

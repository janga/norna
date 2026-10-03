function describeOrderChanges(plan) {
 const changes = plan.orderChanges ?? [];
 if (!changes.length) return '';
 return `This placement requires new order values for ${changes.length} existing sibling page(s). Their content.md files will be updated:\n` + changes.map(change => `• ${change.contentPath}: ${change.oldOrder ?? 'unset'} → ${change.newOrder}`).join('\n');
}
module.exports = { describeOrderChanges };

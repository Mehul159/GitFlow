# Changelog

## 0.1.0

- Initial release
- Interactive commit graph canvas (React Flow)
- Branch tree view with folder grouping and stale detection
- Drag-to-merge between branch cards
- AI commit message suggestions (Gemini / Groq)
- Full git operations: commit, push, pull, fetch, merge, rebase, cherry-pick, stash, tags, remotes
- Command palette with keyboard shortcuts
- Detail panel with commit info, parent navigation, and inline actions
- Context menu on commit nodes (checkout, cherry-pick, branch here, reset)
- Commit search/filter on the graph
- Load more pagination for large repositories
- Conflict detection and resolution guidance
- Accessibility: focus trap in modals, keyboard navigation, ARIA roles
- Security: input validation on all git command arguments, path containment checks

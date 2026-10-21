// Protects main with two repository rulesets (QA-020). Run once, or again after changing the pipeline's job names:
//   node scripts/setup-branch-protection.mjs
//
// 1. "main: PR y pipeline": no direct pushes, no force pushes or deletion, required checks green. Nobody bypasses it.
// 2. "main: revisión humana": one approving review from a code owner. The admin may bypass it only when merging a
//    pull request (GitHub does not let anyone approve their own PR); PRs opened by agents or bots always need it.
import { execFileSync } from 'node:child_process'

const repo = execFileSync('gh', ['repo', 'view', '--json', 'nameWithOwner', '--jq', '.nameWithOwner']).toString().trim()

// Must match the `name` of the jobs in .github/workflows/pipeline.yml and governance.yml.
const REQUIRED_CHECKS = ['1 · Análisis estático', '2 · Tienda en el runner', '3 · Smoke y E2E', 'Gobierno del PR']

const target = { ref_name: { include: ['~DEFAULT_BRANCH'], exclude: [] } }

const rulesets = [
  {
    name: 'main: PR y pipeline',
    target: 'branch',
    enforcement: 'active',
    conditions: target,
    bypass_actors: [],
    rules: [
      { type: 'deletion' },
      { type: 'non_fast_forward' },
      {
        type: 'pull_request',
        parameters: {
          required_approving_review_count: 0,
          dismiss_stale_reviews_on_push: false,
          require_code_owner_review: false,
          require_last_push_approval: false,
          required_review_thread_resolution: false,
          allowed_merge_methods: ['merge'],
        },
      },
      {
        type: 'required_status_checks',
        parameters: {
          strict_required_status_checks_policy: true,
          required_status_checks: REQUIRED_CHECKS.map((context) => ({ context })),
        },
      },
    ],
  },
  {
    name: 'main: revisión humana',
    target: 'branch',
    enforcement: 'active',
    conditions: target,
    // actor_id 5 = repository role "Admin"; bypass only through a pull request, never by direct push.
    bypass_actors: [{ actor_id: 5, actor_type: 'RepositoryRole', bypass_mode: 'pull_request' }],
    rules: [
      {
        type: 'pull_request',
        parameters: {
          required_approving_review_count: 1,
          dismiss_stale_reviews_on_push: true,
          require_code_owner_review: true,
          require_last_push_approval: false,
          required_review_thread_resolution: false,
          allowed_merge_methods: ['merge'],
        },
      },
    ],
  },
]

const gh = (args, input) =>
  JSON.parse(execFileSync('gh', ['api', ...args], { input: input && JSON.stringify(input) }).toString() || 'null')

const existing = gh([`repos/${repo}/rulesets`])
for (const ruleset of rulesets) {
  const current = existing.find((r) => r.name === ruleset.name)
  const args = current
    ? ['-X', 'PUT', `repos/${repo}/rulesets/${current.id}`, '--input', '-']
    : ['-X', 'POST', `repos/${repo}/rulesets`, '--input', '-']
  const saved = gh(args, ruleset)
  console.log(`${current ? 'Actualizado' : 'Creado'}: ${saved.name} (id ${saved.id})`)
}
